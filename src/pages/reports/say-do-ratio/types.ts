export interface SprintBoard {
    id: number;
    name: string;
}

export interface ReportSettings {
    sprintBoards: SprintBoard[];
    noOfSprints: number;
    velocitySprints: number;
    storyPointField?: string;
    workingDays: number[];
    includeNonWorkingDays: boolean;
}

export interface IssueFields {
    summary: string;
    assignee?: any;
    priority?: {
        name: string;
        iconUrl: string;
    };
    issuetype?: {
        name: string;
        iconUrl: string;
    };
    status?: {
        name: string;
    };
    storyPoints?: number;
}

export interface SprintIssue {
    key: string;
    id: string;
    fields: IssueFields;
    completed?: boolean;
    completedOutside?: boolean;
    removedFromSprint?: boolean;
    addedToSprint?: boolean;
    cycleTime?: number;
    initialStoryPoints?: number;
}

export interface StatusWiseTimeSpent {
    [status: string]: number;
}

export interface SprintData {
    id: number;
    name: string;
    startDate: string;
    completeDate: string;
    velocity?: number;
    velocityGrowth?: number;
    sayDoRatio?: number;
    committedStoryPoints?: number;
    completedStoryPoints?: number;
    cycleTime?: number;
    averageCycleTime?: number;
    cycleTimesIssuesCount?: number;
    logUnavailable?: boolean;
    issues: SprintIssue[];
    statusWiseTimeSpent: StatusWiseTimeSpent;
}

export interface BoardData {
    id: number;
    name: string;
    velocity?: number;
    velocityGrowth?: number;
    sayDoRatio?: number;
    averageCycleTime?: number;
    logUnavailable?: boolean;
    sprintList: (SprintData | null)[];
    boardColumnsOrder: { [status: string]: number };
}
