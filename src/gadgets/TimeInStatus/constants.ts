import type { BuiltInGroupBy, StatusCategory, TimeInStatusScopeMode, TimeInStatusView, TimelineScale } from './types';

export const timeInStatusPageSettingsKey = 'reports_TimeInStatus';

export const defaultDcIssueLimit = 200;

export const maxDcIssueLimit = 5000;

export const historyFetchConcurrency = 6;

export const issueKeyChunkSize = 100;

export const userJqlChunkSize = 50;

export const fieldGroupPrefix = 'field:';

export const noGroupValue = '(None)';

export const ungroupedUsersName = 'Other assignees';

export const baseIssueFields = [
    'summary',
    'project',
    'status',
    'parent',
    'assignee',
    'issuetype',
    'reporter',
    'created',
    'updated',
    'resolutiondate',
    'timeestimate',
    'aggregatetimeestimate',
    'timeoriginalestimate',
    'aggregatetimeoriginalestimate',
];

export const scopeModeOptions: { value: TimeInStatusScopeMode; label: string }[] = [
    { value: 'jql', label: 'Custom JQL' },
    { value: 'groups', label: 'User groups' },
];

export const viewOptions: { value: TimeInStatusView; label: string }[] = [
    { value: 'bottleneck', label: 'Bottlenecks' },
    { value: 'issues', label: 'Issues' },
];

export const timelineScaleOptions: { value: TimelineScale; label: string }[] = [
    { value: 'relative', label: 'Proportional' },
    { value: 'calendar', label: 'Calendar' },
];

export const builtInGroupByOptions: { value: BuiltInGroupBy; label: string }[] = [
    { value: 'none', label: 'No grouping' },
    { value: 'project', label: 'Project' },
    { value: 'issuetype', label: 'Issue type' },
    { value: 'assignee', label: 'Assignee' },
    { value: 'userGroup', label: 'User group' },
];

export const statusCategoryOrder: Record<StatusCategory, number> = { new: 0, indeterminate: 1, done: 2 };

export const statusCategoryLabels: Record<StatusCategory, string> = { new: 'To Do', indeterminate: 'In Progress', done: 'Done' };

export const statusCategoryColorVars: Record<StatusCategory, string[]> = {
    new: ['--tis-todo-1', '--tis-todo-2', '--tis-todo-3'],
    indeterminate: ['--tis-wip-1', '--tis-wip-2', '--tis-wip-3', '--tis-wip-4', '--tis-wip-5', '--tis-wip-6', '--tis-wip-7'],
    done: ['--tis-done-1', '--tis-done-2'],
};

export const overflowStatusColorVar = '--tis-overflow';

export interface IssueColumnInfo {
    id: string;
    label: string;
}

export const optionalIssueColumns: IssueColumnInfo[] = [
    { id: 'project', label: 'Project' },
    { id: 'issuetype', label: 'Issue type' },
    { id: 'status', label: 'Status' },
    { id: 'assignee', label: 'Assignee' },
    { id: 'reporter', label: 'Reporter' },
    { id: 'created', label: 'Created' },
    { id: 'parent', label: 'Parent' },
    { id: 'epic', label: 'Epic' },
    { id: 'storyPoints', label: 'Story points' },
    { id: 'originalEstimate', label: 'Original estimate' },
    { id: 'aggregateOriginalEstimate', label: 'Σ Original estimate' },
    { id: 'timeEstimate', label: 'Remaining estimate' },
    { id: 'aggregateTimeEstimate', label: 'Σ Remaining estimate' },
    { id: 'leadTime', label: 'Lead time' },
    { id: 'cycleTime', label: 'Cycle time' },
    { id: 'currentStatusAge', label: 'Time in current status' },
    { id: 'timeline', label: 'Status timeline' },
    { id: 'statusColumns', label: 'Time per status' },
];

export const defaultDisplayColumns = ['status', 'assignee', 'leadTime', 'cycleTime', 'currentStatusAge', 'timeline', 'statusColumns'];

export const jqlRequiredMessage = 'Provide the JQL to select the issues to be included in the report.';

export const dateRangeHint = 'Issues that were open at any time within this period are included';

export const loadErrorMessage = 'Unable to fetch the issues and their history from Jira. Verify the configured JQL and try again.';

export const partialHistoryMessage =
    'The complete status history could not be fetched for the following issues. Their numbers may be based on partial history:';

export const fallbackHistoryMessage =
    'The bulk changelog API of Jira Cloud is not available for this site. History of issues with many changes was fetched one issue at a time.';

export const dcGuardMessage =
    'Jira Data Center does not offer a bulk changelog API, so the history of every issue has to be fetched separately. Narrow the JQL to keep the report fast, or run it anyway.';

export const howItWorks = [
    'Time spent in each status is calculated from the status changes recorded in the history of every issue, starting from its created date.',
    'Lead time is measured from the created date until the issue is resolved. Cycle time is measured from the first move into an "In Progress" category status until the issue is resolved.',
    'Statuses are classified using their Jira status category (To Do, In Progress, Done), so the report works across different workflows.',
    'Issues that were open at any time within the selected period are included. Choose the period from the header.',
    'Status history is cached on this device and is fetched again only for issues updated since the last run.',
];
