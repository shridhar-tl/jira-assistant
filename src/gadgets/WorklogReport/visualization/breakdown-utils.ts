import type {
    BreakdownDimension,
    BreakdownField,
    BreakdownItem,
    GroupTotals,
    VisualizationWorklog,
    WorklogGroup,
} from './types';

const unavailableLabel = '(Unavailable)';

export const breakdownDimensions: BreakdownDimension[] = [
    { field: 'epicDisplay', title: 'By epic', unit: 'epic', accent: 'epic', excludedForUserGroup: '4' },
    { field: 'projectName', title: 'By project', unit: 'project', accent: 'project', excludedForUserGroup: '2' },
    { field: 'issueType', title: 'By issue type', unit: 'issue type', accent: 'issue-type', excludedForUserGroup: '3' },
    { field: 'statusName', title: 'By status', unit: 'status', accent: 'status', excludedForUserGroup: null },
];

export function getDimensionsForGroup(reportUserGrp?: string): BreakdownDimension[] {
    return breakdownDimensions.filter((d) => !reportUserGrp || d.excludedForUserGroup !== reportUserGrp);
}

export function groupWorklogs(worklogs: VisualizationWorklog[], field: 'groupName' | 'sprintName'): WorklogGroup[] {
    const groups = new Map<string, VisualizationWorklog[]>();
    for (const worklog of worklogs) {
        const key = worklog[field] ?? '';
        const list = groups.get(key);
        if (list) {
            list.push(worklog);
        } else {
            groups.set(key, [worklog]);
        }
    }
    return Array.from(groups, ([key, list]) => ({ key, worklogs: list }));
}

function toPercentage(value: number, total: number): number {
    return total ? parseFloat(((value * 100) / total).toFixed(2)) : 0;
}

export function getGroupTotals(worklogs: VisualizationWorklog[]): GroupTotals {
    const issues = new Set<string>();
    const users = new Set<string>();
    let timeSpent = 0;
    for (const worklog of worklogs) {
        timeSpent += worklog.timeSpent || 0;
        if (worklog.ticketNo) {
            issues.add(worklog.ticketNo);
        }
        if (worklog.username) {
            users.add(worklog.username);
        }
    }
    return { timeSpent, worklogCount: worklogs.length, issueCount: issues.size, userCount: users.size };
}

interface BreakdownAccumulator {
    timeSpent: number;
    worklogCount: number;
    issues: Set<string>;
}

export function buildBreakdown(worklogs: VisualizationWorklog[], field: BreakdownField, totalTimeSpent: number): BreakdownItem[] {
    const buckets = new Map<string, BreakdownAccumulator>();
    for (const worklog of worklogs) {
        const label = worklog[field] || unavailableLabel;
        let bucket = buckets.get(label);
        if (!bucket) {
            bucket = { timeSpent: 0, worklogCount: 0, issues: new Set() };
            buckets.set(label, bucket);
        }
        bucket.timeSpent += worklog.timeSpent || 0;
        bucket.worklogCount += 1;
        if (worklog.ticketNo) {
            bucket.issues.add(worklog.ticketNo);
        }
    }

    return Array.from(buckets, ([label, { timeSpent, worklogCount, issues }]) => ({
        label,
        timeSpent,
        percentage: toPercentage(timeSpent, totalTimeSpent),
        worklogCount,
        issueCount: issues.size,
    })).sort((a, b) => b.timeSpent - a.timeSpent || a.label.localeCompare(b.label));
}

export function foldBreakdown(items: BreakdownItem[], visibleCount: number, totalTimeSpent: number): { visible: BreakdownItem[]; others: BreakdownItem | null } {
    if (items.length <= visibleCount + 1) {
        return { visible: items, others: null };
    }
    const visible = items.slice(0, visibleCount);
    const hidden = items.slice(visibleCount);
    const timeSpent = hidden.reduce((sum, i) => sum + i.timeSpent, 0);
    return {
        visible,
        others: {
            label: `Others (${hidden.length})`,
            timeSpent,
            percentage: toPercentage(timeSpent, totalTimeSpent),
            worklogCount: hidden.reduce((sum, i) => sum + i.worklogCount, 0),
            issueCount: hidden.reduce((sum, i) => sum + i.issueCount, 0),
        },
    };
}

export function pluralize(count: number, unit: string): string {
    if (count === 1) {
        return `${count} ${unit}`;
    }
    return `${count} ${unit.endsWith('s') ? `${unit}es` : `${unit}s`}`;
}
