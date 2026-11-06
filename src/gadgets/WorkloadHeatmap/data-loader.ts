import { parseISO, startOfDay } from 'date-fns';

import type { UserGroup } from '@/types';

import { inject } from '@services';
import type { JiraUser } from '@services/jira-service';

import { assigneeChunkSize, baseIssueFields, defaultIssueFilterJql, defaultStartDateFieldName, ungroupedAssigneesName } from './constants';
import type { HeatmapDataset, HeatmapFilterOptions, HeatmapGroup, HeatmapIssue, HeatmapUser, WorkloadHeatmapSettings } from './types';

interface JiraIssueFields {
    summary?: string;
    assignee?: JiraUser | null;
    project?: { key: string; name: string };
    issuetype?: { name: string; iconUrl?: string; subtask?: boolean };
    status?: { name: string };
    timeoriginalestimate?: number | null;
    timeestimate?: number | null;
    duedate?: string | null;
    [field: string]: unknown;
}

interface JiraIssue {
    key: string;
    fields: JiraIssueFields;
}

interface JiraFieldInfo {
    id: string;
    name: string;
    custom?: boolean;
    schema?: { type?: string };
}

interface JiraProjectInfo {
    key: string;
    name: string;
}

interface JiraIssueTypeInfo {
    name: string;
}

export interface DateFieldOption {
    id: string;
    name: string;
}

const orderByPattern = /\border\s+by\b[\s\S]*$/i;

function getUserId(user: JiraUser & { key?: string }): string {
    return user.accountId || user.name || user.key || '';
}

function toHeatmapUser(user: JiraUser): HeatmapUser {
    return {
        id: getUserId(user),
        displayName: user.displayName || getUserId(user),
        avatarUrl: user.avatarUrls?.['24x24'] || user.avatarUrls?.['32x32'],
    };
}

