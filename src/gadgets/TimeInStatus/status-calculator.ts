import type { StatusTransition } from '@/types';

import { createDurationCalculator, type DurationCalculator } from './business-time';
import {
    fieldGroupPrefix,
    noGroupValue,
    overflowStatusColorVar,
    statusCategoryColorVars,
    statusCategoryOrder,
    ungroupedUsersName,
} from './constants';
import type {
    DurationStats,
    GroupSummary,
    IssueStatusMetrics,
    StatusCategory,
    StatusInfo,
    StatusIssueTime,
    StatusSegment,
    StatusStats,
    TimeInStatusDataset,
    TimeInStatusModel,
    TisIssue,
    WorkingTimeSettings,
} from './types';

type StatusLookup = Map<string, StatusInfo>;

export interface ModelOptions {
    groupBy: string;
    workingTime: WorkingTimeSettings | null;
}

interface StatusResolver {
    get: (id: string, name: string, fallbackCategory: StatusCategory) => StatusInfo;
    all: () => StatusInfo[];
}

function createStatusResolver(statuses: StatusInfo[]): StatusResolver {
    const byId: StatusLookup = new Map(statuses.map((s) => [s.id, s]));
    const byName: StatusLookup = new Map(statuses.map((s) => [s.name.toLowerCase(), s]));
    let nextOrder = statuses.length;

    return {
        get: (id, name, fallbackCategory) => {
            const existing = byId.get(id) || byName.get(name.toLowerCase());
            if (existing) {
                return existing;
            }
            // Status might have been deleted from Jira after it was used in the history
            const created: StatusInfo = { id: id || `name:${name}`, name, category: fallbackCategory, order: nextOrder++ };
            byId.set(created.id, created);
            byName.set(name.toLowerCase(), created);
            return created;
        },
        all: () => [...byId.values()],
    };
}

function getResolvedAt(issue: TisIssue, transitions: StatusTransition[], resolver: StatusResolver): number | null {
    if (issue.status.category !== 'done') {
        return null;
    }
    if (issue.resolvedAt) {
        return issue.resolvedAt;
    }
    for (let i = transitions.length - 1; i >= 0; i--) {
        const { toId, to, fromId, from } = transitions[i];
        const isIntoDone = resolver.get(toId, to, 'indeterminate').category === 'done';
        const isFromDone = resolver.get(fromId, from, 'indeterminate').category === 'done';
        if (isIntoDone && !isFromDone) {
            return transitions[i].at;
        }
    }
    return issue.created;
}

function buildSegments(
    issue: TisIssue,
    transitions: StatusTransition[],
    resolver: StatusResolver,
    calculator: DurationCalculator,
    resolvedAt: number | null,
    now: number,
): StatusSegment[] {
    const segments: StatusSegment[] = [];
    const first = transitions[0];
    let current = first ? resolver.get(first.fromId, first.from, 'new') : resolver.get(issue.status.id, issue.status.name, issue.status.category);
    let start = issue.created;

    for (const transition of transitions) {
        const end = Math.max(start, transition.at);
        segments.push({ statusId: current.id, status: current.name, start, end, duration: calculator.measure(start, end) });
        current = resolver.get(transition.toId, transition.to, issue.status.category);
        start = end;
    }

    const end = current.category === 'done' ? Math.max(start, resolvedAt ?? start) : Math.max(start, now);
    segments.push({ statusId: current.id, status: current.name, start, end, duration: calculator.measure(start, end) });

    return segments;
}

