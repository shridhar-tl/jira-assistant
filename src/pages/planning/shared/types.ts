export type BoardType = 'scrum' | 'kanban' | 'simple';

export type SprintState = 'active' | 'future' | 'closed';

export type StatusCategory = 'new' | 'indeterminate' | 'done';

export type PlanningUnit = 'points' | 'hours' | 'both';

export type VelocityMode = 'avgCompleted' | 'avgCommitted' | 'median' | 'last' | 'custom';

export type MemberSource = 'board' | 'group' | 'atlassianTeam';

export type SubtaskMode = 'rollup' | 'cards';

export type CardDensity = 'compact' | 'detailed';

export type BarColorMode = 'status' | 'epic' | 'load';

export type Terminology = 'neutral' | 'safe';

export interface PlannerUser {
    id: string;
    displayName: string;
    avatarUrl?: string;
    email?: string;
}

export interface PlannerBoard {
    id: number;
    name: string;
    type: BoardType;
    projectKey?: string;
    projectId?: string;
}

export interface BoardColumn {
    name: string;
    statusIds: string[];
}

export interface BoardConfig {
    boardId: number;
    name: string;
    type: BoardType;
    filterId: string | null;
    estimationFieldId: string | null;
    estimationFieldName: string | null;
    rankFieldId: string | null;
    columns: BoardColumn[];
    doneStatusIds: string[];
    projectKey?: string;
    projectId?: string;
}

export interface PlannerSprint {
    id: number;
    name: string;
    state: SprintState;
    startDate: Date | null;
    endDate: Date | null;
    completeDate: Date | null;
    goal: string;
    boardId: number | null;
}

export interface IssueParentRef {
    key: string;
    summary: string;
    statusCategory: StatusCategory;
    issueType: string;
}

export interface IssueLinkRef {
    id: string;
    typeName: string;
    direction: 'inward' | 'outward';
    label: string;
    issueKey: string;
    issueStatusCategory: StatusCategory;
}

export interface SegmentPerson {
    id: string;
    allocation: number;
}

export interface PlannedSegment {
    id: string;
    start: string;
    end: string;
    label?: string;
    people: SegmentPerson[];
}

export interface FeaturePlacement {
    v: 1;
    boardId: number;
    sprintId: number | null;
    piId?: string;
    estimate?: number | null;
}

export interface PlannerIssue {
    id: string;
    key: string;
    summary: string;
    url: string;
    projectKey: string;
    projectId: string;
    issueTypeId: string;
    issueType: string;
    issueTypeIconUrl?: string;
    isSubtask: boolean;
    hierarchyLevel: number;
    status: string;
    statusId: string;
    statusCategory: StatusCategory;
    priority?: string;
    priorityIconUrl?: string;
    assignee: PlannerUser | null;
    parentKey: string | null;
    parent: IssueParentRef | null;
    epicKey: string | null;
    sprintIds: number[];
    currentSprintId: number | null;
    points: number | null;
    originalEstimate: number | null;
    remainingEstimate: number | null;
    timeSpent: number | null;
    labels: string[];
    components: string[];
    fixVersions: string[];
    teamId: string | null;
    teamName: string | null;
    startDate: Date | null;
    dueDate: Date | null;
    resolutionDate: Date | null;
    created: Date | null;
    flagged: boolean;
    color: string | null;
    links: IssueLinkRef[];
    subtaskKeys: string[];
    segments: PlannedSegment[];
    legacySegments: boolean;
    featurePlacement: FeaturePlacement | null;
}

export interface LeaveEntry {
    id: string;
    memberId: string | null;
    start: string;
    end: string;
    hours: number | null;
    title: string;
    source: LeaveSourceType;
    sourceId?: string;
    memberIds?: string[];
}

export type LeaveSourceType = 'manual' | 'outlook' | 'google' | 'ics' | 'confluence';

export type LeaveShowAs = 'oof' | 'busy' | 'tentative' | 'free' | 'any';

export interface LeaveRules {
    keywords: string[];
    showAs: LeaveShowAs[];
    allDayOnly: boolean;
}

export interface LeaveSourceConfig {
    id: string;
    type: Exclude<LeaveSourceType, 'manual'>;
    kind: 'leave' | 'holiday';
    name: string;
    calendarId: string;
    url?: string;
    rules: LeaveRules;
    memberIds?: string[];
    importedAt?: string;
    importedCount?: number;
}

export interface StoredCalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    showAs: LeaveShowAs | null;
    categories: string[];
    people: { email?: string; name?: string; id?: string }[];
}

export interface TeamMember extends PlannerUser {
    allocation: number;
    hoursPerDay: number | null;
    workingDays: number[] | null;
}

export interface TeamDefaults {
    hoursPerDay: number;
    workingDays: number[];
}

export interface VelocityChoice {
    mode: VelocityMode;
    sprintCount: number;
    custom: number | null;
}

export interface TeamDefinition {
    version: number;
    updated: string;
    updatedBy: string;
    memberSource: MemberSource;
    groupName: string | null;
    atlassianTeamId: string | null;
    members: TeamMember[];
    excludedMemberIds: string[];
    defaults: TeamDefaults;
    focusFactor: number;
    planningUnit: PlanningUnit;
    hoursPerPoint: number;
    velocity: VelocityChoice;
    leaveSources: LeaveSourceConfig[];
    userMapping: Record<string, string>;
    sprintOverrides: Record<string, number>;
    segmentLabels: string[];
}

export interface SprintVelocity {
    sprintId: number;
    name: string;
    startDate: Date | null;
    completeDate: Date | null;
    committed: number;
    completed: number;
    committedIsEstimated: boolean;
}

export interface VelocitySummary {
    sprints: SprintVelocity[];
    averageCompleted: number;
    averageCommitted: number;
    median: number;
    last: number;
    selected: number;
}

export interface JiraPermissions {
    manageSprints: boolean;
    editIssues: boolean;
    scheduleIssues: boolean;
    createIssues: boolean;
    linkIssues: boolean;
    assignIssues: boolean;
}

export interface IssueLinkType {
    id: string;
    name: string;
    inward: string;
    outward: string;
}

export interface PlannerFieldIds {
    sprint: string | null;
    epicLink: string | null;
    epicColor: string | null;
    storyPoints: string | null;
    startDate: string | null;
    dueDate: string;
    team: string | null;
    flagged: string | null;
    parentLink: string | null;
}

export interface UnmappedLeave {
    sourceName: string;
    person: string;
    start: string;
    end: string;
    title: string;
}