function escapeJqlValue(value: string): string {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function stripOrderBy(jql: string): string {
    return jql.replace(orderByPattern, '').trim();
}

function parseDateValue(value: unknown): Date | null {
    if (typeof value !== 'string' || !value) {
        return null;
    }
    const date = parseISO(value);
    return Number.isNaN(date.getTime()) ? null : startOfDay(date);
}

function parseSeconds(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function mapIssue(issue: JiraIssue, startDateField: string): HeatmapIssue | null {
    const { fields } = issue;
    if (!fields.assignee) {
        return null;
    }

    const { $userutils } = inject('UserUtilsService');

    return {
        key: issue.key,
        summary: fields.summary || '',
        url: $userutils.getTicketUrl(issue.key),
        assignee: toHeatmapUser(fields.assignee),
        projectKey: fields.project?.key || '',
        projectName: fields.project?.name || '',
        issueType: fields.issuetype?.name || '',
        issueTypeIconUrl: fields.issuetype?.iconUrl,
        isSubtask: !!fields.issuetype?.subtask,
        status: fields.status?.name || '',
        originalEstimate: parseSeconds(fields.timeoriginalestimate),
        remainingEstimate: parseSeconds(fields.timeestimate),
        startDate: startDateField ? parseDateValue(fields[startDateField]) : null,
        dueDate: parseDateValue(fields.duedate),
    };
}

function chunk<T>(items: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        result.push(items.slice(i, i + size));
    }
    return result;
}

function toHeatmapGroups(groups: UserGroup[]): HeatmapGroup[] {
    return groups.map((group) => {
        const uniqueUsers = new Map<string, HeatmapUser>();
        for (const user of group.users || []) {
            const heatmapUser = toHeatmapUser(user);
            if (heatmapUser.id && !uniqueUsers.has(heatmapUser.id)) {
                uniqueUsers.set(heatmapUser.id, heatmapUser);
            }
        }
        return { name: group.name, users: [...uniqueUsers.values()] };
    });
}

function groupAssignees(issues: HeatmapIssue[], groups: HeatmapGroup[]): HeatmapGroup[] {
    const assignees = new Map<string, HeatmapUser>();
    for (const issue of issues) {
        assignees.set(issue.assignee.id, issue.assignee);
    }

    const groupedIds = new Set<string>();
    const result: HeatmapGroup[] = [];

    for (const group of groups) {
        const users = group.users.filter((u) => assignees.has(u.id));
        if (users.length) {
            users.forEach((u) => groupedIds.add(u.id));
            result.push({ name: group.name, users });
        }
    }

    const ungrouped = [...assignees.values()]
        .filter((u) => !groupedIds.has(u.id))
        .sort((a, b) => a.displayName.localeCompare(b.displayName));

    if (ungrouped.length) {
        result.push({ name: ungroupedAssigneesName, users: ungrouped });
    }

    return result;
}

export async function getDateFields(): Promise<DateFieldOption[]> {
    const { $jira } = inject('JiraService');
    const fields = (await $jira.getCustomFields()) as JiraFieldInfo[];

    return fields
        .filter((f) => f.custom && (f.schema?.type === 'date' || f.schema?.type === 'datetime'))
        .map(({ id, name }) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

async function resolveStartDateField(configuredField: string): Promise<string> {
    if (configuredField) {
        return configuredField;
    }
    const dateFields = await getDateFields();
    return dateFields.find((f) => f.name.toLowerCase() === defaultStartDateFieldName)?.id || '';
}

async function resolveUserGroups(reportGroups: UserGroup[] | null): Promise<UserGroup[]> {
    const { $usergroup } = inject('UserGroupService');
    if (!reportGroups) {
        return ((await $usergroup.getUserGroups()) as UserGroup[]) || [];
    }

    const groups = reportGroups.map((g) => ({ ...g, users: [...(g.users || [])] }));
    await $usergroup.fillJiraGroupMembers(groups.filter((g) => g.isJiraGroup));
    return groups;
}

async function searchIssues(jql: string, fields: string[], startDateField: string): Promise<HeatmapIssue[]> {
    const { $jira } = inject('JiraService');
    const issues = (await $jira.searchTickets(jql, fields)) as JiraIssue[];
    return issues.map((issue) => mapIssue(issue, startDateField)).filter((issue): issue is HeatmapIssue => !!issue);
}

function getUserJqlValue(user: JiraUser): string {
    const { $session } = inject('SessionService');
    return ($session.CurrentUser?.isAtlasCloud ? user.accountId : user.name) || getUserId(user);
}

export async function loadHeatmapDataset(settings: WorkloadHeatmapSettings): Promise<HeatmapDataset> {
    const [allGroups, startDateField] = await Promise.all([
        resolveUserGroups(settings.userGroups),
        resolveStartDateField(settings.startDateField),
    ]);
    const fields = startDateField ? [...baseIssueFields, startDateField] : baseIssueFields;
    const additionalJql = stripOrderBy(settings.jql);

    if (settings.scopeMode === 'jql') {
        if (!additionalJql) {
            return { groups: [], issues: [] };
        }
        const issues = await searchIssues(`(${additionalJql}) AND assignee is not EMPTY`, fields, startDateField);
        return { groups: groupAssignees(issues, toHeatmapGroups(allGroups)), issues };
    }

    const groups = toHeatmapGroups(allGroups).filter((g) => g.users.length);

    const jqlValues = new Map<string, string>();
    for (const group of allGroups) {
        for (const user of group.users || []) {
            const value = getUserJqlValue(user);
            if (value) {
                jqlValues.set(getUserId(user), value);
            }
        }
    }

    if (!jqlValues.size) {
        return { groups, issues: [] };
    }

    const filterJql = additionalJql ? `${defaultIssueFilterJql} AND (${additionalJql})` : defaultIssueFilterJql;
    const results = await Promise.all(
        chunk([...jqlValues.values()], assigneeChunkSize).map((values) =>
            searchIssues(`assignee in (${values.map(escapeJqlValue).join(', ')}) AND ${filterJql}`, fields, startDateField),
        ),
    );

    return { groups, issues: results.flat() };
}

export async function getFilterOptionLists(): Promise<HeatmapFilterOptions> {
    const { $jira } = inject('JiraService');
    const [projects, issueTypes] = (await Promise.all([$jira.getProjects(), $jira.getIssueTypes()])) as [
        JiraProjectInfo[],
        JiraIssueTypeInfo[],
    ];

    return {
        projects: projects
            .map(({ key, name }) => ({ value: key, label: `${name} (${key})` }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        issueTypes: [...new Set(issueTypes.map((t) => t.name))]
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ value: name, label: name })),
    };
}
