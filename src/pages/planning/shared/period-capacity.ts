import { addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, isAfter, isBefore, startOfDay, startOfMonth, startOfWeek } from 'date-fns';

import { getRangeAvailability, type LeaveIndex } from './availability';
import { getCapacityLevel, type MemberSprintCapacity, type SprintCapacity } from './capacity';
import type { PersonDayLoads } from './load-distribution';
import { toDateKey } from './segments';
import type { PlannerSprint, TeamDefinition, TeamMember } from './types';

export type PeriodMode = 'week' | 'month';

export interface CapacityPeriod {
    sprint: PlannerSprint;
    start: Date;
    end: Date;
}

/** Calendar periods used as capacity columns for boards without sprints (kanban boards). */
export function buildPeriods(mode: PeriodMode, count: number, weekStartsOn: 0 | 1 = 1): CapacityPeriod[] {
    const today = startOfDay(new Date());
    const periods: CapacityPeriod[] = [];
    for (let i = 0; i < count; i++) {
        const start = mode === 'week' ? startOfWeek(addWeeks(today, i), { weekStartsOn }) : startOfMonth(addMonths(today, i));
        const end = mode === 'week' ? endOfWeek(start, { weekStartsOn }) : endOfMonth(start);
        const name = mode === 'week' ? `Week of ${format(start, 'd MMM')}` : format(start, 'MMMM yyyy');
        periods.push({
            start,
            end: startOfDay(end),
            sprint: { id: -(i + 1), name, state: i === 0 ? 'active' : 'future', startDate: start, endDate: end, completeDate: null, goal: '', boardId: null },
        });
    }
    return periods;
}

function sumLoad(loads: PersonDayLoads, personId: string, start: Date, end: Date): { hours: number; points: number; keys: string[] } {
    const days = loads.get(personId);
    const result = { hours: 0, points: 0, keys: new Set<string>() };
    if (!days) {
        return { hours: 0, points: 0, keys: [] };
    }
    let current = start;
    let guard = 0;
    while (!isAfter(current, end) && guard++ < 400) {
        const day = days.get(toDateKey(current));
        if (day) {
            result.hours += day.hours;
            result.points += day.points;
            day.issues.forEach((i) => result.keys.add(i.key));
        }
        current = addDays(current, 1);
    }
    return { hours: result.hours, points: result.points, keys: [...result.keys] };
}

/** Capacity by calendar period: availability of each member against the load planned on those days. */
export function computePeriodCapacity(period: CapacityPeriod, members: TeamMember[], team: TeamDefinition, leaveIndex: LeaveIndex, loads: PersonDayLoads): SprintCapacity {
    const today = startOfDay(new Date());
    const start = isBefore(period.start, today) ? today : period.start;
    const factor = team.focusFactor / 100;
    let capacityHours = 0;
    let normalCapacityHours = 0;
    let committedHours = 0;
    let committedPoints = 0;

    const rows: MemberSprintCapacity[] = members.map((member) => {
        const availability = getRangeAvailability(member, start, period.end, team, leaveIndex);
        const load = sumLoad(loads, member.id, start, period.end);
        const memberCapacity = availability.availableHours * factor;
        capacityHours += memberCapacity;
        normalCapacityHours += availability.baseHours * factor;
        committedHours += load.hours;
        committedPoints += load.points;
        return {
            member,
            availability,
            capacityHours: memberCapacity,
            capacityPoints: team.hoursPerPoint > 0 ? memberCapacity / team.hoursPerPoint : 0,
            committedHours: load.hours,
            committedPoints: load.points,
            issueKeys: load.keys,
            level: getCapacityLevel(load.hours, memberCapacity),
        };
    });

    return {
        sprintId: period.sprint.id,
        range: { start: period.start, end: period.end, isDerived: false },
        members: rows,
        unassignedHours: 0,
        unassignedPoints: 0,
        unassignedCount: 0,
        capacityHours,
        normalCapacityHours,
        capacityPoints: team.hoursPerPoint > 0 ? capacityHours / team.hoursPerPoint : 0,
        committedHours,
        committedPoints,
        overridePercent: 100,
        issueCount: new Set(rows.flatMap((r) => r.issueKeys)).size,
        unestimatedCount: 0,
        level: getCapacityLevel(committedHours, capacityHours),
        percent: capacityHours > 0 ? Math.round((committedHours * 100) / capacityHours) : null,
    };
}
