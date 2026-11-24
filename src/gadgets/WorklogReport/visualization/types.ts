export interface VisualizationWorklog {
    groupName?: string;
    sprintName?: string;
    username?: string;
    ticketNo?: string;
    epicDisplay?: string | null;
    projectName?: string;
    issueType?: string;
    statusName?: string;
    timeSpent?: number;
}

export type BreakdownField = 'epicDisplay' | 'projectName' | 'issueType' | 'statusName';

export type BreakdownAccent = 'epic' | 'project' | 'issue-type' | 'status';

export interface BreakdownDimension {
    field: BreakdownField;
    title: string;
    unit: string;
    accent: BreakdownAccent;
    excludedForUserGroup: string | null;
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
