import { clearPlannerCache, getCached, readCache, writeCache } from './cache';
import { cacheTtl, leavePropertyPrefix } from './constants';
import { deleteBoardProperty, getBoardPropertyDirect, getBoardPropertyKeys, setBoardPropertyDirect } from './jira-api';
import { addDaysToKey, getLeaveRetentionStart, isSameLeaveSet, maxLeaveEntriesPerRequest, overlapsRange, sanitizeLeaveEntry } from './leave-records';
import { ensureStorageAllowed } from './storage-consent';
import type { LeaveEntry } from './types';

export const leaveNeedsBoardAdmin = true;

export interface LeaveChange {
    upsert: LeaveEntry[];
    remove: LeaveEntry[];
}

interface LeaveQuarterDocument {
    v: number;
    updated: string;
    entries: LeaveEntry[];
}

interface Quarter {
    key: string;
    label: string;
    start: string;
    end: string;
}

const quarterKeyPattern = new RegExp(`^${leavePropertyPrefix}(\\d{4})-Q([1-4])$`);

function toQuarter(year: number, quarter: number): Quarter {
    const startMonth = (quarter - 1) * 3;
    const start = `${year}-${String(startMonth + 1).padStart(2, '0')}-01`;
    const nextStart = quarter === 4 ? `${year + 1}-01-01` : `${year}-${String(startMonth + 4).padStart(2, '0')}-01`;
    return { key: `${leavePropertyPrefix}${year}-Q${quarter}`, label: `Leave of Q${quarter} ${year}`, start, end: addDaysToKey(nextStart, -1) };
}

function getQuarterOf(dateKey: string): Quarter {
    return toQuarter(Number(dateKey.substring(0, 4)), Math.floor((Number(dateKey.substring(5, 7)) - 1) / 3) + 1);
}

function getQuarters(start: string, end: string): Quarter[] {
    const quarters: Quarter[] = [];
    let current = getQuarterOf(start);
    while (current.start <= end && quarters.length < 40) {
        quarters.push(current);
        current = getQuarterOf(addDaysToKey(current.end, 1));
    }
    return quarters;
}

function splitByQuarter(entry: LeaveEntry): Map<string, LeaveEntry> {
    const pieces = new Map<string, LeaveEntry>();
    for (const quarter of getQuarters(entry.start, entry.end)) {
        pieces.set(quarter.key, {
            ...entry,
            start: entry.start > quarter.start ? entry.start : quarter.start,
            end: entry.end < quarter.end ? entry.end : quarter.end,
        });
    }
    return pieces;
}

function mergePieces(entries: LeaveEntry[]): LeaveEntry[] {
    const merged = new Map<string, LeaveEntry>();
    for (const entry of entries) {
        const existing = merged.get(entry.id);
        if (!existing) {
            merged.set(entry.id, { ...entry });
            continue;
        }
        existing.start = entry.start < existing.start ? entry.start : existing.start;
        existing.end = entry.end > existing.end ? entry.end : existing.end;
    }
    return [...merged.values()].sort((a, b) => a.start.localeCompare(b.start));
}

function getCacheKey(boardId: number, quarterKey: string): string {
    return `leave_${boardId}_${quarterKey}`;
}

async function readQuarter(boardId: number, quarterKey: string): Promise<LeaveEntry[]> {
    const doc = await getBoardPropertyDirect<LeaveQuarterDocument>(boardId, quarterKey);
    const entries = Array.isArray(doc?.entries) ? doc.entries : [];
    return entries.map(sanitizeLeaveEntry).filter((e): e is LeaveEntry => !!e);
}

async function writeQuarter(boardId: number, quarter: Quarter, entries: LeaveEntry[]): Promise<void> {
    if (entries.length) {
        const doc: LeaveQuarterDocument = { v: 1, updated: new Date().toISOString(), entries: entries.sort((a, b) => a.start.localeCompare(b.start)) };
        await setBoardPropertyDirect(boardId, quarter.key, doc, quarter.label);
    } else {
        await deleteBoardProperty(boardId, quarter.key);
    }
    writeCache(getCacheKey(boardId, quarter.key), entries, cacheTtl.leave);
}

