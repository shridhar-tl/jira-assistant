import {
    getPersonShares as getPlanShares,
    getPlannedSpan,
    getPlanParts,
    spreadPlanByDay,
    type PlanContext,
    type PlanPart,
    type PlanSource,
    type PlanSpan,
} from '@/gadgets/WorkloadHeatmap/plan-model';

import { parseDateKey, toDateKey } from './segments';
import type { PlannerIssue } from './types';

export type DistributionContext = PlanContext;
export type { PlanPart, PlanSpan };

export interface DayLoadIssue {
    key: string;
    hours: number;
    points: number;
    spanStart: Date;
    spanEnd: Date;
    isOverdue: boolean;
    isDerived: boolean;
}

export interface DayLoad {
    hours: number;
    points: number;
    issues: DayLoadIssue[];
}

export type PersonDayLoads = Map<string, Map<string, DayLoad>>;

export function toPlanSource(issue: PlannerIssue): PlanSource {
    return {
        assigneeId: issue.assignee?.id || null,
        startDate: issue.startDate,
        dueDate: issue.dueDate,
        segments: issue.segments.map((s) => ({ id: s.id, label: s.label, start: parseDateKey(s.start), end: parseDateKey(s.end), people: s.people })),
    };
}

export function getIssuePlanParts(issue: PlannerIssue, hours: number, ctx: DistributionContext): { parts: PlanPart[]; isDerived: boolean } {
    const parts = getPlanParts(toPlanSource(issue), hours, ctx);
    return { parts, isDerived: parts.some((p) => p.isDerived) };
}

export function getIssueSpan(issue: PlannerIssue, hours: number, ctx: DistributionContext): PlanSpan | null {
    return getPlannedSpan(issue, hours, ctx, issue.assignee?.id || '');
}

export function getPersonShares(parts: PlanPart[], ctx: DistributionContext): Map<string, number> {
    return getPlanShares(parts, ctx);
}

export function distributeIssueByDay(
    issue: PlannerIssue,
    hours: number,
    points: number,
    parts: PlanPart[],
    ctx: DistributionContext,
    loads: PersonDayLoads,
): void {
    if (!parts.length || (hours <= 0 && points <= 0)) {
        return;
    }

    for (const { personId, date, share, part, isOverdue } of spreadPlanByDay(parts, ctx)) {
        let personDays = loads.get(personId);
        if (!personDays) {
            personDays = new Map();
            loads.set(personId, personDays);
        }
        const dayKey = toDateKey(date);
        let day = personDays.get(dayKey);
        if (!day) {
            day = { hours: 0, points: 0, issues: [] };
            personDays.set(dayKey, day);
        }
        day.hours += hours * share;
        day.points += points * share;
        const existing = day.issues.find((i) => i.key === issue.key);
        if (existing) {
            existing.hours += hours * share;
            existing.points += points * share;
        } else {
            day.issues.push({
                key: issue.key,
                hours: hours * share,
                points: points * share,
                spanStart: part.start,
                spanEnd: part.end,
                isOverdue,
                isDerived: part.isDerived,
            });
        }
    }
}
