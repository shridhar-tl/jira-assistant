import type { LeaveIndex } from './availability';
import { createDistributionContext, getIssueHours, getIssuePoints, type EstimateUnit, type SprintRange } from './capacity';
import { distributeIssueByDay, getIssuePlanParts, type PersonDayLoads } from './load-distribution';
import type { PlannerIssue, TeamDefinition, TeamMember } from './types';

export interface PersonLoadInput {
    issues: PlannerIssue[];
    members: TeamMember[];
    team: TeamDefinition;
    leaveIndex: LeaveIndex;
    sprintRanges: Map<number, SprintRange>;
    estimateUnit: EstimateUnit;
    leadTimeDays: number;
}

export interface PersonLoadResult {
    loads: PersonDayLoads;
    unscheduled: Map<string, PlannerIssue[]>;
    unestimated: Map<string, PlannerIssue[]>;
}

function push(map: Map<string, PlannerIssue[]>, key: string, issue: PlannerIssue) {
    const list = map.get(key);
    if (list) {
        list.push(issue);
    } else {
        map.set(key, [issue]);
    }
}

/**
 * Per person per day load of the open issues using the same plan rules as the Workload Heatmap:
 * planned segments first, then start/due dates, then the sprint dates, then estimate / lead time.
 */
export function computePersonLoads(input: PersonLoadInput): PersonLoadResult {
    const { issues, members, team, leaveIndex, sprintRanges, estimateUnit, leadTimeDays } = input;
    const loads: PersonDayLoads = new Map();
    const unscheduled = new Map<string, PlannerIssue[]>();
    const unestimated = new Map<string, PlannerIssue[]>();
    const keys = new Set(issues.map((i) => i.key));

    for (const issue of issues) {
        if (issue.statusCategory === 'done' || (issue.isSubtask && issue.parentKey && keys.has(issue.parentKey) && !issue.segments.length)) {
            continue;
        }
        const hours = getIssueHours(issue);
        const points = getIssuePoints(issue, estimateUnit);
        const personKey = issue.assignee?.id || '';
        if (hours <= 0 && points <= 0) {
            if (personKey) {
                push(unestimated, personKey, issue);
            }
            continue;
        }

        const range = issue.currentSprintId ? sprintRanges.get(issue.currentSprintId) || null : null;
        const ctx = createDistributionContext(members, team, leaveIndex, range, leadTimeDays);
        const { parts } = getIssuePlanParts(issue, hours, ctx);
        if (!parts.length) {
            if (personKey) {
                push(unscheduled, personKey, issue);
            }
            continue;
        }
        distributeIssueByDay(issue, hours, points, parts, ctx, loads);
    }

    return { loads, unscheduled, unestimated };
}