async function updateQuarters(boardId: number, quarters: Quarter[], change: (quarter: Quarter, entries: LeaveEntry[]) => LeaveEntry[]): Promise<boolean> {
    let changed = false;
    for (const quarter of quarters) {
        const current = await readQuarter(boardId, quarter.key);
        const next = change(quarter, current);
        if (!isSameLeaveSet(current, next)) {
            await writeQuarter(boardId, quarter, next);
            changed = true;
        }
    }
    return changed;
}

function sanitizeAll(entries: LeaveEntry[]): LeaveEntry[] {
    if (entries.length > maxLeaveEntriesPerRequest) {
        throw new Error(`Too many leave entries (${entries.length}). At most ${maxLeaveEntriesPerRequest} can be saved at once.`);
    }
    return entries.map((entry) => {
        const valid = sanitizeLeaveEntry(entry);
        if (!valid) {
            throw new Error(`The leave "${entry.title || entry.id}" has invalid dates or values and was not saved.`);
        }
        return valid;
    });
}

async function getStoredQuarters(boardId: number): Promise<Quarter[]> {
    const keys = await getBoardPropertyKeys(boardId);
    return keys
        .map((key) => quarterKeyPattern.exec(key))
        .filter((match): match is RegExpExecArray => !!match)
        .map((match) => toQuarter(Number(match[1]), Number(match[2])));
}

async function removeExpiredQuarters(boardId: number): Promise<void> {
    const throttleKey = `leave_cleanup_${boardId}`;
    if (readCache<boolean>(throttleKey)) {
        return;
    }
    writeCache(throttleKey, true, cacheTtl.leaveCleanupThrottle);
    const retentionStart = getLeaveRetentionStart();
    const expired = (await getStoredQuarters(boardId)).filter((q) => q.end < retentionStart);
    for (const quarter of expired) {
        await deleteBoardProperty(boardId, quarter.key);
    }
}

function scheduleCleanup(boardId: number): void {
    removeExpiredQuarters(boardId).catch((err) => console.warn('Unable to remove expired leave from the board', err));
}

export async function loadStoredLeave(boardId: number, start: string, end: string, force?: boolean): Promise<LeaveEntry[]> {
    const lists = await Promise.all(
        getQuarters(start, end).map((quarter) => getCached(getCacheKey(boardId, quarter.key), cacheTtl.leave, () => readQuarter(boardId, quarter.key), force)),
    );
    return mergePieces(lists.flat()).filter((e) => overlapsRange(e, start, end));
}

export async function saveLeaveEntries(boardId: number, change: LeaveChange): Promise<void> {
    ensureStorageAllowed();
    const upsert = sanitizeAll(change.upsert);
    const ids = new Set([...upsert.map((e) => e.id), ...change.remove.map((e) => e.id)]);
    const pieces = upsert.map(splitByQuarter);
    const quarters = new Map<string, Quarter>();
    for (const entry of [...upsert, ...change.remove]) {
        getQuarters(entry.start, entry.end).forEach((q) => quarters.set(q.key, q));
    }

    await updateQuarters(boardId, [...quarters.values()], (quarter, entries) => [
        ...entries.filter((e) => !ids.has(e.id)),
        ...pieces.map((p) => p.get(quarter.key)).filter((e): e is LeaveEntry => !!e),
    ]);
    scheduleCleanup(boardId);
}

export async function replaceSourceLeave(boardId: number, sourceId: string, start: string, end: string, entries: LeaveEntry[]): Promise<boolean> {
    ensureStorageAllowed();
    const incoming = sanitizeAll(entries).filter((e) => e.sourceId === sourceId && overlapsRange(e, start, end));
    const pieces = incoming.map(splitByQuarter);
    const changed = await updateQuarters(boardId, getQuarters(start, end), (quarter, current) => [
        ...current.filter((e) => e.sourceId !== sourceId || !overlapsRange(e, start, end)),
        ...pieces.map((p) => p.get(quarter.key)).filter((e): e is LeaveEntry => !!e),
    ]);
    scheduleCleanup(boardId);
    return changed;
}

export async function deleteSourceLeave(boardId: number, sourceId: string): Promise<void> {
    ensureStorageAllowed();
    const quarters = await getStoredQuarters(boardId);
    await updateQuarters(boardId, quarters, (_quarter, entries) => entries.filter((e) => e.sourceId !== sourceId));
}

export function clearLeaveCache(boardId: number): void {
    clearPlannerCache([`leave_${boardId}_`]);
}
