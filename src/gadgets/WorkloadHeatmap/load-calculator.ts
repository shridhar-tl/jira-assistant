import { addDays, differenceInCalendarDays, eachDayOfInterval, format, isAfter, isBefore, startOfDay } from 'date-fns';

import { criticalLoadPercent, underLoadPercent } from './constants';
import type {
    GroupLoadRow,
    HeatmapDataset,
    HeatmapDateRange,
    HeatmapDay,
    HeatmapIssue,
    HeatmapModel,
    HeatmapUser,
    IssueDayAllocation,
    LoadLevel,
    LoadSummary,
    UserDayLoad,
    UserLoadRow,
    WorkloadHeatmapSettings,
} from './types';

interface IssueSpan {
    start: Date;
    end: Date;
    isDerived: boolean;
}

interface CalculationContext {
    workingDays: Set<number>;
    capacityPerDay: number;
    leadTimeDays: number;
    today: Date;
}

const dayKeyFormat = 'yyyy-MM-dd';

export function toDayKey(date: Date): string {
    return format(date, dayKeyFormat);
}

function isWorkingDay(date: Date, workingDays: Set<number>): boolean {
    return workingDays.has(date.getDay());
}

function nearestWorkingDay(date: Date, direction: 1 | -1, workingDays: Set<number>): Date {
    let current = date;
    for (let i = 0; i < 7; i++) {
        if (isWorkingDay(current, workingDays)) {
            return current;
        }
        current = addDays(current, direction);
    }
    return date;
}

function shiftWorkingDays(date: Date, count: number, direction: 1 | -1, workingDays: Set<number>): Date {
    if (!workingDays.size) {
        return addDays(date, count * direction);
    }

    let current = date;
    let remaining = count;
    while (remaining > 0) {
        current = addDays(current, direction);
        if (isWorkingDay(current, workingDays)) {
            remaining--;
        }
    }
    return current;
}

function countWorkingDays(start: Date, end: Date, workingDays: Set<number>): number {
    const totalDays = differenceInCalendarDays(end, start) + 1;
    if (totalDays <= 0) {
        return 0;
    }

    const fullWeeks = Math.floor(totalDays / 7);
    let count = fullWeeks * workingDays.size;
    let current = addDays(start, fullWeeks * 7);
    while (!isAfter(current, end)) {
        if (isWorkingDay(current, workingDays)) {
            count++;
        }
        current = addDays(current, 1);
    }
    return count;
}

function getRemainingSeconds(issue: HeatmapIssue): number | null {
    return issue.remainingEstimate ?? issue.originalEstimate;
}

function getLeadDays(remaining: number, ctx: CalculationContext): number {
    if (ctx.leadTimeDays > 0) {
        return ctx.leadTimeDays;
    }
    return Math.max(1, Math.ceil(remaining / ctx.capacityPerDay));
}

function getPlannedSpan(issue: HeatmapIssue, remaining: number, ctx: CalculationContext): IssueSpan | null {
    const { startDate, dueDate } = issue;

    if (startDate && dueDate) {
        return isAfter(startDate, dueDate)
            ? { start: dueDate, end: dueDate, isDerived: false }
            : { start: startDate, end: dueDate, isDerived: false };
    }

    const leadDays = getLeadDays(remaining, ctx);

    if (dueDate) {
        const anchor = nearestWorkingDay(dueDate, -1, ctx.workingDays);
        return { start: shiftWorkingDays(anchor, leadDays - 1, -1, ctx.workingDays), end: dueDate, isDerived: true };
    }

    if (startDate) {
        const anchor = nearestWorkingDay(startDate, 1, ctx.workingDays);
        return { start: startDate, end: shiftWorkingDays(anchor, leadDays - 1, 1, ctx.workingDays), isDerived: true };
    }

    return null;
}

function allocateIssue(issue: HeatmapIssue, remaining: number, span: IssueSpan, days: HeatmapDay[], ctx: CalculationContext) {
    const { today, workingDays } = ctx;
    const isOverdue = isBefore(span.end, today);
    const effectiveStart = isOverdue ? nearestWorkingDay(today, 1, workingDays) : isBefore(span.start, today) ? today : span.start;
    const effectiveEnd = isOverdue ? effectiveStart : span.end;

    const workingDayCount = countWorkingDays(effectiveStart, effectiveEnd, workingDays);
    const useFallbackDay = workingDayCount === 0;
    const secondsPerDay = remaining / (useFallbackDay ? 1 : workingDayCount);
    const fallbackKey = toDayKey(effectiveEnd);

    const allocations: { dayKey: string; allocation: IssueDayAllocation }[] = [];

    for (const day of days) {
        const inSpan = useFallbackDay
            ? day.key === fallbackKey
            : !isBefore(day.date, effectiveStart) && !isAfter(day.date, effectiveEnd) && day.isWorkingDay;

        if (inSpan) {
            allocations.push({
                dayKey: day.key,
                allocation: {
                    issue,
                    seconds: secondsPerDay,
                    spanStart: span.start,
                    spanEnd: span.end,
                    isOverdue,
                    isDerivedSpan: span.isDerived,
                },
            });
        }
    }

    return allocations;
}

