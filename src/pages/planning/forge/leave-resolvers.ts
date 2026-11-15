import { kvs, WhereConditions, type ListResult } from '@forge/kvs';
import type Resolver from '@forge/resolver';

import { isDateKey, isLeaveId, isSameLeave, maxLeaveEntriesPerRequest, overlapsRange, sanitizeLeaveEntry } from '../shared/leave-records';
import type { LeaveEntry } from '../shared/types';
import { ensureBoardAccess, rejectWith } from './board-access';

export interface LeaveRow {
    boardKey: string;
    sourceKey: string;
    startDate: string;
    endDate: string;
    entry: LeaveEntry;
}

export const leaveEntityName = 'planner-leave';
const pageSize = 100;
const maxPages = 30;
const transactionLimit = 25;
const manualSourceKey = 'manual';

interface QueryPayload {
    boardId: number;
    start: string;
    end: string;
}

interface SavePayload {
    boardId: number;
    upsert: unknown[];
    remove: unknown[];
}

interface ReplacePayload {
    boardId: number;
    sourceId: string;
    start: string;
    end: string;
    entries: unknown[];
}

interface DeleteSourcePayload {
    boardId: number;
    sourceId: string;
}

function rowKey(boardId: number, id: string): string {
    return `${boardId}_${id}`;
}

function toRow(boardId: number, entry: LeaveEntry): LeaveRow {
    return { boardKey: String(boardId), sourceKey: entry.sourceId || manualSourceKey, startDate: entry.start, endDate: entry.end, entry };
}

export async function readAllPages(load: (cursor?: string) => Promise<ListResult<LeaveRow>>): Promise<{ key: string; value: LeaveRow }[]> {
    const rows: { key: string; value: LeaveRow }[] = [];
    let cursor: string | undefined;
    let pages = 0;
    do {
        const result = await load(cursor);
        rows.push(...result.results);
        cursor = result.nextCursor;
    } while (cursor && ++pages < maxPages);
    return rows;
}

function queryByBoard(boardId: number, fromDate: string) {
    return readAllPages((cursor) => {
        const query = kvs
            .entity<LeaveRow>(leaveEntityName)
            .query()
            .index('by-board', { partition: [String(boardId)] })
            .where(WhereConditions.greaterThanEqualTo(fromDate))
            .limit(pageSize);
        return (cursor ? query.cursor(cursor) : query).getMany();
    });
}

function queryBySource(boardId: number, sourceId: string, fromDate: string) {
    return readAllPages((cursor) => {
        const query = kvs
            .entity<LeaveRow>(leaveEntityName)
            .query()
            .index('by-source', { partition: [String(boardId), sourceId] })
            .where(WhereConditions.greaterThanEqualTo(fromDate))
            .limit(pageSize);
        return (cursor ? query.cursor(cursor) : query).getMany();
    });
}

interface WriteOperation {
    key: string;
    row: LeaveRow | null;
}

export async function applyWrites(operations: WriteOperation[]): Promise<void> {
    for (let index = 0; index < operations.length; index += transactionLimit) {
        const builder = kvs.transact();
        for (const { key, row } of operations.slice(index, index + transactionLimit)) {
            if (row) {
                builder.set(key, row, { entityName: leaveEntityName });
            } else {
                builder.delete(key, { entityName: leaveEntityName });
            }
        }
        await builder.execute();
    }
}

function validateEntries(values: unknown): LeaveEntry[] | null {
    if (!Array.isArray(values) || values.length > maxLeaveEntriesPerRequest) {
        return null;
    }
    const entries = values.map(sanitizeLeaveEntry);
    return entries.every((e): e is LeaveEntry => !!e) ? entries : null;
}

function isValidRange(start: unknown, end: unknown): boolean {
    return isDateKey(start) && isDateKey(end) && start <= end;
}

async function queryLeave({ boardId, start, end }: QueryPayload): Promise<LeaveEntry[]> {
    if (!isValidRange(start, end)) {
        return rejectWith(400, 'Invalid date range');
    }
    const id = await ensureBoardAccess(boardId);
    const rows = await queryByBoard(id, start);
    return rows.map((r) => r.value.entry).filter((e) => overlapsRange(e, start, end));
}

async function saveLeave({ boardId, upsert, remove }: SavePayload): Promise<boolean> {
    const entries = validateEntries(upsert);
    const removeIds = Array.isArray(remove) && remove.length <= maxLeaveEntriesPerRequest && remove.every(isLeaveId) ? (remove as string[]) : null;
    if (!entries || !removeIds || entries.some((e) => e.source !== 'manual')) {
        return rejectWith(400, 'Invalid leave entries');
    }
    const id = await ensureBoardAccess(boardId);
    const upsertIds = new Set(entries.map((e) => e.id));
    await applyWrites([
        ...removeIds.filter((removeId) => !upsertIds.has(removeId)).map((removeId) => ({ key: rowKey(id, removeId), row: null })),
        ...entries.map((entry) => ({ key: rowKey(id, entry.id), row: toRow(id, entry) })),
    ]);
    return true;
}

async function replaceSourceLeave({ boardId, sourceId, start, end, entries: values }: ReplacePayload): Promise<{ changed: boolean }> {
    const entries = validateEntries(values);
    if (!entries || !isLeaveId(sourceId) || !isValidRange(start, end) || entries.some((e) => e.sourceId !== sourceId)) {
        return rejectWith(400, 'Invalid calendar leave');
    }
    const id = await ensureBoardAccess(boardId);
    const existing = (await queryBySource(id, sourceId, start)).filter((r) => overlapsRange(r.value.entry, start, end));
    const incoming = new Map(entries.filter((e) => overlapsRange(e, start, end)).map((e) => [e.id, e]));
    const existingById = new Map(existing.map((r) => [r.value.entry.id, r.value.entry]));

    const operations: WriteOperation[] = [
        ...existing.filter((r) => !incoming.has(r.value.entry.id)).map((r) => ({ key: r.key, row: null })),
        ...[...incoming.values()]
            .filter((entry) => {
                const current = existingById.get(entry.id);
                return !current || !isSameLeave(current, entry);
            })
            .map((entry) => ({ key: rowKey(id, entry.id), row: toRow(id, entry) })),
    ];
    await applyWrites(operations);
    return { changed: operations.length > 0 };
}

async function deleteSourceLeave({ boardId, sourceId }: DeleteSourcePayload): Promise<boolean> {
    if (!isLeaveId(sourceId)) {
        return rejectWith(400, 'Invalid calendar source');
    }
    const id = await ensureBoardAccess(boardId);
    const rows = await queryBySource(id, sourceId, '0000-01-01');
    await applyWrites(rows.map((r) => ({ key: r.key, row: null })));
    return true;
}

export function registerLeaveResolvers(resolver: Resolver) {
    resolver.define('PlannerLeaveQuery', (req) => queryLeave(req.payload as unknown as QueryPayload));
    resolver.define('PlannerLeaveSave', (req) => saveLeave(req.payload as unknown as SavePayload));
    resolver.define('PlannerLeaveReplace', (req) => replaceSourceLeave(req.payload as unknown as ReplacePayload));
    resolver.define('PlannerLeaveDeleteSource', (req) => deleteSourceLeave(req.payload as unknown as DeleteSourcePayload));
}
