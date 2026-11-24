import { addDays, differenceInCalendarDays, isAfter, isBefore, startOfDay } from 'date-fns';

import { parseDateKey } from '../shared/segments';
import type { PlannerIssue } from '../shared/types';

import type { PiData } from './pi-loader';
import type { PiDocument, PiObjective, PiRisk, PiTeamDependency, TeamDependencyStatus } from './pi-types';

export type ProgressMeasure = 'points' | 'hours' | 'count';

export type ObjectiveHealth = 'untracked' | 'achieved' | 'onTrack' | 'atRisk' | 'missed';

export type DependencyHealth = 'awaiting' | 'onTrack' | 'atRisk' | 'late' | 'delivered' | 'declined';

export type DueState = 'none' | 'ok' | 'dueSoon' | 'overdue' | 'closed';

export interface IssueProgress {
    measure: ProgressMeasure;
    total: number;
    done: number;
    inProgress: number;
    percent: number;
    issueCount: number;
    doneCount: number;
    issues: PlannerIssue[];
    missingKeys: string[];
    unscheduledOpen: number;
    forecastEnd: Date | null;
    outsidePlanCount: number;
}

export interface PlanScope {
    sprintIds: Set<number>;
    start: Date;
}

export type IssueLookup = Record<string, PlannerIssue>;

const secondsPerHour = 3600;
const atRiskWindowDays = 14;
const dueSoonDays = 7;
const behindTolerance = 20;
const closedRoam = new Set(['resolved', 'mitigated']);

export const objectiveHealthLabels: Record<ObjectiveHealth, string> = {
    untracked: 'Not tracked',
    achieved: 'Achieved',
    onTrack: 'On track',
    atRisk: 'At risk',
    missed: 'Not achieved',
};

export const dependencyHealthLabels: Record<DependencyHealth, string> = {
    awaiting: 'Awaiting answer',
    onTrack: 'On track',
    atRisk: 'At risk',
    late: 'Late',
    delivered: 'Delivered',
    declined: 'Declined',
};

export const dependencyStatusLabels: Record<TeamDependencyStatus, string> = {
    requested: 'Requested',
    committed: 'Committed',
    declined: 'Declined',
    delivered: 'Delivered',
};

