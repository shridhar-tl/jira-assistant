export interface User {
    id: number;
    jiraUrl: string;
    apiUrl?: string;
    userId: string;
    email: string;
    emailAddress?: string;
    displayName?: string;
    accountId?: string;
    authType?: 'C' | 'O';
    uid?: string;
    pwd?: string;
    lastLogin: Date;
    dateCreated: Date;
    dateUpdated?: Date;
    instId?: string;
    _ts?: number;
}

export interface SessionUser {
    jiraUser: any;
    userId: number;
    currentUser?: any;
    name: string;
    accountId: string;
    emailAddress: string;
    displayName: string;
    jiraUrl: string;
    apiUrl?: string;
    profileUrl: string;
    feedbackUrl: string;
    isAtlasCloud: boolean;
    noDonations?: boolean;
    hideDonateMenu?: boolean;
    allowClosedTickets?: boolean;
    autoUpload?: boolean;
    defaultTimeSpent?: string;
    minHours?: number;
    maxHours?: number;
    worklogJQLSuffix?: string;
    notifyUsers?: boolean;
    dateFormat?: string;
    timeFormat?: string;
    startOfDay?: string;
    endOfDay?: string;
    startOfWeek?: number;
    workingDays?: number[];
    commentLength?: number;
    dashboards?: Dashboard[];
    openTicketsJQL?: string;
    suggestionJQL?: string;
    disableDevNotification?: boolean;
    disableJiraUpdates?: boolean;
    jiraUpdatesJQL?: string;
    meetingTicket?: string;
    startOfDayDisp?: string;
    endOfDayDisp?: string;
    hasGoogleCredentials?: boolean;
    hasOutlookCredentials?: boolean;
    projects?: any[];
    epicNameField?: { id: string; name?: string };
    storyPointField?: { id: string; name?: string };
    rapidViews?: any[];
}

export interface Worklog {
    id: number;
    createdBy: string | number;
    ticketNo: string;
    dateStarted: Date;
    startTime?: Date;
    description?: string;
    comment?: string;
    timeSpent: string;
    overrideTimeSpent?: string;
    totalSecs?: number;
    totalMins?: number;
    worklogId?: number;
    isUploaded: boolean;
    uploadImmediately?: boolean;
    parentId?: number;
    summary?: string;
    copy?: boolean;
    author?: JiraUser;
    _ts?: number;
}

export interface UploadedWorklog {
    ticketNo: string;
    url: string;
    issueType: string;
    parent?: string;
    summary: string;
    logTime: Date;
    logCreated: Date;
    logUpdated: Date;
    comment: string;
    totalHours: string;
    totalMins: number;
    totalSecs: number;
    worklogId: number;
    author?: JiraUser;
}

export interface WorklogCalendarEntry {
    entryType: number;
    start: Date;
    title: string;
    id: string;
    url: string;
    end: Date;
    editable: boolean;
    sourceObject: Worklog;
    parentId?: number;
}

export interface DateWiseWorklog {
    key: string;
    dateLogged: Date;
    difference: number;
    uploaded: number;
    pendingUpload: number;
    totalHours: number;
    totalSecs: number;
    ticketList: Array<{
        id: number;
        ticketNo: string;
        uploaded: string;
        comment: string;
        worklogId: number;
    }>;
}

export interface TicketWiseWorklog {
    ticketNo: string;
    parentSumm: string;
    parentKey: string;
    summary: string;
    status: string;
    uploaded: number;
    totalHours: number;
    pendingUpload: number;
    logData: Array<{
        id: number;
        dateLogged: Date;
        uploaded: string;
        worklogId: number;
    }>;
}

export interface JiraUser {
    self: string;
    name?: string;
    key?: string;
    accountId: string;
    avatarUrl?: string;
    avatarUrls?: { '16x16'?: string; '24x24'?: string; '32x32'?: string; '48x48'?: string };
    displayName: string;
    emailAddress?: string;
    active: boolean;
    timeZone?: string;
    locale?: string;
    costPerHour?: number;
}

