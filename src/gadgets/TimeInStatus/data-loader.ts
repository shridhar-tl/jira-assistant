import { getFieldsList } from '@/pages/reports/pivot-report/utils/fields';
import type { UserGroup } from '@/types';
import { chunk } from '@/utils';

import { inject } from '@services';
import type { JiraUser } from '@services/jira-service';

import { resolveSelectedSprints } from '@components/shared/sprint-selector';

import {
    escapeJqlValue,
    getGroupUsersJqlValues,
    getJiraUserId,
    getUserAvatarUrl,
    resolveUserGroups,
    stripOrderBy,
} from '../shared/jira-query-utils';

import { baseIssueFields, builtInGroupByOptions, fieldGroupPrefix, userJqlChunkSize } from './constants';
import { getDateRangeJql } from './date-range';
import { getGroupFieldId } from './settings';
import type {
    GroupByOptionGroup,
    GroupMembership,
    IssueUser,
    StatusCategory,
    StatusInfo,
    TimeInStatusSettings,
    TisIssue,
} from './types';

interface JiraStatusRef {
    id: string;
    name: string;
    iconUrl?: string;
    statusCategory?: { key?: string };
}

interface JiraIssueFields {
    summary?: string;
    project?: { key: string; name: string };
    status?: JiraStatusRef;
    parent?: { key: string };
    assignee?: JiraUser | null;
    reporter?: JiraUser | null;
    issuetype?: { name: string; iconUrl?: string };
    created?: string;
    updated?: string;
    resolutiondate?: string | null;
    timeestimate?: number | null;
    aggregatetimeestimate?: number | null;
    timeoriginalestimate?: number | null;
    aggregatetimeoriginalestimate?: number | null;
    [field: string]: unknown;
}

interface JiraIssue {
    id: string;
    key: string;
    fields: JiraIssueFields;
}

interface FieldSettings {
    epicField?: string;
    storyPointField?: string;
    groupField: string | null;
}

export interface IssueSearchResult {
    issues: TisIssue[];
    userGroups: GroupMembership[];
}

const excludedGroupFieldKeys = new Set(['summary', 'description', 'environment', 'issuekey', 'thumbnail', 'lastViewed']);
const excludedGroupFieldTypes = new Set([
    'date',
    'datetime',
    'timetracking',
    'progress',
    'comments-page',
    'attachment',
    'worklog',
    'votes',
    'watches',
]);

function toIssueUser(user: JiraUser | null | undefined): IssueUser | null {
    if (!user) {
        return null;
    }
    const id = getJiraUserId(user);
    return { id, displayName: user.displayName || id, avatarUrl: getUserAvatarUrl(user) };
}

function toStatusCategory(key: string | undefined): StatusCategory {
    return key === 'done' || key === 'new' ? key : 'indeterminate';
}

function parseTime(value: string | null | undefined): number | null {
    if (!value) {
        return null;
    }
    const time = Date.parse(value);
    return Number.isNaN(time) ? null : time;
}

function toNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toDisplayValues(value: unknown): string[] {
    if (value === null || value === undefined || value === '') {
        return [];
    }
    if (Array.isArray(value)) {
        return [...new Set(value.flatMap(toDisplayValues))];
    }
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const text = obj.displayName ?? obj.name ?? obj.value ?? obj.key ?? obj.title;
        const child = obj.child as Record<string, unknown> | undefined;
        if (typeof text === 'string' || typeof text === 'number') {
            return child?.value ? [`${text} - ${String(child.value)}`] : [String(text)];
        }
        return [];
    }
    return [String(value)];
}

function mapIssue(issue: JiraIssue, fieldSettings: FieldSettings): TisIssue {
    const { fields } = issue;
    const { $userutils } = inject('UserUtilsService');
    const { epicField, storyPointField, groupField } = fieldSettings;
    const epicValue = epicField ? fields[epicField] : undefined;

    return {
        id: issue.id,
        key: issue.key,
        summary: fields.summary || '',
        url: $userutils.getTicketUrl(issue.key),
        projectKey: fields.project?.key || '',
        projectName: fields.project?.name || '',
        issueType: { name: fields.issuetype?.name || '', iconUrl: fields.issuetype?.iconUrl },
        status: {
            id: fields.status?.id || '',
            name: fields.status?.name || '',
            iconUrl: fields.status?.iconUrl,
            category: toStatusCategory(fields.status?.statusCategory?.key),
        },
        assignee: toIssueUser(fields.assignee),
        reporter: toIssueUser(fields.reporter),
        parentKey: fields.parent?.key,
        epicKey: typeof epicValue === 'string' ? epicValue : undefined,
        storyPoints: storyPointField ? toNumber(fields[storyPointField]) : undefined,
        created: parseTime(fields.created) ?? Date.now(),
        updated: fields.updated || '',
        resolvedAt: parseTime(fields.resolutiondate),
        timeEstimate: toNumber(fields.timeestimate),
        aggregateTimeEstimate: toNumber(fields.aggregatetimeestimate),
        originalEstimate: toNumber(fields.timeoriginalestimate),
        aggregateOriginalEstimate: toNumber(fields.aggregatetimeoriginalestimate),
        fieldValues: groupField ? toDisplayValues(fields[groupField]) : [],
    };
}

