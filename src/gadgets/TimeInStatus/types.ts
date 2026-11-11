import type { StatusTransition, UserGroup } from '@/types';

import type { AgileBoard, SprintSelectionMap } from '@components/shared/sprint-selector';

export type TimeInStatusScopeMode = 'jql' | 'groups';

export type TimeInStatusPeriodMode = 'dateRange' | 'sprint';

export type TimeInStatusView = 'bottleneck' | 'issues';

export type TimelineScale = 'relative' | 'calendar';

export type StatusCategory = 'new' | 'indeterminate' | 'done';

export type BuiltInGroupBy = 'none' | 'project' | 'issuetype' | 'assignee' | 'userGroup';

export interface TimeInStatusDateRange {
    quickDate: string | null;
    fromDate: string | null;
    toDate: string | null;
}

export interface TimeInStatusSettings {
    scopeMode: TimeInStatusScopeMode;
    jql: string;
    userGroups: UserGroup[] | null;
    periodMode: TimeInStatusPeriodMode;
    dateRange: TimeInStatusDateRange;
    sprintBoards: AgileBoard[];
    sprintSelection: SprintSelectionMap;
    view: TimeInStatusView;
    groupBy: string;
    timelineScale: TimelineScale;
    workingHoursOnly: boolean;
    dcIssueLimit: number;
    displayColumns: string[];
    sortField: string | null;
    isDesc: boolean;
}

export interface WorkingTimeSettings {
    workingDays: number[];
    dayStart: string;
    dayEnd: string;
}

export interface LegacyGridSettings {
    sortField?: string;
    isDesc?: boolean;
}

export interface StoredTimeInStatusSettings extends Partial<TimeInStatusSettings> {
    gridSettings?: LegacyGridSettings;
}

export interface NamedItem {
    name: string;
    iconUrl?: string;
}

export interface IssueUser {
    id: string;
    displayName: string;
    avatarUrl?: string;
}

export interface StatusInfo {
    id: string;
    name: string;
    category: StatusCategory;
    order: number;
}

export interface StatusSegment {
    statusId: string;
    status: string;
    start: number;
    end: number;
    duration: number;
}

export interface TisIssue {
    id: string;
    key: string;
    summary: string;
    url?: string;
    projectKey: string;
    projectName: string;
    issueType: NamedItem;
    status: NamedItem & { id: string; category: StatusCategory };
    assignee: IssueUser | null;
    reporter: IssueUser | null;
    parentKey?: string;
    epicKey?: string;
    storyPoints?: number;
    created: number;
    updated: string;
    resolvedAt: number | null;
    timeEstimate?: number;
    aggregateTimeEstimate?: number;
    originalEstimate?: number;
    aggregateOriginalEstimate?: number;
    fieldValues: string[];
}

export interface IssueStatusMetrics {
    issue: TisIssue;
    segments: StatusSegment[];
    timeInStatus: Record<string, number>;
    currentStatusAge: number;
    leadTime: number | null;
    cycleTime: number | null;
    wipAge: number | null;
    isPartialHistory: boolean;
}

export interface StatusIssueTime {
    metrics: IssueStatusMetrics;
    duration: number;
}

export interface StatusStats {
    status: StatusInfo;
    currentCount: number;
    visitedCount: number;
    avg: number;
    median: number;
    max: number;
    total: number;
    issues: StatusIssueTime[];
    isBottleneck: boolean;
}

export interface DurationStats {
    count: number;
    avg: number | null;
    median: number | null;
}

export interface GroupSummary {
    name: string;
    issueCount: number;
    wipCount: number;
    resolvedCount: number;
    leadTime: DurationStats;
    cycleTime: DurationStats;
    statuses: StatusStats[];
    issues: IssueStatusMetrics[];
}

export interface TimeInStatusModel {
    statuses: StatusInfo[];
    statusColors: Record<string, string>;
    overall: GroupSummary;
    groups: GroupSummary[];
    issues: IssueStatusMetrics[];
    dayLength: number;
    timelineStart: number;
    timelineEnd: number;
}

export interface HistoryLoadStats {
    totalIssues: number;
    cachedIssues: number;
    fetchedIssues: number;
    partialIssueKeys: string[];
    usedFallback: boolean;
}

export interface GroupMembership {
    name: string;
    userIds: string[];
}

export interface TimeInStatusDataset {
    issues: TisIssue[];
    userGroups: GroupMembership[];
    transitions: Record<string, StatusTransition[]>;
    statuses: StatusInfo[];
    loadStats: HistoryLoadStats;
    now: number;
}

export interface PendingGuard {
    issueCount: number;
    staleCount: number;
    limit: number;
}

export interface GroupByOption {
    value: string;
    label: string;
}

export interface GroupByOptionGroup {
    label: string;
    items: GroupByOption[];
}