export interface WorklogTimer {
    userId?: number;
    key: string;
    started?: number;
    lapse?: number;
    description?: string;
    created?: number;
    autoPaused?: boolean;
    isActive?: boolean;
    entry?: WorklogTimer;
}

export interface IssueType {
    self: string;
    id: string;
    name: string;
    subtask: boolean;
}

export interface IssueStatus {
    self: string;
    description: string;
    name: string;
    id: string;
}

export interface IssuePriority {
    self: string;
    iconUrl: string;
    name: string;
    id: string;
}

export interface IssueResolution {
    self: string;
    id: string;
    name: string;
}

export interface IssueFields {
    summary: string;
    description?: string;
    issuetype: IssueType;
    created: string;
    updated: string;
    status: IssueStatus;
    priority: IssuePriority;
    assignee?: JiraUser;
    reporter?: JiraUser;
    resolution?: IssueResolution;
    resolutiondate?: string;
    parent?: {
        id: string;
        key: string;
        self: string;
        fields: Partial<IssueFields>;
    };
    worklog?: {
        worklogs: WorklogAPIObject[];
    };
    [customFieldName: string]: any;
}

export interface Issue {
    key: string;
    id: string;
    self: string;
    fields: IssueFields;
    changelog?: IssueChangelog;
    completedOutside?: boolean;
    addedToSprint?: boolean;
    addedToSprintDate?: Date;
    removedFromSprint?: boolean;
}

export interface WorklogAPIObject {
    id: string;
    self: string;
    author: JiraUser;
    body?: string;
    comment?: string;
    created: string;
    updated: string;
    started: string;
    timeSpent?: string;
    timeSpentSeconds: number;
    visibility?: {
        type: string;
        value: string;
    };
}

export interface IssueChangelog {
    startAt: number;
    maxResults: number;
    total: number;
    histories: Array<{
        id: string;
        created: string;
        historyItems: Array<{
            field: string;
            fieldId: string;
            fieldtype: string;
            from: string;
            fromString: string;
            to: string;
            toString: string;
        }>;
    }>;
}

export interface ImportIssue {
    issuekey: ValueObject;
    project: ValueObject;
    summary: ValueObject;
    assignee: ValueObject;
    [fieldName: string]: ValueObject | any;
    importStatus: {
        hasError: boolean;
        hasWarning: boolean;
        imported: boolean;
        createMetadata?: any;
        updateMetadata?: any;
        error?: string;
        warning?: string;
    };
    disabled: boolean;
    selected: boolean;
}

export interface ValueObject {
    value?: any;
    displayText?: string;
    avatarUrl?: string;
    jiraValue?: any;
    error?: string;
}

export interface Sprint {
    id: number;
    self: string;
    state: 'ACTIVE' | 'CLOSED' | 'FUTURE';
    name: string;
    startDate?: string;
    endDate?: string;
    completeDate?: string;
    boardId?: number;
    issues?: Issue[];
    committedStoryPoints: number;
    completedStoryPoints: number;
    sayDoRatio: number;
    velocity?: number;
    velocityGrowth?: number;
    averageCycleTime: number;
    cycleTimesIssuesCount: number;
    statusWiseTimeSpent: Record<string, number>;
    logUnavailable?: boolean;
}

export interface BoardConfig {
    id: number;
    name: string;
    type: 'kanban' | 'scrum';
    projectKey: string;
    columnConfig: {
        columns: Array<{
            id: string;
            name: string;
            statuses: Array<{
                id: string;
                key: string;
                name: string;
            }>;
        }>;
    };
}

export interface SprintVelocityReport {
    boardColumnsOrder: string[];
    closedSprintLists: Sprint[];
    averageCommitted: number;
    averageCompleted: number;
    velocity: number;
    velocityGrowth: number;
    sayDoRatio: number;
    averageCycleTime: number;
    logUnavailable: boolean;
}

export interface Dashboard {
    id: number;
    name: string;
    icon: string;
    layout: number;
    widgets: Widget[];
    isQuickView?: boolean;
    isTabView?: boolean;
}

export interface Widget {
    name: string;
    [key: string]: any;
}

export interface DashboardGadget {
    name: string;
    [key: string]: any;
}