export function getLoadLevel(seconds: number, capacity: number): LoadLevel {
    if (seconds <= 0) {
        return 'none';
    }
    if (capacity <= 0) {
        return 'critical';
    }

    const percent = (seconds * 100) / capacity;
    if (percent < underLoadPercent) {
        return 'under';
    }
    if (percent <= 100) {
        return 'good';
    }
    if (percent <= criticalLoadPercent) {
        return 'over';
    }
    return 'critical';
}

function createSummary(seconds: number, capacity: number): LoadSummary {
    return {
        seconds,
        capacity,
        percent: capacity > 0 ? Math.round((seconds * 100) / capacity) : null,
        level: getLoadLevel(seconds, capacity),
    };
}

function sumSummaries(rows: { days: Record<string, LoadSummary> }[], days: HeatmapDay[]): Record<string, LoadSummary> {
    return days.reduce<Record<string, LoadSummary>>((result, day) => {
        let seconds = 0;
        let capacity = 0;
        for (const row of rows) {
            const load = row.days[day.key];
            seconds += load.seconds;
            capacity += load.capacity;
        }
        result[day.key] = createSummary(seconds, capacity);
        return result;
    }, {});
}

function totalOf(dayLoads: Record<string, LoadSummary>): LoadSummary {
    let seconds = 0;
    let capacity = 0;
    for (const load of Object.values(dayLoads)) {
        seconds += load.seconds;
        capacity += load.capacity;
    }
    return createSummary(seconds, capacity);
}

export function buildDays(range: HeatmapDateRange, workingDays: number[], today: Date): HeatmapDay[] {
    const workingDaySet = new Set(workingDays);
    const todayKey = toDayKey(today);

    return eachDayOfInterval({ start: range.fromDate, end: range.toDate }).map((date) => {
        const key = toDayKey(date);
        return {
            key,
            date,
            isWorkingDay: workingDaySet.has(date.getDay()),
            isToday: key === todayKey,
            isPast: isBefore(date, today),
        };
    });
}

export function filterIssues(issues: HeatmapIssue[], settings: WorkloadHeatmapSettings): HeatmapIssue[] {
    const projects = new Set(settings.projects);
    const issueTypes = new Set(settings.issueTypes);

    return issues.filter(
        (issue) =>
            (settings.includeSubtasks || !issue.isSubtask) &&
            (!projects.size || projects.has(issue.projectKey)) &&
            (!issueTypes.size || issueTypes.has(issue.issueType)),
    );
}

function buildUserRow(user: HeatmapUser, issues: HeatmapIssue[], days: HeatmapDay[], ctx: CalculationContext): UserLoadRow {
    const dayLoads = days.reduce<Record<string, UserDayLoad>>((result, day) => {
        const capacity = day.isWorkingDay && !day.isPast ? ctx.capacityPerDay : 0;
        result[day.key] = { seconds: 0, capacity, percent: null, level: 'none', allocations: [] };
        return result;
    }, {});

    const unestimated: HeatmapIssue[] = [];
    const unscheduled: HeatmapIssue[] = [];

    for (const issue of issues) {
        const remaining = getRemainingSeconds(issue);
        if (remaining === null) {
            unestimated.push(issue);
            continue;
        }
        if (remaining <= 0) {
            continue;
        }

        const span = getPlannedSpan(issue, remaining, ctx);
        if (!span) {
            unscheduled.push(issue);
            continue;
        }

        for (const { dayKey, allocation } of allocateIssue(issue, remaining, span, days, ctx)) {
            const load = dayLoads[dayKey];
            load.seconds += allocation.seconds;
            load.allocations.push(allocation);
        }
    }

    for (const load of Object.values(dayLoads)) {
        Object.assign(load, createSummary(load.seconds, load.capacity));
        load.allocations.sort((a, b) => b.seconds - a.seconds);
    }

    return { user, days: dayLoads, total: totalOf(dayLoads), unestimated, unscheduled };
}

export function buildHeatmapModel(
    dataset: HeatmapDataset,
    settings: WorkloadHeatmapSettings,
    range: HeatmapDateRange,
    capacityPerDay: number,
    now: Date = new Date(),
): HeatmapModel {
    const today = startOfDay(now);
    const ctx: CalculationContext = {
        workingDays: new Set(settings.workingDays),
        capacityPerDay,
        leadTimeDays: settings.leadTimeDays,
        today,
    };
    const days = buildDays(range, settings.workingDays, today);

    const issuesByUser = filterIssues(dataset.issues, settings).reduce<Map<string, HeatmapIssue[]>>((result, issue) => {
        const list = result.get(issue.assignee.id);
        if (list) {
            list.push(issue);
        } else {
            result.set(issue.assignee.id, [issue]);
        }
        return result;
    }, new Map());

    const userRows = new Map<string, UserLoadRow>();
    const getUserRow = (user: HeatmapUser) => {
        let row = userRows.get(user.id);
        if (!row) {
            row = buildUserRow(user, issuesByUser.get(user.id) || [], days, ctx);
            userRows.set(user.id, row);
        }
        return row;
    };

    const groups: GroupLoadRow[] = dataset.groups.map((group) => {
        const users = group.users.map(getUserRow);
        const groupDays = sumSummaries(users, days);
        return { name: group.name, users, days: groupDays, total: totalOf(groupDays) };
    });

    const summary = sumSummaries([...userRows.values()], days);

    return { days, groups, summary, total: totalOf(summary), capacityPerDay };
}
