import { inject } from '@services';

import type { DatasetField } from '@components/report-builder';

export type JiraListKind = 'projects' | 'issueTypes' | 'statuses' | 'boards' | 'fields' | 'linkTypes' | 'openIssues' | 'userGroups';

export interface JiraListsDatasourceConfig {
    list: JiraListKind;
}

type Row = Record<string, unknown>;

interface ListDefinition {
    label: string;
    fields: DatasetField[];
    load: () => Promise<Row[]>;
}

interface Named {
    id?: string | number;
    key?: string;
    name?: string;
}

function str(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
}

const listDefinitions: Record<JiraListKind, ListDefinition> = {
    projects: {
        label: 'Projects',
        fields: [
            { name: 'id', type: 'string' },
            { name: 'key', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'projectType', type: 'string' },
        ],
        load: async () => {
            const { $jira } = inject('JiraService');
            const projects = (await $jira.getProjects()) as Array<Named & { projectTypeKey?: string }>;
            return projects.map((p) => ({ id: str(p.id), key: p.key, name: p.name, projectType: p.projectTypeKey ?? '' }));
        },
    },
    issueTypes: {
        label: 'Issue types',
        fields: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'subtask', type: 'boolean' },
            { name: 'description', type: 'string' },
        ],
        load: async () => {
            const { $jira } = inject('JiraService');
            const types = (await $jira.getIssueTypes()) as Array<Named & { subtask?: boolean; description?: string }>;
            return types.map((t) => ({ id: str(t.id), name: t.name, subtask: !!t.subtask, description: t.description ?? '' }));
        },
    },
    statuses: {
        label: 'Statuses',
        fields: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'categoryKey', type: 'string' },
        ],
        load: async () => {
            const { $jira } = inject('JiraService');
            const statuses = (await $jira.getJiraStatuses()) as Array<Named & { statusCategory?: Named }>;
            return statuses.map((s) => ({
                id: str(s.id),
                name: s.name,
                category: s.statusCategory?.name ?? '',
                categoryKey: s.statusCategory?.key ?? '',
            }));
        },
    },
    boards: {
        label: 'Agile boards',
        fields: [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'string' },
            { name: 'type', type: 'string' },
        ],
        load: async () => {
            const { $jira } = inject('JiraService');
            const boards = (await $jira.getRapidViews()) as Array<Named & { type?: string; sprintSupportEnabled?: boolean }>;
            return boards.map((b) => ({ id: Number(b.id), name: b.name, type: b.type ?? (b.sprintSupportEnabled ? 'scrum' : '') }));
        },
    },
    fields: {
        label: 'Jira fields',
        fields: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'custom', type: 'boolean' },
            { name: 'type', type: 'string' },
        ],
        load: async () => {
            const { $jira } = inject('JiraService');
            const fields = (await $jira.getCustomFields()) as Array<Named & { custom?: boolean; schema?: { type?: string } }>;
            return fields.map((f) => ({ id: str(f.id), name: f.name, custom: !!f.custom, type: f.schema?.type ?? '' }));
        },
    },
    linkTypes: {
        label: 'Issue link types',
        fields: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'inward', type: 'string' },
            { name: 'outward', type: 'string' },
        ],
        load: async () => {
            const { $jira } = inject('JiraService');
            const types = await $jira.getIssueLinkTypes();
            return types.map((t) => ({ id: str(t.id), name: t.name, inward: t.inward ?? '', outward: t.outward ?? '' }));
        },
    },
    openIssues: {
        label: 'My open issues',
        fields: [
            { name: 'key', type: 'string' },
            { name: 'summary', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'issueType', type: 'string' },
            { name: 'priority', type: 'string' },
            { name: 'project', type: 'string' },
        ],
        load: async () => {
            const { $jira } = inject('JiraService');
            const issues = (await $jira.getOpenTickets()) as Array<{
                key: string;
                fields?: Record<string, (Named & { summary?: string }) | string | undefined>;
            }>;
            return issues.map((i) => {
                const f = i.fields ?? {};
                const named = (v: unknown) => (v && typeof v === 'object' ? ((v as Named).name ?? '') : str(v));
                return {
                    key: i.key,
                    summary: str(f.summary),
                    status: named(f.status),
                    issueType: named(f.issuetype),
                    priority: named(f.priority),
                    project: f.project && typeof f.project === 'object' ? ((f.project as Named).key ?? '') : '',
                };
            });
        },
    },
    userGroups: {
        label: 'My user groups (one row per member)',
        fields: [
            { name: 'group', type: 'string' },
            { name: 'displayName', type: 'string' },
            { name: 'accountId', type: 'string' },
            { name: 'emailAddress', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'timeZone', type: 'string' },
        ],
        load: async () => {
            const { $usergroup } = inject('UserGroupService');
            const groups = (await $usergroup.getUserGroups()) as Array<{
                name: string;
                timeZone?: string;
                users?: Array<Record<string, unknown>>;
            }>;
            return groups.flatMap((g) =>
                (g.users ?? []).map((u) => ({
                    group: g.name,
                    displayName: str(u.displayName),
                    accountId: str(u.accountId),
                    emailAddress: str(u.emailAddress),
                    name: str(u.name),
                    timeZone: str(u.timeZone || g.timeZone),
                })),
            );
        },
    },
};

export const jiraListOptions = (Object.keys(listDefinitions) as JiraListKind[]).map((k) => ({ value: k, label: listDefinitions[k].label }));

export function getJiraList(config: Record<string, unknown>): ListDefinition {
    return listDefinitions[(config as unknown as JiraListsDatasourceConfig).list] ?? listDefinitions.projects;
}