export const healthClassNames: Record<ObjectiveHealth | DependencyHealth, string> = {
    untracked: 'bg-(--bg-tertiary) text-(--text-secondary)',
    awaiting: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    achieved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    onTrack: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    atRisk: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    missed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    late: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    declined: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export const healthBarVariants: Record<ObjectiveHealth | DependencyHealth, 'success' | 'primary' | 'warning' | 'danger' | 'default'> = {
    untracked: 'default',
    awaiting: 'default',
    achieved: 'success',
    delivered: 'success',
    onTrack: 'primary',
    atRisk: 'warning',
    missed: 'danger',
    late: 'danger',
    declined: 'danger',
};

/** Every issue known to the plan: its stories and features, and the issues loaded because objectives, dependencies or risks track them. */
export function getIssueLookup(data: PiData, tracked: IssueLookup): IssueLookup {
    return { ...tracked, ...data.features, ...data.stories };
}

export function getPlanScope(doc: Pick<PiDocument, 'teams' | 'startDate'>): PlanScope {
    return { sprintIds: new Set(doc.teams.flatMap((t) => t.sprintIds)), start: parseDateKey(doc.startDate) };
}

export function isInPlanScope(issue: PlannerIssue, scope: PlanScope): boolean {
    if (!issue.sprintIds.some((id) => scope.sprintIds.has(id))) {
        return false;
    }
    return !(issue.statusCategory === 'done' && issue.resolutionDate && isBefore(issue.resolutionDate, scope.start));
}

function getChildren(issues: IssueLookup): Map<string, PlannerIssue[]> {
    const children = new Map<string, PlannerIssue[]>();
    for (const issue of Object.values(issues)) {
        const parentKey = issue.epicKey || issue.parentKey;
        if (parentKey && !issue.isSubtask) {
            const list = children.get(parentKey);
            if (list) {
                list.push(issue);
            } else {
                children.set(parentKey, [issue]);
            }
        }
    }
    return children;
}

function getHours(issue: PlannerIssue): number {
    const seconds = issue.originalEstimate ?? (issue.remainingEstimate !== null || issue.timeSpent !== null ? (issue.remainingEstimate || 0) + (issue.timeSpent || 0) : null);
    return seconds && seconds > 0 ? seconds / secondsPerHour : 0;
}

function getSize(issue: PlannerIssue, measure: ProgressMeasure): number {
    if (measure === 'points') {
        return issue.points && issue.points > 0 ? issue.points : 0;
    }
    return measure === 'hours' ? getHours(issue) : 1;
}

/**
 * Progress of the work behind a list of issue keys. A key of a feature (an epic) stands for its stories, so the progress of an
 * objective linked to an epic moves as the stories of the epic are done. Story points are used when the work is estimated in points,
 * hours when it is estimated in time, and the issue count otherwise. With a plan scope, a feature stands only for its stories in the
 * plan, as a feature may span several plans; its open stories outside the plan are counted in outsidePlanCount.
 */
export function getIssueProgress(keys: string[], issues: IssueLookup, sprintEnds: Map<number, Date>, scope?: PlanScope): IssueProgress {
    const children = getChildren(issues);
    const work = new Map<string, PlannerIssue>();
    const outsidePlan = new Set<string>();
    const missingKeys: string[] = [];
    for (const key of new Set(keys)) {
        const issue = issues[key];
        if (!issue) {
            missingKeys.push(key);
            continue;
        }
        const childIssues = children.get(key);
        if (childIssues?.length) {
            childIssues.forEach((child) => {
                if (!scope || isInPlanScope(child, scope)) {
                    work.set(child.key, child);
                } else if (child.statusCategory !== 'done') {
                    outsidePlan.add(child.key);
                }
            });
        } else {
            work.set(issue.key, issue);
        }
    }

    const list = [...work.values()];
    const measure: ProgressMeasure = list.some((i) => (i.points || 0) > 0) ? 'points' : list.some((i) => getHours(i) > 0) ? 'hours' : 'count';
    let total = 0;
    let done = 0;
    let inProgress = 0;
    let unscheduledOpen = 0;
    let forecastEnd: Date | null = null;
    for (const issue of list) {
        const size = getSize(issue, measure);
        total += size;
        if (issue.statusCategory === 'done') {
            done += size;
            continue;
        }
        if (issue.statusCategory === 'indeterminate') {
            inProgress += size;
        }
        const end = issue.currentSprintId ? sprintEnds.get(issue.currentSprintId) : undefined;
        if (end) {
            forecastEnd = !forecastEnd || isAfter(end, forecastEnd) ? end : forecastEnd;
        } else {
            unscheduledOpen++;
        }
    }
    return {
        measure,
        total,
        done,
        inProgress,
        percent: total > 0 ? Math.round((done * 100) / total) : 0,
        issueCount: list.length,
        doneCount: list.filter((i) => i.statusCategory === 'done').length,
        issues: list,
        missingKeys,
        unscheduledOpen,
        forecastEnd,
        outsidePlanCount: [...outsidePlan].filter((key) => !work.has(key)).length,
    };
}

/** Share of the plan's duration that has passed, from 0 to 100. */
export function getElapsedPercent(doc: Pick<PiDocument, 'startDate' | 'endDate'>, today = startOfDay(new Date())): number {
    const start = parseDateKey(doc.startDate);
    const end = parseDateKey(doc.endDate);
    const length = differenceInCalendarDays(end, start) + 1;
    const passed = differenceInCalendarDays(today, start) + 1;
    return Math.max(0, Math.min(100, Math.round((passed * 100) / Math.max(1, length))));
}

export function getObjectiveHealth(progress: IssueProgress, doc: Pick<PiDocument, 'startDate' | 'endDate'>, today = startOfDay(new Date())): ObjectiveHealth {
    if (!progress.issueCount) {
        return 'untracked';
    }
    if (progress.percent >= 100) {
        return 'achieved';
    }
    const end = parseDateKey(doc.endDate);
    if (isAfter(today, end)) {
        return 'missed';
    }
    const elapsed = getElapsedPercent(doc, today);
    const lateForecast = !!progress.forecastEnd && isAfter(progress.forecastEnd, end);
    const unplanned = progress.unscheduledOpen > 0 && elapsed >= 50;
    return lateForecast || unplanned || progress.percent < elapsed - behindTolerance ? 'atRisk' : 'onTrack';
}

export function getDependencyHealth(dependency: PiTeamDependency, provider: IssueProgress, today = startOfDay(new Date())): DependencyHealth {
    if (dependency.status === 'declined') {
        return 'declined';
    }
    if (dependency.status === 'delivered' || (provider.issueCount > 0 && provider.percent >= 100)) {
        return 'delivered';
    }
    const neededBy = dependency.neededBy ? parseDateKey(dependency.neededBy) : null;
    if (neededBy && isAfter(today, neededBy)) {
        return 'late';
    }
    if (dependency.status === 'requested') {
        return neededBy && !isAfter(neededBy, addDays(today, atRiskWindowDays)) ? 'atRisk' : 'awaiting';
    }
    const committed = dependency.committedDate ? parseDateKey(dependency.committedDate) : null;
    if (neededBy && ((committed && isAfter(committed, neededBy)) || (provider.forecastEnd && isAfter(provider.forecastEnd, neededBy)))) {
        return 'atRisk';
    }
    return 'onTrack';
}

export function getDueState(date: string | null, closed: boolean, today = startOfDay(new Date())): DueState {
    if (closed) {
        return 'closed';
    }
    if (!date) {
        return 'none';
    }
    const due = parseDateKey(date);
    if (isBefore(due, today)) {
        return 'overdue';
    }
    return isAfter(due, addDays(today, dueSoonDays)) ? 'ok' : 'dueSoon';
}

export function isRiskClosed(risk: Pick<PiRisk, 'roam'>): boolean {
    return closedRoam.has(risk.roam);
}

export function getRiskDueState(risk: PiRisk, today = startOfDay(new Date())): DueState {
    return getDueState(risk.resolveBy, isRiskClosed(risk), today);
}

export function formatMeasure(value: number, measure: ProgressMeasure): string {
    const rounded = Math.round(value * 10) / 10;
    if (measure === 'points') {
        return `${rounded} pts`;
    }
    return measure === 'hours' ? `${rounded} h` : `${rounded} ${rounded === 1 ? 'issue' : 'issues'}`;
}

/** Actual business value of the committed objectives against their planned value, in percent. */
export function getPredictability(objectives: PiObjective[]): number | null {
    const planned = objectives.filter((o) => o.committed).reduce((sum, o) => sum + (o.plannedValue || 0), 0);
    const actual = objectives.filter((o) => o.committed).reduce((sum, o) => sum + (o.actualValue || 0), 0);
    return planned > 0 ? Math.round((actual * 100) / planned) : null;
}