function joinJql(parts: (string | null)[]): string {
    return parts
        .filter((p): p is string => !!p)
        .map((p) => `(${p})`)
        .join(' AND ');
}

function getFieldSettings(groupField: string | null): FieldSettings {
    const { $session } = inject('SessionService');
    const user = $session.CurrentUser;
    return { epicField: user?.epicNameField?.id, storyPointField: user?.storyPointField?.id, groupField };
}

function getFieldsToFetch({ epicField, storyPointField, groupField }: FieldSettings): string[] {
    const fields = new Set(baseIssueFields);
    [epicField, storyPointField, groupField].forEach((f) => f && fields.add(f));
    return [...fields];
}

async function searchJql(jql: string, fieldsToFetch: string[], fieldSettings: FieldSettings): Promise<TisIssue[]> {
    const { $jira } = inject('JiraService');
    const issues = (await $jira.searchTickets(jql, fieldsToFetch)) as JiraIssue[];
    return issues.map((issue) => mapIssue(issue, fieldSettings));
}

function toMemberships(groups: UserGroup[]): GroupMembership[] {
    return groups.map((g) => ({ name: g.name, userIds: (g.users || []).map(getJiraUserId).filter(Boolean) }));
}

/**
 * Returns undefined when the period cannot match any issue, i.e. when none of the selected sprints are available.
 */
async function getPeriodJql(settings: TimeInStatusSettings): Promise<string | null | undefined> {
    if (settings.periodMode !== 'sprint') {
        return getDateRangeJql(settings.dateRange);
    }
    const sprints = await resolveSelectedSprints(settings.sprintSelection);
    return sprints.length ? `sprint in (${sprints.map((s) => s.id).join(', ')})` : undefined;
}

export async function searchReportIssues(settings: TimeInStatusSettings): Promise<IssueSearchResult> {
    const fieldSettings = getFieldSettings(getGroupFieldId(settings.groupBy));
    const fieldsToFetch = getFieldsToFetch(fieldSettings);
    const userJql = stripOrderBy(settings.jql);
    const needsGroups = settings.scopeMode === 'groups' || settings.groupBy === 'userGroup';
    const [periodJql, groups] = await Promise.all([
        getPeriodJql(settings),
        needsGroups ? resolveUserGroups(settings.userGroups) : [],
    ]);
    const userGroups = toMemberships(groups);

    if (periodJql === undefined) {
        return { issues: [], userGroups };
    }

    if (settings.scopeMode === 'jql') {
        const issues = userJql ? await searchJql(joinJql([userJql, periodJql]), fieldsToFetch, fieldSettings) : [];
        return { issues, userGroups };
    }

    const jqlValues = getGroupUsersJqlValues(groups);
    if (!jqlValues.length) {
        return { issues: [], userGroups };
    }

    const results = await Promise.all(
        chunk(jqlValues, userJqlChunkSize).map((values) =>
            searchJql(
                joinJql([`assignee in (${values.map(escapeJqlValue).join(', ')})`, userJql || null, periodJql]),
                fieldsToFetch,
                fieldSettings,
            ),
        ),
    );

    const uniqueIssues = new Map<string, TisIssue>();
    results.flat().forEach((issue) => uniqueIssues.set(issue.key, issue));

    return { issues: [...uniqueIssues.values()], userGroups };
}

export async function getStatusList(): Promise<StatusInfo[]> {
    const { $jira } = inject('JiraService');
    const statuses = ((await $jira.getJiraStatuses()) as JiraStatusRef[]) || [];

    return statuses.map((s, index) => ({
        id: s.id,
        name: s.name,
        category: toStatusCategory(s.statusCategory?.key),
        order: index,
    }));
}

export async function getGroupByOptions(): Promise<GroupByOptionGroup[]> {
    const { native, custom } = await getFieldsList();
    const builtInKeys = new Set<string>(builtInGroupByOptions.map((o) => o.value));

    const toOptions = (fields: typeof native) =>
        fields
            .filter((f) => !builtInKeys.has(f.key) && !excludedGroupFieldKeys.has(f.key) && !excludedGroupFieldTypes.has(f.schema?.type || ''))
            .filter((f) => f.custom || f.schema?.type !== 'string')
            .map((f) => ({ value: `${fieldGroupPrefix}${f.id || f.key}`, label: f.name }));

    return [
        { label: 'Common', items: builtInGroupByOptions.map(({ value, label }) => ({ value, label })) },
        { label: 'Native fields', items: toOptions(native) },
        { label: 'Custom fields', items: toOptions(custom) },
    ].filter((g) => g.items.length);
}
