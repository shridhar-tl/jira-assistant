import { invokeResolver } from '../../../common/invoke-resolver.plugin';

import { clearPlannerCache, getCached } from './cache';
import { cacheTtl } from './constants';
import { maxLeaveEntriesPerRequest, sanitizeLeaveEntry } from './leave-records';
import type { LeaveEntry } from './types';

export const leaveNeedsBoardAdmin = false;

export interface LeaveChange {
    upsert: LeaveEntry[];
    remove: LeaveEntry[];
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

export async function loadStoredLeave(boardId: number, start: string, end: string, force?: boolean): Promise<LeaveEntry[]> {
    const entries = await getCached(`leave_${boardId}_${start}_${end}`, cacheTtl.leave, () => invokeResolver<LeaveEntry[]>('PlannerLeaveQuery', { boardId, start, end }), force);
    return (entries || []).map(sanitizeLeaveEntry).filter((e): e is LeaveEntry => !!e);
}

export async function saveLeaveEntries(boardId: number, change: LeaveChange): Promise<void> {
    await invokeResolver<boolean>('PlannerLeaveSave', { boardId, upsert: sanitizeAll(change.upsert), remove: change.remove.map((e) => e.id) });
    clearLeaveCache(boardId);
}

export async function replaceSourceLeave(boardId: number, sourceId: string, start: string, end: string, entries: LeaveEntry[]): Promise<boolean> {
    const result = await invokeResolver<{ changed: boolean }>('PlannerLeaveReplace', { boardId, sourceId, start, end, entries: sanitizeAll(entries) });
    if (result?.changed) {
        clearLeaveCache(boardId);
    }
    return !!result?.changed;
}

export async function deleteSourceLeave(boardId: number, sourceId: string): Promise<void> {
    await invokeResolver<boolean>('PlannerLeaveDeleteSource', { boardId, sourceId });
    clearLeaveCache(boardId);
}

export function clearLeaveCache(boardId: number): void {
    clearPlannerCache([`leave_${boardId}_`]);
}
