import type { LeaveRules, TeamDefinition } from './types';

export const teamPropertyKey = 'jaPlannerTeam';
export const segmentsPropertyKey = 'ja_planner_tasks';
export const featurePropertyKey = 'jaPlannerFeature';
export const sprintStartPropertyKey = 'jaSprintStartInfo';

export const teamDefinitionVersion = 1;
export const segmentsFormatVersion = 2;

export const sprintFieldType = 'com.pyxis.greenhopper.jira:gh-sprint';
export const epicLinkFieldType = 'com.pyxis.greenhopper.jira:gh-epic-link';
export const epicColorFieldType = 'com.pyxis.greenhopper.jira:gh-epic-color';
export const issueColorFieldType = 'com.pyxis.greenhopper.jira:jsw-issue-color';
export const teamFieldType = 'com.atlassian.jira.plugin.system.customfieldtypes:atlassian-team';
export const parentLinkFieldType = 'com.atlassian.jpo:jpo-custom-field-parent';
export const flaggedFieldName = 'flagged';
export const storyPointsFieldNames = ['story points', 'story point estimate'];
export const defaultStartDateFieldName = 'start date';

export const cacheTtl = {
    metadata: 24 * 60,
    sprints: 5,
    team: 5,
    permissions: 24 * 60,
    boards: 24 * 60,
    velocity: 30 * 24 * 60,
    leave: 5,
    leaveSyncThrottle: 30,
    leaveSyncDenied: 24 * 60,
    leaveCleanupThrottle: 7 * 24 * 60,
} as const;

export const leavePropertyPrefix = 'jaPlannerLeave-';
export const icsImportPastDays = 90;
export const icsImportFutureDays = 365;
export const leaveListPastDays = 30;
export const leaveListFutureDays = 365;

export const searchPageSize = 100;
export const maxSprintIssuePages = 3;
export const backlogPageSize = 100;
export const roadmapMaxPages = 3;
export const shownClosedSprintCount = 3;
export const bulkMoveLimit = 50;

export const defaultHoursPerDay = 8;
export const defaultHoursPerPoint = 4;
export const defaultFocusFactor = 80;
export const defaultVelocitySprintCount = 6;
export const maxVelocitySprintCount = 12;
export const nearCapacityPercent = 90;

export const defaultSegmentLabels = ['Dev', 'QA', 'Review'];

export const defaultLeaveRules: LeaveRules = {
    keywords: ['leave', 'vacation', 'holiday', 'pto', 'ooo', 'out of office', 'off'],
    showAs: ['oof'],
    allDayOnly: false,
};

export const defaultTeamDefinition: Omit<TeamDefinition, 'updated' | 'updatedBy'> = {
    version: teamDefinitionVersion,
    memberSource: 'board',
    groupName: null,
    atlassianTeamId: null,
    members: [],
    excludedMemberIds: [],
    defaults: { hoursPerDay: defaultHoursPerDay, workingDays: [1, 2, 3, 4, 5] },
    focusFactor: defaultFocusFactor,
    planningUnit: 'points',
    hoursPerPoint: defaultHoursPerPoint,
    velocity: { mode: 'avgCompleted', sprintCount: defaultVelocitySprintCount, custom: null },
    leaveSources: [],
    userMapping: {},
    sprintOverrides: {},
    segmentLabels: defaultSegmentLabels,
};

export const epicPalette = ['#6554C0', '#00875A', '#FF8B00', '#0065FF', '#DE350B', '#00A3BF', '#5243AA', '#36B37E', '#FF5630', '#4C9AFF'];

export const jiraEpicColorMap: Record<string, string> = {
    'ghx-label-0': '#8993a4',
    'ghx-label-1': '#815b3a',
    'ghx-label-2': '#f79232',
    'ghx-label-3': '#d39c3f',
    'ghx-label-4': '#3b7fc4',
    'ghx-label-5': '#4a6785',
    'ghx-label-6': '#8eb021',
    'ghx-label-7': '#ac707a',
    'ghx-label-8': '#654982',
    'ghx-label-9': '#f15c75',
    'ghx-label-10': '#2684ff',
    'ghx-label-11': '#00c7e6',
    'ghx-label-12': '#57d9a3',
    'ghx-label-13': '#998dd9',
    'ghx-label-14': '#ff7452',
    purple: '#6554C0',
    blue: '#0065FF',
    green: '#00875A',
    teal: '#00A3BF',
    yellow: '#FF991F',
    orange: '#FF8B00',
    grey: '#6B778C',
    dark_purple: '#403294',
    dark_blue: '#0747A6',
    dark_green: '#006644',
    dark_teal: '#008DA6',
    dark_yellow: '#FF8B00',
    dark_orange: '#DE350B',
    dark_grey: '#42526E',
};
