import { isAfter } from 'date-fns';

import { isIssueEstimated, type EstimateUnit, type MemberSprintCapacity, type SprintCapacity, type SprintRange } from './capacity';
import type { Dependency } from './dependencies';
import type { PlannerIssue, PlannerSprint } from './types';

export interface ScopeChange {
    added: string[];
    removed: string[];
}

export interface SprintHealth {
    sprintId: number;
    issueCount: number;
    unestimated: PlannerIssue[];
    unassigned: PlannerIssue[];
    overCapacity: MemberSprintCapacity[];
    blocked: PlannerIssue[];
    dueAfterEnd: PlannerIssue[];
    carryOver: PlannerIssue[];
    added: string[] | null;
    removed: string[] | null;
    score: number;
}

export interface HealthInput {
    sprint: PlannerSprint;
    range: SprintRange | null;
    issues: PlannerIssue[];
    capacity: SprintCapacity | null;
    blockingDependencies: Map<string, Dependency[]>;
    openSprintIds: Set<number>;
    estimateUnit: EstimateUnit;
    scopeChange: ScopeChange | null;
}

export function computeSprintHealth(input: HealthInput): SprintHealth {
    const { sprint, range, issues, capacity, blockingDependencies, openSprintIds, estimateUnit, scopeChange } = input;
    const open = issues.filter((i) => i.statusCategory !== 'done' && !i.isSubtask);

    const unestimated = open.filter((i) => !isIssueEstimated(i, estimateUnit));
    const unassigned = open.filter((i) => !i.assignee && !i.segments.length);
    const blocked = open.filter((i) => (blockingDependencies.get(i.key) || []).length > 0);
    const dueAfterEnd = range ? open.filter((i) => i.dueDate && isAfter(i.dueDate, range.end)) : [];
    const carryOver = issues.filter((i) => i.sprintIds.some((id) => id !== sprint.id && !openSprintIds.has(id)));
    const overCapacity = (capacity?.members || []).filter((m) => m.level === 'over');

    const added = scopeChange && sprint.state === 'active' ? scopeChange.added : null;
    const removed = scopeChange && sprint.state === 'active' ? scopeChange.removed : null;

    const total = Math.max(1, open.length);
    const penalties =
        (unestimated.length / total) * 25 +
        (unassigned.length / total) * 15 +
        (blocked.length / total) * 20 +
        (dueAfterEnd.length / total) * 10 +
        Math.min(1, overCapacity.length / Math.max(1, capacity?.members.length || 1)) * 20 +
        (capacity && capacity.level === 'over' ? 10 : 0);

    return {
        sprintId: sprint.id,
        issueCount: issues.length,
        unestimated,
        unassigned,
        overCapacity,
        blocked,
        dueAfterEnd,
        carryOver,
        added,
        removed,
        score: Math.max(0, Math.round(100 - penalties)),
    };
}
