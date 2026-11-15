import { addDays, isAfter } from 'date-fns';

import { parseDateKey, toDateKey } from './segments';
import type { LeaveEntry, PlannerUser, TeamDefinition, TeamMember } from './types';

export interface LeaveDay {
    hours: number | null;
    title: string;
}

/** Leave and holidays per member per day. Holidays for everyone are stored under the '*' key. */
export type LeaveIndex = Map<string, Map<string, LeaveDay[]>>;

export const everyoneKey = '*';

export interface DayAvailability {
    dayKey: string;
    isWorkingDay: boolean;
    baseHours: number;
    leaveHours: number;
    holidayHours: number;
    availableHours: number;
    leave: LeaveDay[];
    holidays: LeaveDay[];
}

export interface RangeAvailability {
    workingDays: number;
    baseHours: number;
    leaveHours: number;
    holidayHours: number;
    availableHours: number;
    leaveDays: number;
    holidayDays: number;
}

function addToIndex(index: LeaveIndex, memberKey: string, dayKey: string, day: LeaveDay) {
    let memberDays = index.get(memberKey);
    if (!memberDays) {
        memberDays = new Map();
        index.set(memberKey, memberDays);
    }
    const list = memberDays.get(dayKey);
    if (list) {
        list.push(day);
    } else {
        memberDays.set(dayKey, [day]);
    }
}

/**
 * Builds the leave index from manual entries and the entries read from calendars.
 * Entries without a member are holidays. Holidays with memberIds only apply to those members.
 */
export function buildLeaveIndex(entries: LeaveEntry[]): LeaveIndex {
    const index: LeaveIndex = new Map();

    for (const entry of entries) {
        let current = parseDateKey(entry.start);
        const end = parseDateKey(entry.end);
        const day: LeaveDay = { hours: entry.hours, title: entry.title };
        const keys = entry.memberId ? [entry.memberId] : entry.memberIds?.length ? entry.memberIds : [everyoneKey];

        let guard = 0;
        while (!isAfter(current, end) && guard++ < 800) {
            const dayKey = toDateKey(current);
            keys.forEach((key) => addToIndex(index, key, dayKey, day));
            current = addDays(current, 1);
        }
    }

    return index;
}

export function getMemberHoursPerDay(member: Pick<TeamMember, 'hoursPerDay'> | undefined, team: TeamDefinition): number {
    return member?.hoursPerDay || team.defaults.hoursPerDay;
}

export function getMemberWorkingDays(member: Pick<TeamMember, 'workingDays'> | undefined, team: TeamDefinition): number[] {
    return member?.workingDays?.length ? member.workingDays : team.defaults.workingDays;
}

function reduceHours(days: LeaveDay[], hoursPerDay: number): number {
    let total = 0;
    for (const day of days) {
        total += day.hours === null ? hoursPerDay : Math.min(day.hours, hoursPerDay);
    }
    return Math.min(total, hoursPerDay);
}

export function getDayAvailability(member: TeamMember, date: Date, team: TeamDefinition, index: LeaveIndex): DayAvailability {
    const dayKey = toDateKey(date);
    const hoursPerDay = getMemberHoursPerDay(member, team);
    const workingDays = getMemberWorkingDays(member, team);
    const isWorkingDay = workingDays.includes(date.getDay());
    const allocation = member.allocation / 100;

    const holidays = [...(index.get(everyoneKey)?.get(dayKey) || []), ...(index.get(`h:${member.id}`)?.get(dayKey) || [])];
    const leave = index.get(member.id)?.get(dayKey) || [];

    if (!isWorkingDay) {
        return { dayKey, isWorkingDay, baseHours: 0, leaveHours: 0, holidayHours: 0, availableHours: 0, leave, holidays };
    }

    const holidayHours = reduceHours(holidays, hoursPerDay);
    const leaveHours = Math.min(reduceHours(leave, hoursPerDay), hoursPerDay - holidayHours);
    const baseHours = hoursPerDay * allocation;
    const availableHours = Math.max(0, (hoursPerDay - holidayHours - leaveHours) * allocation);

    return {
        dayKey,
        isWorkingDay,
        baseHours,
        leaveHours: leaveHours * allocation,
        holidayHours: holidayHours * allocation,
        availableHours,
        leave,
        holidays,
    };
}

export function getRangeAvailability(member: TeamMember, start: Date, end: Date, team: TeamDefinition, index: LeaveIndex): RangeAvailability {
    const result: RangeAvailability = {
        workingDays: 0,
        baseHours: 0,
        leaveHours: 0,
        holidayHours: 0,
        availableHours: 0,
        leaveDays: 0,
        holidayDays: 0,
    };
    const hoursPerDay = getMemberHoursPerDay(member, team) * (member.allocation / 100) || 1;

    let current = start;
    let guard = 0;
    while (!isAfter(current, end) && guard++ < 800) {
        const day = getDayAvailability(member, current, team, index);
        if (day.isWorkingDay) {
            result.workingDays++;
            result.baseHours += day.baseHours;
            result.leaveHours += day.leaveHours;
            result.holidayHours += day.holidayHours;
            result.availableHours += day.availableHours;
        }
        current = addDays(current, 1);
    }

    result.leaveDays = Math.round((result.leaveHours / hoursPerDay) * 10) / 10;
    result.holidayDays = Math.round((result.holidayHours / hoursPerDay) * 10) / 10;
    return result;
}

/**
 * Members holidays restricted to a subset of the team are indexed with an "h:" prefix so they are not treated as leave.
 */
export function buildScheduleIndex(manualLeave: LeaveEntry[], calendarEntries: LeaveEntry[]): LeaveIndex {
    const all = [...manualLeave, ...calendarEntries];
    const holidaysForSubset = all.filter((e) => !e.memberId && e.memberIds?.length);
    const others = all.filter((e) => e.memberId || !e.memberIds?.length);
    const index = buildLeaveIndex(others);

    for (const entry of holidaysForSubset) {
        const scoped = buildLeaveIndex([{ ...entry, memberIds: entry.memberIds?.map((id) => `h:${id}`) }]);
        scoped.forEach((days, key) =>
            days.forEach((list, dayKey) => list.forEach((day) => addToIndex(index, key, dayKey, day))),
        );
    }

    return index;
}

export function toTeamMember(user: PlannerUser, team: TeamDefinition): TeamMember {
    const stored = team.members.find((m) => m.id === user.id);
    if (stored) {
        return { ...stored, displayName: user.displayName || stored.displayName, avatarUrl: user.avatarUrl || stored.avatarUrl };
    }
    return { ...user, allocation: 100, hoursPerDay: null, workingDays: null };
}
