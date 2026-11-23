import { kvs, WhereConditions } from '@forge/kvs';

import { getLeaveRetentionStart } from '../shared/leave-records';

import { applyWrites, leaveEntityName, readAllPages, type LeaveRow } from './leave-resolvers';

export async function onPlannerLeaveCleanup(): Promise<void> {
    const cutoff = getLeaveRetentionStart();
    const rows = await readAllPages((cursor) => {
        const query = kvs.entity<LeaveRow>(leaveEntityName).query().index('by-end').where(WhereConditions.lessThan(cutoff)).limit(100);
        return (cursor ? query.cursor(cursor) : query).getMany();
    });
    await applyWrites(rows.map((r) => ({ key: r.key, row: null })));
    console.log(`Removed ${rows.length} expired leave entries`);
}
