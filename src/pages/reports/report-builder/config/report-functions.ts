import { inject } from '@services';

import type { CustomFunction } from '@components/report-builder';

import { formatTimeFromSeconds } from '@utils/date-utils';
import { convertToDate } from '@utils/helpers';

import { resolveSprintsFromValue } from '../datasources/sprint-resolution';

import { formatJqlValue, getUserIdentifiers } from './jql-format';

interface GroupRecord {
    name: string;
    users?: unknown[];
}

function toDate(value: unknown): Date | undefined {
    return convertToDate(value);
}

function toNumber(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function toNames(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String);
    return value === null || value === undefined || value === '' ? [] : [String(value)];
}

export const reportFunctions: CustomFunction[] = [
    {
        name: 'IssueUrl',
        category: 'Jira',
        description: 'Address of the issue in Jira. Gives an empty text when there is no key.',
        params: [{ name: 'key', type: 'string', description: 'The issue key, such as JSP-12.' }],
        returnType: 'string',
        examples: [{ expression: 'IssueUrl(Field.key)' }],
        fn: (key) => {
            const { $userutils } = inject('UserUtilsService');
            return key ? ($userutils.getTicketUrl(String(key)) ?? '') : '';
        },
    },
    {
        name: 'ProfileUrl',
        category: 'Jira',
        description: 'Address of the Jira profile page of a user.',
        params: [{ name: 'user', type: 'any', description: 'A user, such as Field.assignee.' }],
        returnType: 'string',
        examples: [{ expression: 'ProfileUrl(Field.assignee)' }],
        fn: (user) => {
            const { $userutils } = inject('UserUtilsService');
            return user ? $userutils.getProfileUrl(user as Parameters<typeof $userutils.getProfileUrl>[0]) : '';
        },
    },
    {
        name: 'FormatUserDate',
        category: 'Your preferences',
        description: 'The date in the date format chosen in your settings. Gives an empty text when there is no date.',
        params: [{ name: 'date', type: 'date', description: 'The date to show.' }],
        returnType: 'string',
        examples: [{ expression: 'FormatUserDate(Field.created)' }, { expression: 'FormatUserDate(Today())' }],
        fn: (value) => {
            const { $userutils } = inject('UserUtilsService');
            const date = toDate(value);
            return date ? $userutils.formatDate(date) : '';
        },
    },
    {
        name: 'FormatUserDateTime',
        category: 'Your preferences',
        description: 'The date and time in the formats chosen in your settings.',
        params: [{ name: 'date', type: 'date', description: 'The date and time to show.' }],
        returnType: 'string',
        examples: [{ expression: 'FormatUserDateTime(Field.updated)' }],
        fn: (value) => {
            const { $userutils } = inject('UserUtilsService');
            const date = toDate(value);
            return date ? $userutils.formatDateTime(date) : '';
        },
    },
    {
        name: 'FormatUserTime',
        category: 'Your preferences',
        description: 'The time of day in the time format chosen in your settings.',
        params: [{ name: 'date', type: 'date', description: 'The date and time to take the time from.' }],
        returnType: 'string',
        examples: [{ expression: 'FormatUserTime(Field.started)' }],
        fn: (value) => {
            const { $userutils } = inject('UserUtilsService');
            const date = toDate(value);
            return date ? $userutils.formatTime(date) : '';
        },
    },
    {
        name: 'Hours',
        category: 'Time tracking',
        description: 'Seconds, such as time spent or an estimate, as hours.',
        params: [
            { name: 'seconds', type: 'number', description: 'The time in seconds.' },
            { name: 'decimals', type: 'number', optional: true, defaultValue: '2', description: 'Number of digits after the decimal point, from 0 to 6.' },
        ],
        returnType: 'number',
        examples: [{ expression: 'Hours(5400)', result: '1.5' }, { expression: 'Hours(Field.timeSpentSeconds, 1)' }],
        fn: (seconds, decimals) => {
            const d = typeof decimals === 'number' ? Math.max(0, Math.min(6, decimals)) : 2;
            return Number((toNumber(seconds) / 3600).toFixed(d));
        },
    },
    {
        name: 'FormatDuration',
        category: 'Time tracking',
        description: 'Seconds as hours and minutes.',
        params: [{ name: 'seconds', type: 'number', description: 'The time in seconds.' }],
        returnType: 'string',
        examples: [{ expression: 'FormatDuration(27000)', result: '7:30' }],
        fn: (seconds) => formatTimeFromSeconds(toNumber(seconds)),
    },
    {
        name: 'IsHoliday',
        category: 'Your preferences',
        description: 'True when the date is not one of the working days chosen in your settings.',
        params: [{ name: 'date', type: 'date', description: 'The date to check.' }],
        returnType: 'boolean',
        examples: [{ expression: 'IsHoliday(Field.date)' }],
        fn: (value) => {
            const { $userutils } = inject('UserUtilsService');
            const date = toDate(value);
            return date ? $userutils.isHoliday(date) : false;
        },
    },
    {
        name: 'WorkingDays',
        category: 'Your preferences',
        description: 'Number of your working days from one date to another, both included. Gives 0 when from is after to.',
        params: [
            { name: 'from', type: 'date', description: 'The first date.' },
            { name: 'to', type: 'date', description: 'The last date.' },
        ],
        returnType: 'number',
        examples: [{ expression: 'WorkingDays(Today(), Field.duedate)' }],
        fn: (from, to) => {
            const start = toDate(from);
            const end = toDate(to);
            if (!start || !end || start > end) return 0;
            const { $userutils } = inject('UserUtilsService');
            return $userutils.getDays(start, end).filter((d) => !d.isHoliday).length;
        },
    },
    {
        name: 'GroupUsers',
        category: 'Jira',
        description: 'The members of the user groups you created in Jira Assistant.',
        params: [{ name: 'groupNames', type: 'any', description: 'A group name or a list of them, such as the value of a User groups parameter.' }],
        returnType: 'any',
        returns: { type: 'array', description: 'The users of every group named.' },
        examples: [{ expression: 'UserIds(GroupUsers(Parameters.teams))' }],
        isAsync: true,
        fn: async (names) => {
            const wanted = new Set(toNames(names));
            if (wanted.size === 0) return [];
            const { $usergroup } = inject('UserGroupService');
            const groups = (await $usergroup.getUserGroups()) as GroupRecord[];
            return groups.filter((g) => wanted.has(g.name)).flatMap((g) => g.users ?? []);
        },
    },
    {
        name: 'UserIds',
        category: 'Jira',
        description: 'Account ids of users, or user names on Jira Server and Data Center. The members of a user group are included.',
        params: [{ name: 'users', type: 'any', description: 'A user, a user group or a list of them, such as the value of a Users parameter.' }],
        returnType: 'any',
        returns: { type: 'array', description: 'Each id once.' },
        examples: [{ expression: 'JqlList(UserIds(Parameters.users))' }],
        fn: (users) => Array.from(new Set(getUserIdentifiers(users))),
    },
    {
        name: 'SprintIds',
        category: 'Jira',
        description: 'Ids of the sprints chosen in a Sprints parameter.',
        params: [{ name: 'sprints', type: 'any', description: 'The value of a Sprints parameter.' }],
        returnType: 'any',
        returns: { type: 'array', description: 'The sprint ids.' },
        examples: [{ expression: 'Join(SprintIds(Parameters.sprints), ",")' }],
        isAsync: true,
        fn: async (value) => (await resolveSprintsFromValue(value)).map((s) => (typeof s === 'number' ? s : s.id)),
    },
    {
        name: 'JqlList',
        category: 'Jira',
        description: 'Values quoted and separated by commas, ready to put in a JQL query.',
        params: [{ name: 'values', type: 'any', description: 'A value or a list of values.' }],
        returnType: 'string',
        examples: [{ expression: 'Concat("project in (", JqlList(Parameters.projects), ")")' }],
        fn: (values) => formatJqlValue(values),
    },
];
