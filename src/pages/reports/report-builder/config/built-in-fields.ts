import { inject } from '@services';

import type { BuiltInFieldDefinition } from '@components/report-builder';

import { DefaultWorkingDays } from '@constants';

function currentUser() {
    const { $session } = inject('SessionService');
    return $session.CurrentUser;
}

const userGroup = 'Current user';
const settingsGroup = 'Preferences';

export const builtInFields: BuiltInFieldDefinition[] = [
    {
        name: 'CurrentUserName',
        label: 'Name',
        group: userGroup,
        description: 'Display name of the signed-in user',
        value: () => currentUser().displayName ?? '',
    },
    {
        name: 'CurrentUserAccountId',
        label: 'Account id',
        group: userGroup,
        description: 'Jira account id (or user name on Jira Server)',
        value: () => currentUser().accountId || currentUser().name || '',
    },
    {
        name: 'CurrentUserEmail',
        label: 'Email',
        group: userGroup,
        description: 'Email address of the signed-in user',
        value: () => currentUser().emailAddress ?? '',
    },
    {
        name: 'CurrentUser',
        label: 'User',
        group: userGroup,
        description: 'Jira user object of the signed-in user',
        value: () => currentUser().jiraUser ?? null,
    },
    {
        name: 'JiraUrl',
        label: 'Jira URL',
        group: settingsGroup,
        description: 'Root URL of the connected Jira',
        value: () => currentUser().jiraUrl ?? '',
    },
    {
        name: 'DateFormat',
        label: 'Date format',
        group: settingsGroup,
        description: 'Your preferred date format',
        value: () => currentUser().dateFormat ?? '',
    },
    {
        name: 'TimeFormat',
        label: 'Time format',
        group: settingsGroup,
        description: 'Your preferred time format',
        value: () => currentUser().timeFormat ?? '',
    },
    {
        name: 'WorkingDays',
        label: 'Working days',
        group: settingsGroup,
        description: 'Your working week days (0 = Sunday)',
        value: () => currentUser().workingDays ?? DefaultWorkingDays,
    },
    {
        name: 'MaxHoursPerDay',
        label: 'Max hours per day',
        group: settingsGroup,
        description: 'Maximum hours you log per day',
        value: () => currentUser().maxHours ?? null,
    },
];