export interface AppSetting {
    userId: number;
    category: SettingsCategory[keyof SettingsCategory];
    name: string;
    value: any;
    _ts?: number;
}

export enum SettingsCategory {
    System = 'SYST',
    General = 'GNRL',
    Advanced = 'ADVN',
    Dashboard = 'DBORD',
    PageSettings = 'PSET',
}

export interface GeneralSettings {
    dateFormat: string;
    timeFormat: string;
    minHours: number;
    maxHours: number;
    commentLength: number;
    startOfDay: string;
    endOfDay: string;
    startOfWeek: number;
    workingDays: number[];
    dataStore?: string;
    OLBT?: string;
    skin?: string;
}

export interface AdvancedSettings {
    openTicketsJQL: string;
    suggestionJQL: string;
    disableJiraUpdates?: boolean;
    jiraUpdatesJQL?: string;
    disableDevNotification?: boolean;
    enableExceptionLogging?: boolean;
    enableAnalyticsLogging?: boolean;
    worklogJQLSuffix?: string;
}

export interface CalendarSettings {
    viewMode: string;
    showWorklogs: boolean;
    showMeetings: boolean;
    showInfo: boolean;
    eventColor: string;
    worklogColor: string;
    infoColor_valid: string;
    infoColor_less: string;
    infoColor_high: string;
}

export interface ReportSettings {
    logFormat: string;
    breakupMode: string;
    groupMode: string;
}

export interface Report {
    id?: number;
    name: string;
    queryName?: string;
    reportType: string;
    query: any;
    isDefault?: boolean;
    userId?: number;
    _ts?: number;
}

export interface PageSettings {
    page_calendar?: CalendarSettings;
    page_reports_UserDayWise?: ReportSettings;
    page_reports_WorklogReport?: Record<string, any>;
    page_reports_SayDoRatioReport?: Record<string, any>;
}

export interface JiraOAuthToken {
    token: string;
    expires: number;
    expires_at?: number;
    refresh_token?: string;
}

export interface JiraCloudAuth {
    token: string;
    expires: number;
    refresh_token: string;
    cloudId: string;
}

export interface BasicAuthCredentials {
    authType: 'C';
    uid: string;
    pwd: string;
}

export interface AuthResult {
    success: boolean;
    userId?: number;
    message?: string;
}

export interface Session {
    authenticated: boolean;
    CurrentUser: SessionUser;
    UserSettings: GeneralSettings;
    userId: number;
    rootUrl: string;
    apiRootUrl?: string;
    pageSettings: PageSettings;
    needIntegration?: boolean;
}

export interface SavedFilter {
    id?: number;
    queryName: string;
    createdBy: string;
    jql?: string;
    fields?: string[];
    _ts?: number;
}

export interface Event {
    id?: number;
    createdBy: string;
    name: string;
    ticketNo: string;
    startTime: Date;
    isEnabled: boolean;
    source: string;
    sourceId: string;
    _ts?: number;
}

export interface UserGroup {
    id?: string;
    name: string;
    timeZone?: string;
    users: JiraUser[];
    isJiraGroup?: boolean;
    createdBy?: string;
    groupName?: string;
    _ts?: number;
}

export interface Bookmark {
    id?: number;
    createdBy: string;
    ticketNo: string;
    summary?: string;
    url?: string;
    _ts?: number;
}

export interface Meeting {
    id: string;
    subject?: string;
    summary?: string;
    description?: string;
    htmlLink?: string;
    webLink?: string;
    location?: string | { displayName: string };
    source?: 'google' | 'outlook';
    start?: {
        dateTime: string;
        timeZone?: string;
    };
    end?: {
        dateTime: string;
        timeZone?: string;
    };
    creator?: {
        email: string;
        displayName?: string;
    };
    organizer?: {
        email?: string;
        displayName?: string;
        emailAddress?: {
            name: string;
            address: string;
        };
    };
    attendees?: Array<{
        email?: string;
        displayName?: string;
        responseStatus?: string;
        status?: {
            response: string;
        };
        emailAddress?: {
            name: string;
            address: string;
        };
    }>;
    hangoutLink?: string;
    onlineMeetingUrl?: string;
    bodyPreview?: string;
}