function computeIssueMetrics(
    issue: TisIssue,
    transitions: StatusTransition[],
    isPartialHistory: boolean,
    resolver: StatusResolver,
    calculator: DurationCalculator,
    now: number,
): IssueStatusMetrics {
    const resolvedAt = getResolvedAt(issue, transitions, resolver);
    const segments = buildSegments(issue, transitions, resolver, calculator, resolvedAt, now);

    const timeInStatus: Record<string, number> = {};
    let cycleStart: number | null = null;

    for (const segment of segments) {
        timeInStatus[segment.statusId] = (timeInStatus[segment.statusId] || 0) + segment.duration;
        if (cycleStart === null && resolver.get(segment.statusId, segment.status, 'indeterminate').category === 'indeterminate') {
            cycleStart = segment.start;
        }
    }

    const lastSegment = segments[segments.length - 1];
    const isDone = resolvedAt !== null;

    return {
        issue,
        segments,
        timeInStatus,
        currentStatusAge: isDone ? 0 : lastSegment.duration,
        leadTime: isDone ? calculator.measure(issue.created, resolvedAt) : null,
        cycleTime: isDone && cycleStart !== null ? calculator.measure(cycleStart, resolvedAt) : null,
        wipAge: !isDone && cycleStart !== null ? calculator.measure(cycleStart, now) : null,
        isPartialHistory,
    };
}

function getMedian(sortedValues: number[]): number {
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 ? sortedValues[mid] : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
}

function getDurationStats(values: (number | null)[]): DurationStats {
    const valid = values.filter((v): v is number => v !== null).sort((a, b) => a - b);
    if (!valid.length) {
        return { count: 0, avg: null, median: null };
    }
    const total = valid.reduce((sum, v) => sum + v, 0);
    return { count: valid.length, avg: total / valid.length, median: getMedian(valid) };
}

function buildStatusStats(status: StatusInfo, issues: IssueStatusMetrics[]): StatusStats | null {
    const visits: StatusIssueTime[] = [];
    let currentCount = 0;

    for (const metrics of issues) {
        if (metrics.issue.status.id === status.id) {
            currentCount++;
        }
        if (metrics.segments.some((s) => s.statusId === status.id)) {
            visits.push({ metrics, duration: metrics.timeInStatus[status.id] || 0 });
        }
    }

    if (!visits.length && !currentCount) {
        return null;
    }

    visits.sort((a, b) => b.duration - a.duration);
    const durations = visits.map((v) => v.duration).sort((a, b) => a - b);
    const total = durations.reduce((sum, v) => sum + v, 0);

    return {
        status,
        currentCount,
        visitedCount: visits.length,
        avg: visits.length ? total / visits.length : 0,
        median: visits.length ? getMedian(durations) : 0,
        max: visits.length ? visits[0].duration : 0,
        total,
        issues: visits,
        isBottleneck: false,
    };
}

function markBottleneck(stats: StatusStats[]): void {
    let bottleneck: StatusStats | null = null;
    for (const item of stats) {
        if (item.status.category === 'indeterminate' && item.avg > 0 && (!bottleneck || item.avg > bottleneck.avg)) {
            bottleneck = item;
        }
    }
    if (bottleneck) {
        bottleneck.isBottleneck = true;
    }
}

function buildGroupSummary(name: string, issues: IssueStatusMetrics[], orderedStatuses: StatusInfo[]): GroupSummary {
    const statuses = orderedStatuses.map((s) => buildStatusStats(s, issues)).filter((s): s is StatusStats => !!s);
    markBottleneck(statuses);

    return {
        name,
        issueCount: issues.length,
        wipCount: issues.filter((m) => m.wipAge !== null).length,
        resolvedCount: issues.filter((m) => m.leadTime !== null).length,
        leadTime: getDurationStats(issues.map((m) => m.leadTime)),
        cycleTime: getDurationStats(issues.map((m) => m.cycleTime)),
        statuses,
        issues,
    };
}

function orderStatuses(statuses: StatusInfo[], issues: IssueStatusMetrics[]): StatusInfo[] {
    const entryOffsets = new Map<string, { sum: number; count: number }>();

    for (const { issue, segments } of issues) {
        const seen = new Set<string>();
        for (const segment of segments) {
            if (!seen.has(segment.statusId)) {
                seen.add(segment.statusId);
                const entry = entryOffsets.get(segment.statusId) || { sum: 0, count: 0 };
                entry.sum += segment.start - issue.created;
                entry.count++;
                entryOffsets.set(segment.statusId, entry);
            }
        }
    }

    const getAvgEntry = (id: string) => {
        const entry = entryOffsets.get(id);
        return entry ? entry.sum / entry.count : Number.MAX_SAFE_INTEGER;
    };

    return statuses
        .filter((s) => entryOffsets.has(s.id) || issues.some((m) => m.issue.status.id === s.id))
        .sort(
            (a, b) =>
                statusCategoryOrder[a.category] - statusCategoryOrder[b.category] ||
                getAvgEntry(a.id) - getAvgEntry(b.id) ||
                a.name.localeCompare(b.name),
        );
}

