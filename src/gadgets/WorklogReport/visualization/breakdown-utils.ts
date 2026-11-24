import type {
    BreakdownAccent,
    BreakdownDimension,
    BreakdownItem,
    GroupTotals,
    OptionalReportField,
    VisualizationWorklog,
    WorklogGroup,
} from './types';

const unavailableLabel = '(Unavailable)';
const minimumBarWidth = 1.5;

export const accentClasses: Record<BreakdownAccent, string> = {
    epic: 'bg-(--viz-epic)',
    project: 'bg-(--viz-project)',
    'issue-type': 'bg-(--viz-issue-type)',
    status: 'bg-(--viz-status)',
    parent: 'bg-(--viz-parent)',
    custom: 'bg-(--viz-custom)',
};

export function getBarWidth(value: number, maxValue: number): number {
    if (!maxValue || !value) {
        return 0;
    }
    return Math.max(minimumBarWidth, Math.min(100, (value * 100) / maxValue));
}

const breakableFieldTypes = new Set([
    'option',
    'array',
    'user',
    'priority',
    'resolution',
    'version',
    'component',
    'option-with-child',
    'securitylevel',
    'group',
]);

const nonBreakableFieldKeys = new Set(['project', 'issuetype', 'parent', 'status', 'assignee', 'reporter', 'comment']);

function singleValue(value: string | null | undefined): string[] {
    return value ? [value] : [];
}

const builtInDimensions: BreakdownDimension[] = [
    {
        key: 'epic',
        title: 'By epic',
        unit: 'epic',
        accent: 'epic',
        emptyLabel: unavailableLabel,
        multiValued: false,
        excludedForUserGroup: '4',
        getValues: (w) => singleValue(w.epicDisplay),
    },
    {
        key: 'project',
        title: 'By project',
        unit: 'project',
        accent: 'project',
        emptyLabel: unavailableLabel,
        multiValued: false,
        excludedForUserGroup: '2',
        getValues: (w) => singleValue(w.projectName),
    },
    {
        key: 'issue-type',
        title: 'By issue type',
        unit: 'issue type',
        accent: 'issue-type',
        emptyLabel: unavailableLabel,
        multiValued: false,
        excludedForUserGroup: '3',
        getValues: (w) => singleValue(w.issueType),
    },
    {
        key: 'status',
        title: 'By status',
        unit: 'status',
        accent: 'status',
        emptyLabel: unavailableLabel,
        multiValued: false,
        excludedForUserGroup: null,
        getValues: (w) => singleValue(w.statusName),
    },
    {
        key: 'parent',
        title: 'By parent',
        unit: 'parent',
        accent: 'parent',
        emptyLabel: '(No parent)',
        multiValued: false,
        excludedForUserGroup: null,
        getValues: (w) => singleValue(w.parent && (w.parentSummary ? `${w.parent} - ${w.parentSummary}` : w.parent)),
    },
];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function textOf(value: unknown): string | null {
    if (typeof value === 'string') {
        return value.trim() || null;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (!isRecord(value)) {
        return null;
    }
    const text = textOf(value.value ?? value.displayName ?? value.name ?? value.key);
    const child = isRecord(value.child) ? textOf(value.child) : null;
    return text && child ? `${text} - ${child}` : text;
}

export function getFieldValues(value: unknown): string[] {
    const values = (Array.isArray(value) ? value : [value]).map(textOf).filter((v): v is string => !!v);
    return Array.from(new Set(values));
}

function toFieldDimension({ key, name, type }: OptionalReportField): BreakdownDimension {
    return {
        key: `field-${key}`,
        title: `By ${name}`,
        unit: 'value',
        accent: 'custom',
        emptyLabel: '(None)',
        multiValued: type === 'array',
        excludedForUserGroup: null,
        getValues: (w) => getFieldValues(w.fields?.[key]),
    };
}

export function getOptionalFieldDimensions(optionalFields?: OptionalReportField[]): BreakdownDimension[] {
    if (!Array.isArray(optionalFields)) {
        return [];
    }
    return optionalFields.filter((f) => breakableFieldTypes.has(f.type) && !nonBreakableFieldKeys.has(f.key)).map(toFieldDimension);
}

export function getDimensionsForGroup(fieldDimensions: BreakdownDimension[], reportUserGrp?: string): BreakdownDimension[] {
    return [...builtInDimensions, ...fieldDimensions].filter((d) => !reportUserGrp || d.excludedForUserGroup !== reportUserGrp);
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

export function toPercentage(value: number, total: number): number {
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

function addToBucket(buckets: Map<string, BreakdownAccumulator>, label: string, worklog: VisualizationWorklog): void {
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

function toBreakdownItems(buckets: Map<string, BreakdownAccumulator>, totalTimeSpent: number): BreakdownItem[] {
    return Array.from(buckets, ([label, { timeSpent, worklogCount, issues }]) => ({
        label,
        timeSpent,
        percentage: toPercentage(timeSpent, totalTimeSpent),
        worklogCount,
        issueCount: issues.size,
    }));
}

export function buildBreakdown(worklogs: VisualizationWorklog[], dimension: BreakdownDimension, totalTimeSpent: number): BreakdownItem[] {
    const buckets = new Map<string, BreakdownAccumulator>();
    for (const worklog of worklogs) {
        const values = dimension.getValues(worklog);
        if (!values.length) {
            addToBucket(buckets, dimension.emptyLabel, worklog);
        }
        values.forEach((label) => addToBucket(buckets, label, worklog));
    }

    return toBreakdownItems(buckets, totalTimeSpent).sort((a, b) => b.timeSpent - a.timeSpent || a.label.localeCompare(b.label));
}

export function buildOrderedBreakdown(
    worklogs: VisualizationWorklog[],
    labels: string[],
    labelOf: (worklog: VisualizationWorklog) => string | null,
    totalTimeSpent: number,
): BreakdownItem[] {
    const buckets = new Map<string, BreakdownAccumulator>();
    for (const worklog of worklogs) {
        const label = labelOf(worklog);
        if (label) {
            addToBucket(buckets, label, worklog);
        }
    }
    const items = toBreakdownItems(buckets, totalTimeSpent);
    return labels.map((label) => items.find((i) => i.label === label)).filter((i): i is BreakdownItem => !!i);
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
