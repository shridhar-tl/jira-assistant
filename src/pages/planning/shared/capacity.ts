import { addDays, differenceInCalendarDays, isAfter, startOfDay } from 'date-fns';

import { getDayAvailability, getRangeAvailability, type LeaveIndex, type RangeAvailability } from './availability';
import { nearCapacityPercent } from './constants';
import { getIssuePlanParts, getPersonShares, type DistributionContext } from './load-distribution';
import type { PlannerIssue, PlannerSprint, PlanningUnit, TeamDefinition, TeamMember } from './types';

export type CapacityLevel = 'none' | 'under' | 'near' | 'over';

export type EstimateUnit = 'points' | 'hours';

export interface SprintRange {
    start: Date;
    end: Date;
    isDerived: boolean;
}

export interface MemberSprintCapacity {
    member: TeamMember;
    availability: RangeAvailability;
    capacityHours: number;
    capacityPoints: number;
    committedHours: number;
    committedPoints: number;
    issueKeys: string[];
    level: CapacityLevel;
}

export interface SprintCapacity {
    sprintId: number;
    range: SprintRange | null;
    members: MemberSprintCapacity[];
    unassignedHours: number;
    unassignedPoints: number;
    unassignedCount: number;
    capacityHours: number;
    normalCapacityHours: number;
    capacityPoints: number;
    committedHours: number;
    committedPoints: number;
    overridePercent: number;
    issueCount: number;
    unestimatedCount: number;
    level: CapacityLevel;
    percent: number | null;
}

export interface CapacityInput {
    team: TeamDefinition;
    members: TeamMember[];
    leaveIndex: LeaveIndex;
    velocity: number | null;
    estimateUnit: EstimateUnit;
}

const defaultSprintDays = 14;
const secondsPerHour = 3600;

export function getIssueHours(issue: PlannerIssue): number {
    const seconds = issue.remainingEstimate ?? issue.originalEstimate;
    return seconds && seconds > 0 ? seconds / secondsPerHour : 0;
}

export function getIssuePoints(issue: PlannerIssue, estimateUnit: EstimateUnit): number {
    if (estimateUnit === 'hours') {
        return 0;
    }
    return issue.points && issue.points > 0 ? issue.points : 0;
}

export function isIssueEstimated(issue: PlannerIssue, estimateUnit: EstimateUnit): boolean {
    return estimateUnit === 'points' ? issue.points !== null : (issue.remainingEstimate ?? issue.originalEstimate) !== null;
}

export function getEstimateUnit(estimationFieldId: string | null): EstimateUnit {
    return estimationFieldId === 'timeoriginalestimate' || estimationFieldId === 'timeestimate' ? 'hours' : 'points';
}

/**
 * Sprints without dates (common for future sprints) get the dates following the previous sprint, with the length of the last dated sprint.
 */
export function getSprintRanges(sprints: PlannerSprint[]): Map<number, SprintRange> {
    const ranges = new Map<number, SprintRange>();
    let previousEnd: Date | null = null;
    let lastLength = defaultSprintDays;

    for (const sprint of sprints) {
        if (sprint.startDate && sprint.endDate) {
            const start = startOfDay(sprint.startDate);
            const end = startOfDay(sprint.endDate);
            ranges.set(sprint.id, { start, end, isDerived: false });
            lastLength = Math.max(1, differenceInCalendarDays(end, start));
            previousEnd = end;
        } else {
            const start: Date = previousEnd ? addDays(previousEnd, 1) : startOfDay(new Date());
            const end = addDays(start, lastLength - 1);
            ranges.set(sprint.id, { start, end, isDerived: true });
            previousEnd = end;
        }
    }

    return ranges;
}

export function getCapacityLevel(committed: number, capacity: number): CapacityLevel {
    if (committed <= 0 && capacity <= 0) {
        return 'none';
    }
    if (capacity <= 0) {
        return 'over';
    }
    const percent = (committed * 100) / capacity;
    if (percent > 100) {
        return 'over';
    }
    return percent >= nearCapacityPercent ? 'near' : 'under';
}

export function createDistributionContext(
    members: TeamMember[],
    team: TeamDefinition,
    leaveIndex: LeaveIndex,
    fallbackRange: { start: Date; end: Date } | null,
    leadTimeDays = 0,
): DistributionContext {
    const memberMap = new Map(members.map((m) => [m.id, m]));
    return {
        isWorkingDay: (personId, date) => {
            const member = memberMap.get(personId);
            if (!member) {
                return team.defaults.workingDays.includes(date.getDay());
            }
            return getDayAvailability(member, date, team, leaveIndex).isWorkingDay;
        },
        fallbackRange,
        leadTimeDays,
        hoursPerDay: team.defaults.hoursPerDay,
        today: new Date(),
    };
}

function getPlannableFactor(team: TeamDefinition, sprintId: number): { factor: number; override: number } {
    const override = team.sprintOverrides[String(sprintId)];
    const overridePercent = typeof override === 'number' && override >= 0 ? override : 100;
    return { factor: (overridePercent / 100) * (team.focusFactor / 100), override: overridePercent };
}

