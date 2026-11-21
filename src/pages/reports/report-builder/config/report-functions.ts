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
        description: 'IssueUrl(key) — link to the Jira issue',
        params: [{ name: 'key', type: 'string' }],
        returnType: 'string',
        fn: (key) => {
            const { $userutils } = inject('UserUtilsService');
            return key ? ($userutils.getTicketUrl(String(key)) ?? '') : '';
        },
    },
    {
        name: 'ProfileUrl',
        description: 'ProfileUrl(user) — link to the Jira profile of a user',
        params: [{ name: 'user', type: 'any' }],
        returnType: 'string',
        fn: (user) => {
            const { $userutils } = inject('UserUtilsService');
            return user ? $userutils.getProfileUrl(user as Parameters<typeof $userutils.getProfileUrl>[0]) : '';
        },
    },
    {
        name: 'FormatUserDate',
        description: 'FormatUserDate(date) — date in your preferred date format',
        params: [{ name: 'date', type: 'any' }],
        returnType: 'string',
        fn: (value) => {
            const { $userutils } = inject('UserUtilsService');
            const date = toDate(value);
            return date ? $userutils.formatDate(date) : '';
        },
    },
    {
        name: 'FormatUserDateTime',
        description: 'FormatUserDateTime(date) — date and time in your preferred format',
        params: [{ name: 'date', type: 'any' }],
        returnType: 'string',
        fn: (value) => {
            const { $userutils } = inject('UserUtilsService');
            const date = toDate(value);
            return date ? $userutils.formatDateTime(date) : '';
        },
    },
    {
        name: 'FormatUserTime',
        description: 'FormatUserTime(date) — time in your preferred time format',
        params: [{ name: 'date', type: 'any' }],
        returnType: 'string',
        fn: (value) => {
            const { $userutils } = inject('UserUtilsService');
            const date = toDate(value);
            return date ? $userutils.formatTime(date) : '';
        },
    },
    {
        name: 'Hours',
        description: 'Hours(seconds, decimals=2) — converts seconds (time spent, estimates) to hours',
        params: [
            { name: 'seconds', type: 'number' },
            { name: 'decimals', type: 'number' },
        ],
        returnType: 'number',
        fn: (seconds, decimals) => {
            const d = typeof decimals === 'number' ? Math.max(0, Math.min(6, decimals)) : 2;
            return Number((toNumber(seconds) / 3600).toFixed(d));
        },
    },
    {
        name: 'FormatDuration',
        description: 'FormatDuration(seconds) — seconds as hours and minutes, e.g. 7:30',
        params: [{ name: 'seconds', type: 'number' }],
        returnType: 'string',
        fn: (seconds) => formatTimeFromSeconds(toNumber(seconds)),
    },
    {
        name: 'IsHoliday',
        description: 'IsHoliday(date) — true when the date is not one of your working days',
        params: [{ name: 'date', type: 'any' }],
        returnType: 'boolean',
        fn: (value) => {
            const { $userutils } = inject('UserUtilsService');
            const date = toDate(value);
            return date ? $userutils.isHoliday(date) : false;
        },
    },
    {
        name: 'WorkingDays',
        description: 'WorkingDays(from, to) — number of your working days between two dates (inclusive)',
        params: [
            { name: 'from', type: 'any' },
            { name: 'to', type: 'any' },
        ],
        returnType: 'number',
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
        description: 'GroupUsers(groupNames) — members of your user groups, e.g. the value of a User groups parameter',
        params: [{ name: 'groupNames', type: 'any' }],
        returnType: 'any',
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
        description: 'UserIds(users) — account ids (or user names on Jira Server) of users or user groups',
        params: [{ name: 'users', type: 'any' }],
        returnType: 'any',
        fn: (users) => Array.from(new Set(getUserIdentifiers(users))),
    },
    {
        name: 'SprintIds',
        description: 'SprintIds(sprints) — ids of the sprints chosen in a Sprints parameter',
        params: [{ name: 'sprints', type: 'any' }],
        returnType: 'any',
        isAsync: true,
        fn: async (value) => (await resolveSprintsFromValue(value)).map((s) => (typeof s === 'number' ? s : s.id)),
    },
    {
        name: 'JqlList',
        description: 'JqlList(values) — values quoted and comma separated for use in JQL, e.g. "A", "B"',
        params: [{ name: 'values', type: 'any' }],
        returnType: 'string',
        fn: (values) => formatJqlValue(values),
    },
];
