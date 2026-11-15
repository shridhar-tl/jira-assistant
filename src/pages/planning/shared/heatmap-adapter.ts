import { startOfDay } from 'date-fns';

import { buildDays, getLoadLevel, toDayKey } from '@/gadgets/WorkloadHeatmap/load-calculator';
import type {
    GroupLoadRow,
    HeatmapDay,
    HeatmapIssue,
    HeatmapModel,
    IssueDayAllocation,
    LoadSummary,
    UserDayLoad,
    UserLoadRow,
} from '@/gadgets/WorkloadHeatmap/types';

import { getDayAvailability, type LeaveIndex } from './availability';
import type { PersonLoadResult } from './person-load';
import type { PlannerIssue, TeamDefinition, TeamMember } from './types';

const secondsPerHour = 3600;

export function toHeatmapIssue(issue: PlannerIssue): HeatmapIssue {
    return {
        key: issue.key,
        summary: issue.summary,
        url: issue.url,
        assignee: {
            id: issue.assignee?.id || '',
            displayName: issue.assignee?.displayName || 'Unassigned',
            avatarUrl: issue.assignee?.avatarUrl,
        },
        projectKey: issue.projectKey,
        projectName: issue.projectKey,
        issueType: issue.issueType,
        issueTypeIconUrl: issue.issueTypeIconUrl,
        isSubtask: issue.isSubtask,
        status: issue.status,
        originalEstimate: issue.originalEstimate,
        remainingEstimate: issue.remainingEstimate,
        startDate: issue.startDate,
        dueDate: issue.dueDate,
    };
}

function summarize(seconds: number, capacity: number): LoadSummary {
    return { seconds, capacity, percent: capacity > 0 ? Math.round((seconds * 100) / capacity) : null, level: getLoadLevel(seconds, capacity) };
}

function sumRows(rows: { days: Record<string, LoadSummary> }[], days: HeatmapDay[]): Record<string, LoadSummary> {
    const result: Record<string, LoadSummary> = {};
    for (const day of days) {
        let seconds = 0;
        let capacity = 0;
        rows.forEach((row) => {
            seconds += row.days[day.key]?.seconds || 0;
            capacity += row.days[day.key]?.capacity || 0;
        });
        result[day.key] = summarize(seconds, capacity);
    }
    return result;
}

function totalOf(days: Record<string, LoadSummary>): LoadSummary {
    let seconds = 0;
    let capacity = 0;
    Object.values(days).forEach((d) => {
        seconds += d.seconds;
        capacity += d.capacity;
    });
    return summarize(seconds, capacity);
}

/**
 * Builds the Workload Heatmap model from data the planner has already loaded, so the heatmap grid can be embedded
 * in the capacity view and the resource timeline without any request of its own. Capacity per day comes from the
 * people schedule (hours, working days, allocation, leave and holidays).
 */
export function buildPlannerHeatmapModel(
    groupName: string,
    members: TeamMember[],
    team: TeamDefinition,
    leaveIndex: LeaveIndex,
    personLoads: PersonLoadResult,
    issues: Record<string, PlannerIssue>,
    range: { start: Date; end: Date },
    now: Date = new Date(),
): HeatmapModel {
    const today = startOfDay(now);
    const days = buildDays({ fromDate: range.start, toDate: range.end, label: '' }, team.defaults.workingDays, today);
    const heatmapIssues = new Map<string, HeatmapIssue>();
    const getIssue = (key: string) => {
        let item = heatmapIssues.get(key);
        if (!item && issues[key]) {
            item = toHeatmapIssue(issues[key]);
            heatmapIssues.set(key, item);
        }
        return item;
    };

    const users: UserLoadRow[] = members.map((member) => {
        const personDays = personLoads.loads.get(member.id);
        const dayLoads: Record<string, UserDayLoad> = {};

        for (const day of days) {
            const availability = getDayAvailability(member, day.date, team, leaveIndex);
            const capacity = day.isPast ? 0 : availability.availableHours * secondsPerHour;
            const load = personDays?.get(toDayKey(day.date));
            const seconds = (load?.hours || 0) * secondsPerHour;
            const allocations: IssueDayAllocation[] = (load?.issues || [])
                .map((entry) => {
                    const issue = getIssue(entry.key);
                    return issue
                        ? {
                              issue,
                              seconds: entry.hours * secondsPerHour,
                              spanStart: entry.spanStart,
                              spanEnd: entry.spanEnd,
                              isOverdue: entry.isOverdue,
                              isDerivedSpan: entry.isDerived,
                          }
                        : null;
                })
                .filter((a): a is IssueDayAllocation => !!a)
                .sort((a, b) => b.seconds - a.seconds);

            const absenceDays = [...availability.leave, ...availability.holidays];
            const isFullAbsence = availability.isWorkingDay && availability.availableHours <= 0 && absenceDays.length > 0;
            dayLoads[day.key] = {
                ...summarize(seconds, capacity),
                allocations,
                absence: absenceDays.length
                    ? isFullAbsence
                        ? availability.holidays.length
                            ? 'holiday'
                            : 'leave'
                        : 'partial'
                    : undefined,
                absenceTitle: absenceDays.length ? absenceDays.map((d) => d.title).join(', ') : undefined,
            };
        }

        return {
            user: { id: member.id, displayName: member.displayName, avatarUrl: member.avatarUrl },
            days: dayLoads,
            total: totalOf(dayLoads),
            unestimated: (personLoads.unestimated.get(member.id) || []).map(toHeatmapIssue),
            unscheduled: (personLoads.unscheduled.get(member.id) || []).map(toHeatmapIssue),
        };
    });

    const groupDays = sumRows(users, days);
    const group: GroupLoadRow = { name: groupName, users, days: groupDays, total: totalOf(groupDays) };

    return {
        days,
        groups: [group],
        summary: groupDays,
        total: group.total,
        capacityPerDay: team.defaults.hoursPerDay * secondsPerHour,
    };
}
