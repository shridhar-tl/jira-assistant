export interface VisualizationWorklog {
    groupName?: string;
    sprintName?: string;
    username?: string;
    userDisplay?: string;
    ticketNo?: string;
    ticketUrl?: string;
    summary?: string;
    parent?: string;
    parentSummary?: string;
    epicDisplay?: string | null;
    projectName?: string;
    issueType?: string;
    statusName?: string;
    timeSpent?: number;
    logTime?: Date;
    logCreated?: Date;
    comment?: string;
    originalestimate?: number;
    remainingestimate?: number;
    totalLogged?: number;
    estVariance?: number;
    fields?: Record<string, unknown>;
}

export type BreakdownAccent = 'epic' | 'project' | 'issue-type' | 'status' | 'parent' | 'custom';

export interface BreakdownDimension {
    key: string;
    title: string;
    unit: string;
    accent: BreakdownAccent;
    emptyLabel: string;
    multiValued: boolean;
    excludedForUserGroup: string | null;
    getValues: (worklog: VisualizationWorklog) => string[];
}

export interface OptionalReportField {
    id: string;
    key: string;
    name: string;
    type: string;
}

export interface BreakdownItem {
    label: string;
    timeSpent: number;
    percentage: number;
    worklogCount: number;
    issueCount: number;
}

export interface GroupTotals {
    timeSpent: number;
    worklogCount: number;
    issueCount: number;
    userCount: number;
}

export interface WorklogGroup {
    key: string;
    worklogs: VisualizationWorklog[];
}

export interface RosterUser {
    name: string;
    displayName: string;
    logged: number;
}

export interface GroupTarget {
    workingDays: number;
    users: RosterUser[];
}

export interface DailyTarget {
    minSecsPerDay: number;
    maxSecsPerDay: number;
}

export type TargetStatus = 'under' | 'on' | 'over';

export interface UserTargetProgress extends RosterUser {
    expectedMin: number;
    expectedMax: number;
    percentage: number;
    status: TargetStatus;
}

export interface IssueEstimate {
    ticketNo: string;
    summary: string;
    ticketUrl?: string;
    originalEstimate: number;
    totalLogged: number;
    remainingEstimate: number;
    variance: number;
}

export interface EstimateSummary {
    issueCount: number;
    estimatedCount: number;
    overCount: number;
    totalEstimate: number;
    totalProjected: number;
    unestimatedTime: number;
    overruns: IssueEstimate[];
}

export interface HygieneMetric {
    key: string;
    title: string;
    description: string;
    worklogCount: number;
    timeSpent: number;
    percentage: number;
}