export function getCommittedValue(capacity: Pick<SprintCapacity, 'committedHours' | 'committedPoints'>, unit: PlanningUnit): number {
    return unit === 'hours' ? capacity.committedHours : capacity.committedPoints;
}

export function getCapacityValue(capacity: Pick<SprintCapacity, 'capacityHours' | 'capacityPoints'>, unit: PlanningUnit): number {
    return unit === 'hours' ? capacity.capacityHours : capacity.capacityPoints;
}

/**
 * Capacity of each member for the sprint: working days × hours/day × allocation − leave − holidays, × sprint override × focus factor.
 * Points capacity uses the selected velocity scaled by available vs normal capacity (CP-5), or hours per point when there is no velocity.
 */
export function computeSprintCapacity(sprint: PlannerSprint, range: SprintRange | null, issues: PlannerIssue[], input: CapacityInput): SprintCapacity {
    const { team, members, leaveIndex, velocity, estimateUnit } = input;
    const { factor, override } = getPlannableFactor(team, sprint.id);
    const ctx = createDistributionContext(members, team, leaveIndex, range, 0);

    const memberRows = new Map<string, MemberSprintCapacity>();
    let capacityHours = 0;
    let normalCapacityHours = 0;

    for (const member of members) {
        const availability = range
            ? getRangeAvailability(member, range.start, range.end, team, leaveIndex)
            : { workingDays: 0, baseHours: 0, leaveHours: 0, holidayHours: 0, availableHours: 0, leaveDays: 0, holidayDays: 0 };
        const memberCapacity = availability.availableHours * factor;
        capacityHours += memberCapacity;
        normalCapacityHours += availability.baseHours * (team.focusFactor / 100);
        memberRows.set(member.id, {
            member,
            availability,
            capacityHours: memberCapacity,
            capacityPoints: 0,
            committedHours: 0,
            committedPoints: 0,
            issueKeys: [],
            level: 'none',
        });
    }

    let unassignedHours = 0;
    let unassignedPoints = 0;
    let unassignedCount = 0;
    let committedHours = 0;
    let committedPoints = 0;
    let unestimatedCount = 0;
    let issueCount = 0;

    for (const issue of issues) {
        if (!issue.isSubtask || !issue.parentKey || !issues.some((i) => i.key === issue.parentKey)) {
            issueCount++;
            if (!isIssueEstimated(issue, estimateUnit)) {
                unestimatedCount++;
            }
        }
        if (issue.statusCategory === 'done') {
            continue;
        }

        const hours = getIssueHours(issue);
        const points = getIssuePoints(issue, estimateUnit);
        committedHours += hours;
        committedPoints += points;

        const { parts } = getIssuePlanParts(issue, hours, ctx);
        const shares = getPersonShares(parts, ctx);
        if (!shares.size) {
            unassignedHours += hours;
            unassignedPoints += points;
            unassignedCount++;
            continue;
        }

        shares.forEach((share, personId) => {
            const row = memberRows.get(personId);
            if (row) {
                row.committedHours += hours * share;
                row.committedPoints += points * share;
                if (!row.issueKeys.includes(issue.key)) {
                    row.issueKeys.push(issue.key);
                }
            } else {
                unassignedHours += hours * share;
                unassignedPoints += points * share;
            }
        });
    }

    const capacityPoints =
        velocity && velocity > 0 && normalCapacityHours > 0
            ? (velocity * capacityHours) / normalCapacityHours
            : team.hoursPerPoint > 0
              ? capacityHours / team.hoursPerPoint
              : 0;

    const unit = team.planningUnit;
    const rows = [...memberRows.values()].map((row) => {
        const capacityPointsForMember = capacityHours > 0 ? (capacityPoints * row.capacityHours) / capacityHours : 0;
        const level =
            unit === 'hours' || estimateUnit === 'hours'
                ? getCapacityLevel(row.committedHours, row.capacityHours)
                : getCapacityLevel(row.committedPoints, capacityPointsForMember);
        return { ...row, capacityPoints: capacityPointsForMember, level };
    });

    const useHours = unit === 'hours' || estimateUnit === 'hours';
    const committed = useHours ? committedHours : committedPoints;
    const capacity = useHours ? capacityHours : capacityPoints;

    return {
        sprintId: sprint.id,
        range,
        members: rows,
        unassignedHours,
        unassignedPoints,
        unassignedCount,
        capacityHours,
        normalCapacityHours,
        capacityPoints,
        committedHours,
        committedPoints,
        overridePercent: override,
        issueCount,
        unestimatedCount,
        level: getCapacityLevel(committed, capacity),
        percent: capacity > 0 ? Math.round((committed * 100) / capacity) : null,
    };
}

export function isRangeInPast(range: SprintRange | null): boolean {
    return !!range && isAfter(startOfDay(new Date()), range.end);
}
