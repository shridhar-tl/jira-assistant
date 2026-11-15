import { eachDayOfInterval, format, isBefore, startOfDay } from 'date-fns';

import { criticalLoadPercent, underLoadPercent } from './constants';
import { getPlanParts, spreadPlanByDay, type PlanContext, type PlanSource } from './plan-model';
import type {
    GroupLoadRow,
    HeatmapDataset,
    HeatmapDateRange,
    HeatmapDay,
    HeatmapIssue,
    HeatmapModel,
    HeatmapSchedule,
    HeatmapUser,
    IssueDayAllocation,
    LoadLevel,
    LoadSummary,
    UserDayLoad,
    UserLoadRow,
    WorkloadHeatmapSettings,
} from './types';

interface UserPlan {
    allocations: Map<string, IssueDayAllocation[]>;
    unestimated: HeatmapIssue[];
    unscheduled: HeatmapIssue[];
}

const dayKeyFormat = 'yyyy-MM-dd';
const secondsPerHour = 3600;

export function toDayKey(date: Date): string {
    return format(date, dayKeyFormat);
}

function getRemainingSeconds(issue: HeatmapIssue): number | null {
    return issue.remainingEstimate ?? issue.originalEstimate;
}

function toPlanSource(issue: HeatmapIssue): PlanSource {
    return { assigneeId: issue.assignee.id || null, startDate: issue.startDate, dueDate: issue.dueDate, segments: issue.segments || [] };
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

function getUserPlan(plans: Map<string, UserPlan>, userId: string): UserPlan {
    let plan = plans.get(userId);
    if (!plan) {
        plan = { allocations: new Map(), unestimated: [], unscheduled: [] };
        plans.set(userId, plan);
    }
    return plan;
}

function planIssues(issues: HeatmapIssue[], dayKeys: Set<string>, ctx: PlanContext): Map<string, UserPlan> {
    const plans = new Map<string, UserPlan>();

    for (const issue of issues) {
        const source = toPlanSource(issue);
        const remaining = getRemainingSeconds(issue);
        const owners = source.segments.length ? [...new Set(source.segments.flatMap((s) => s.people.map((p) => p.id)))] : [issue.assignee.id];

        if (remaining === null) {
            owners.filter(Boolean).forEach((id) => getUserPlan(plans, id).unestimated.push(issue));
            continue;
        }
        if (remaining <= 0) {
            continue;
        }

        const parts = getPlanParts(source, remaining / secondsPerHour, ctx);
        if (!parts.length) {
            if (issue.assignee.id) {
                getUserPlan(plans, issue.assignee.id).unscheduled.push(issue);
            }
            continue;
        }

        for (const { personId, date, share, part, isOverdue } of spreadPlanByDay(parts, ctx)) {
            const dayKey = toDayKey(date);
            if (!personId || !dayKeys.has(dayKey)) {
                continue;
            }
            const allocations = getUserPlan(plans, personId).allocations;
            const list = allocations.get(dayKey) || [];
            list.push({ issue, seconds: remaining * share, spanStart: part.start, spanEnd: part.end, isOverdue, isDerivedSpan: part.isDerived });
            allocations.set(dayKey, list);
        }
    }

    return plans;
}

function buildUserRow(user: HeatmapUser, plan: UserPlan | undefined, days: HeatmapDay[], capacityPerDay: number, schedule?: HeatmapSchedule): UserLoadRow {
    const dayLoads = days.reduce<Record<string, UserDayLoad>>((result, day) => {
        const scheduled = schedule?.getDay(user.id, day.date);
        const isWorkingDay = scheduled ? scheduled.isWorkingDay : day.isWorkingDay;
        const capacity = isWorkingDay && !day.isPast ? (scheduled ? scheduled.capacitySeconds : capacityPerDay) : 0;
        const allocations = [...(plan?.allocations.get(day.key) || [])].sort((a, b) => b.seconds - a.seconds);
        const seconds = allocations.reduce((sum, a) => sum + a.seconds, 0);
        result[day.key] = {
            ...createSummary(seconds, capacity),
            allocations,
            absence: scheduled?.absence,
            absenceTitle: scheduled?.absenceTitle,
        };
        return result;
    }, {});

    return { user, days: dayLoads, total: totalOf(dayLoads), unestimated: plan?.unestimated || [], unscheduled: plan?.unscheduled || [] };
}

export function buildHeatmapModel(
    dataset: HeatmapDataset,
    settings: WorkloadHeatmapSettings,
    range: HeatmapDateRange,
    capacityPerDay: number,
    now: Date = new Date(),
    schedule?: HeatmapSchedule,
): HeatmapModel {
    const today = startOfDay(now);
    const workingDays = new Set(settings.workingDays);
    const days = buildDays(range, settings.workingDays, today);
    const isSprintScope = settings.rangeMode === 'sprint' && settings.sprintIssuesOnly && !!range.sprintId;

    const ctx: PlanContext = {
        isWorkingDay: (userId, date) => {
            const scheduled = userId ? schedule?.getDay(userId, date) : null;
            return scheduled ? scheduled.isWorkingDay : workingDays.has(date.getDay());
        },
        fallbackRange: isSprintScope ? { start: range.fromDate, end: range.toDate } : null,
        leadTimeDays: settings.leadTimeDays,
        hoursPerDay: capacityPerDay / secondsPerHour,
        today,
    };

    const plans = planIssues(filterIssues(dataset.issues, settings), new Set(days.map((d) => d.key)), ctx);

    const userRows = new Map<string, UserLoadRow>();
    const getUserRow = (user: HeatmapUser) => {
        let row = userRows.get(user.id);
        if (!row) {
            row = buildUserRow(user, plans.get(user.id), days, capacityPerDay, schedule);
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
