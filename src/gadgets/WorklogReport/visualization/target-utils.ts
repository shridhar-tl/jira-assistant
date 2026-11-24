import { endOfDay, isAfter, min as minDate } from 'date-fns';

import { getDateRange } from '@/utils';

import type { GroupTarget, RosterUser } from './types';

export interface ReportGroupUser {
    name: string;
    displayName: string;
    grandTotal?: number;
}

export interface ReportGroup {
    name: string;
    users: ReportGroupUser[];
}

export interface ReportSprint {
    id: number;
    name: string;
    settings?: { fromDate: Date; toDate: Date };
}

export interface TargetSource {
    isSprint: boolean;
    reportUserGrp: string;
    fromDate?: Date;
    toDate?: Date;
    groupedData?: ReportGroup[];
    sprints?: ReportSprint[];
    sprintGroups: Record<number, ReportGroup[] | undefined>;
}

export interface ReportTargets {
    all: GroupTarget | null;
    byGroup: Record<string, GroupTarget>;
}

export function countWorkingDays(fromDate: Date, toDate: Date, isHoliday: (date: Date) => boolean): number {
    const lastDate = minDate([toDate, endOfDay(new Date())]);
    if (isAfter(fromDate, lastDate)) {
        return 0;
    }
    return getDateRange(fromDate, lastDate, isHoliday).filter((d) => !d.isHoliday).length;
}

function mergeUsers(lists: RosterUser[][], sumAcrossLists: boolean): RosterUser[] {
    const merged = new Map<string, RosterUser>();
    for (const list of lists) {
        for (const user of list) {
            const existing = merged.get(user.name);
            if (!existing) {
                merged.set(user.name, { ...user });
            } else if (sumAcrossLists) {
                existing.logged += user.logged;
            }
        }
    }
    return Array.from(merged.values());
}

function toRoster(group: ReportGroup): RosterUser[] {
    return group.users.map(({ name, displayName, grandTotal }) => ({ name, displayName, logged: grandTotal || 0 }));
}

function getRangeTargets({ reportUserGrp, fromDate, toDate, groupedData }: TargetSource, isHoliday: (date: Date) => boolean): ReportTargets {
    if (!fromDate || !toDate || !groupedData?.length) {
        return { all: null, byGroup: {} };
    }
    const workingDays = countWorkingDays(fromDate, toDate, isHoliday);
    const isUserGrouping = reportUserGrp === '1';
    const rosters = groupedData.map(toRoster);

    const byGroup: Record<string, GroupTarget> = {};
    if (isUserGrouping) {
        groupedData.forEach((group, index) => (byGroup[group.name] = { workingDays, users: rosters[index] }));
    }

    return { all: { workingDays, users: mergeUsers(rosters, !isUserGrouping) }, byGroup };
}

function getSprintTargets({ sprints, sprintGroups }: TargetSource, isHoliday: (date: Date) => boolean): ReportTargets {
    const byGroup: Record<string, GroupTarget> = {};
    const sprintRosters: RosterUser[][] = [];
    let totalDays = 0;

    for (const sprint of sprints || []) {
        const groups = sprintGroups[sprint.id];
        if (!groups?.length || !sprint.settings) {
            continue;
        }
        const workingDays = countWorkingDays(sprint.settings.fromDate, sprint.settings.toDate, isHoliday);
        const users = mergeUsers(groups.map(toRoster), false);
        byGroup[sprint.name] = { workingDays, users };
        sprintRosters.push(users);
        totalDays += workingDays;
    }

    return { all: sprintRosters.length ? { workingDays: totalDays, users: mergeUsers(sprintRosters, true) } : null, byGroup };
}

export function getReportTargets(source: TargetSource, isHoliday: (date: Date) => boolean): ReportTargets {
    return source.isSprint ? getSprintTargets(source, isHoliday) : getRangeTargets(source, isHoliday);
}