function assignStatusColors(statuses: StatusInfo[]): Record<string, string> {
    const usedPerCategory: Record<StatusCategory, number> = { new: 0, indeterminate: 0, done: 0 };
    const colors: Record<string, string> = {};

    [...statuses]
        .sort((a, b) => a.order - b.order)
        .forEach((status) => {
            const palette = statusCategoryColorVars[status.category];
            const index = usedPerCategory[status.category]++;
            colors[status.id] = `var(${palette[index] || overflowStatusColorVar})`;
        });

    return colors;
}

function getUserGroupNames(issue: TisIssue, dataset: TimeInStatusDataset): string[] {
    const userId = issue.assignee?.id;
    if (!userId) {
        return [noGroupValue];
    }
    const names = dataset.userGroups.filter((g) => g.userIds.includes(userId)).map((g) => g.name);
    return names.length ? names : [ungroupedUsersName];
}

function getGroupValues(issue: TisIssue, groupBy: string, dataset: TimeInStatusDataset): string[] {
    switch (groupBy) {
        case 'project':
            return [issue.projectName ? `${issue.projectName} (${issue.projectKey})` : issue.projectKey];
        case 'issuetype':
            return [issue.issueType.name || noGroupValue];
        case 'assignee':
            return [issue.assignee?.displayName || 'Unassigned'];
        case 'userGroup':
            return getUserGroupNames(issue, dataset);
        default:
            if (groupBy.startsWith(fieldGroupPrefix)) {
                return issue.fieldValues.length ? issue.fieldValues : [noGroupValue];
            }
            return [];
    }
}

function buildGroups(
    issues: IssueStatusMetrics[],
    groupBy: string,
    dataset: TimeInStatusDataset,
    orderedStatuses: StatusInfo[],
): GroupSummary[] {
    if (groupBy === 'none') {
        return [];
    }

    const grouped = new Map<string, IssueStatusMetrics[]>();
    for (const metrics of issues) {
        for (const value of getGroupValues(metrics.issue, groupBy, dataset)) {
            const list = grouped.get(value) || [];
            list.push(metrics);
            grouped.set(value, list);
        }
    }

    return [...grouped.entries()]
        .sort(([a], [b]) => (a === noGroupValue ? 1 : b === noGroupValue ? -1 : a.localeCompare(b)))
        .map(([name, list]) => buildGroupSummary(name, list, orderedStatuses));
}

export function buildTimeInStatusModel(dataset: TimeInStatusDataset, { groupBy, workingTime }: ModelOptions): TimeInStatusModel {
    const calculator = createDurationCalculator(workingTime);
    const resolver = createStatusResolver(dataset.statuses);
    const partialKeys = new Set(dataset.loadStats.partialIssueKeys);
    const { now } = dataset;

    const issues = dataset.issues.map((issue) => {
        const transitions = [...(dataset.transitions[issue.key] || [])].sort((a, b) => a.at - b.at);
        return computeIssueMetrics(issue, transitions, partialKeys.has(issue.key), resolver, calculator, now);
    });

    const statuses = orderStatuses(resolver.all(), issues);
    const timelineStart = issues.reduce((min, m) => Math.min(min, m.issue.created), now);

    return {
        statuses,
        statusColors: assignStatusColors(statuses),
        overall: buildGroupSummary('All issues', issues, statuses),
        groups: buildGroups(issues, groupBy, dataset, statuses),
        issues,
        dayLength: calculator.dayLength,
        timelineStart,
        timelineEnd: now,
    };
}
