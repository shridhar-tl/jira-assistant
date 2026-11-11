import type { UserGroup } from '@/types';

export type HeatmapScopeMode = 'groups' | 'jql';

export type HeatmapRangeMode = 'week' | 'twoWeeks' | 'sprint';

export type LoadLevel = 'none' | 'under' | 'good' | 'over' | 'critical';

export interface HeatmapBoard {
    id: number;
    name: string;
}

export interface WorkloadHeatmapSettings {
    scopeMode: HeatmapScopeMode;
    userGroups: UserGroup[] | null;
    jql: string;
    rangeMode: HeatmapRangeMode;
    board: HeatmapBoard | null;
    sprintId: number | null;
    sprintIssuesOnly: boolean;
    workingDays: number[];
    startDateField: string;
    leadTimeDays: number;
    includeSubtasks: boolean;
    projects: string[];
    issueTypes: string[];
}

export interface HeatmapUser {
    id: string;
    displayName: string;
    avatarUrl?: string;
}

export interface HeatmapGroup {
    name: string;
    users: HeatmapUser[];
}

export interface HeatmapIssue {
    key: string;
    summary: string;
    url?: string;
    assignee: HeatmapUser;
    projectKey: string;
    projectName: string;
    issueType: string;
    issueTypeIconUrl?: string;
    isSubtask: boolean;
    status: string;
    originalEstimate: number | null;
    remainingEstimate: number | null;
    startDate: Date | null;
    dueDate: Date | null;
}

export interface HeatmapDataset {
    groups: HeatmapGroup[];
    issues: HeatmapIssue[];
}

export interface HeatmapDateRange {
    fromDate: Date;
    toDate: Date;
    label: string;
    sprintId?: number;
    sprintName?: string;
}

export interface HeatmapDay {
    key: string;
    date: Date;
    isWorkingDay: boolean;
    isToday: boolean;
    isPast: boolean;
}

export interface IssueDayAllocation {
    issue: HeatmapIssue;
    seconds: number;
    spanStart: Date;
    spanEnd: Date;
    isOverdue: boolean;
    isDerivedSpan: boolean;
}

export interface LoadSummary {
    seconds: number;
    capacity: number;
    percent: number | null;
    level: LoadLevel;
}

export interface UserDayLoad extends LoadSummary {
    allocations: IssueDayAllocation[];
}

export interface UserLoadRow {
    user: HeatmapUser;
    days: Record<string, UserDayLoad>;
    total: LoadSummary;
    unestimated: HeatmapIssue[];
    unscheduled: HeatmapIssue[];
}

export interface GroupLoadRow {
    name: string;
    users: UserLoadRow[];
    days: Record<string, LoadSummary>;
    total: LoadSummary;
}

export interface HeatmapModel {
    days: HeatmapDay[];
    groups: GroupLoadRow[];
    summary: Record<string, LoadSummary>;
    total: LoadSummary;
    capacityPerDay: number;
}

export interface HeatmapFilterOption {
    value: string;
    label: string;
}

export interface HeatmapFilterOptions {
    projects: HeatmapFilterOption[];
    issueTypes: HeatmapFilterOption[];
}
