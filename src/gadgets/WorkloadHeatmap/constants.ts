import type { HeatmapRangeMode, HeatmapScopeMode, LoadLevel } from './types';

export const heatmapPageSettingsKey = 'reports_WorkloadHeatmap';

export const defaultIssueFilterJql = 'resolution = Unresolved AND statusCategory != Done';

export const defaultStartDateFieldName = 'start date';

export const assigneeChunkSize = 50;

export const underLoadPercent = 80;

export const criticalLoadPercent = 150;

export const baseIssueFields = ['summary', 'assignee', 'project', 'issuetype', 'status', 'timeoriginalestimate', 'timeestimate', 'duedate'];

export const rangeModeOptions: { value: HeatmapRangeMode; label: string }[] = [
    { value: 'week', label: 'Week' },
    { value: 'twoWeeks', label: '2 Weeks' },
    { value: 'sprint', label: 'Sprint' },
];

export const scopeModeOptions: { value: HeatmapScopeMode; label: string }[] = [
    { value: 'groups', label: 'User groups' },
    { value: 'jql', label: 'Custom JQL' },
];

export const loadLevelClassNames: Record<LoadLevel, string> = {
    none: 'heat-none',
    under: 'log-less',
    good: 'log-good',
    over: 'log-high',
    critical: 'log-critical',
};

export const loadLevelLegend: { level: LoadLevel; label: string }[] = [
    { level: 'none', label: 'No load' },
    { level: 'under', label: `Under ${underLoadPercent}%` },
    { level: 'good', label: `${underLoadPercent}% – 100%` },
    { level: 'over', label: 'Over capacity' },
    { level: 'critical', label: `Above ${criticalLoadPercent}%` },
];

export const ungroupedAssigneesName = 'Other assignees';

export const unestimatedHint =
    'Issues without any estimate are excluded from the hour totals. Add an original or remaining estimate to include them in the load.';

export const unscheduledHint =
    'Issues with an estimate but without a due date or start date cannot be placed on the calendar and are excluded from the hour totals.';

export const jqlRequiredMessage = 'Provide the JQL to select the issues to be included in the heatmap.';

export const boardRequiredMessage = 'Select the board whose active sprint should be used as the date range.';

export const noActiveSprintMessage = 'The selected board has no active sprint. Showing the current week instead.';
