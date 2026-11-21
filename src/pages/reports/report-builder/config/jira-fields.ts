import { differenceInCalendarDays } from 'date-fns';

import { inject } from '@services';

import type { DatasetField } from '@components/report-builder';

import { stringifyComment } from '@utils/worklog-utils';

export interface JiraFieldMeta {
    id: string;
    name: string;
    custom?: boolean;
    schema?: { type: string; items?: string; system?: string; custom?: string };
}

export interface SelectedIssueField {
    id: string;
    alias: string;
    name: string;
    schemaType?: string;
    itemsType?: string;
}

type Row = Record<string, unknown>;
type CommentText = Parameters<typeof stringifyComment>[0];

export const issueAgeFieldId = 'issueAge';
const richTextFields = new Set(['description', 'environment']);
const invalidAliasChars = /[^A-Za-z0-9_]/g;

const userChildren: DatasetField[] = [
    { name: 'displayName', type: 'string' },
    { name: 'accountId', type: 'string' },
    { name: 'emailAddress', type: 'string' },
    { name: 'name', type: 'string' },
];

const namedChildren: DatasetField[] = [
    { name: 'name', type: 'string' },
    { name: 'id', type: 'string' },
];

const childrenByType: Record<string, DatasetField[]> = {
    user: userChildren,
    status: [
        ...namedChildren,
        {
            name: 'statusCategory',
            type: 'object',
            children: [
                { name: 'key', type: 'string' },
                { name: 'name', type: 'string' },
            ],
        },
    ],
    issuetype: [...namedChildren, { name: 'subtask', type: 'boolean' }],
    priority: namedChildren,
    resolution: namedChildren,
    securitylevel: namedChildren,
    version: [...namedChildren, { name: 'releaseDate', type: 'date' }, { name: 'released', type: 'boolean' }],
    component: namedChildren,
    project: [{ name: 'key', type: 'string' }, ...namedChildren],
    option: [
        { name: 'value', type: 'string' },
        { name: 'id', type: 'string' },
    ],
    progress: [
        { name: 'progress', type: 'number' },
        { name: 'total', type: 'number' },
        { name: 'percent', type: 'number' },
    ],
    timetracking: [
        { name: 'originalEstimateSeconds', type: 'number' },
        { name: 'remainingEstimateSeconds', type: 'number' },
        { name: 'timeSpentSeconds', type: 'number' },
    ],
};

export const worklogItemFields: DatasetField[] = [
    { name: 'id', type: 'string' },
    { name: 'author', type: 'object', children: userChildren },
    { name: 'authorName', type: 'string' },
    { name: 'started', type: 'date' },
    { name: 'timeSpentSeconds', type: 'number' },
    { name: 'hours', type: 'number' },
    { name: 'comment', type: 'string' },
];

const commentItemFields: DatasetField[] = [
    { name: 'id', type: 'string' },
    { name: 'author', type: 'object', children: userChildren },
    { name: 'authorName', type: 'string' },
    { name: 'created', type: 'date' },
    { name: 'body', type: 'string' },
];

const linkItemFields: DatasetField[] = [
    { name: 'linkType', type: 'string' },
    { name: 'linkTypeName', type: 'string' },
    { name: 'key', type: 'string' },
    { name: 'summary', type: 'string' },
    { name: 'status', type: 'string' },
    { name: 'issueType', type: 'string' },
    { name: 'priority', type: 'string' },
];

export function suggestAlias(field: JiraFieldMeta): string {
    if (!field.custom) return field.id;
    const words = field.name.replace(invalidAliasChars, ' ').trim().split(/\s+/).filter(Boolean);
    const alias = words.map((w, i) => (i === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1))).join('');
    if (!alias) return field.id;
    return /^[0-9]/.test(alias) ? `f${alias}` : alias;
}

export function toSelectedField(field: JiraFieldMeta): SelectedIssueField {
    return { id: field.id, alias: suggestAlias(field), name: field.name, schemaType: field.schema?.type, itemsType: field.schema?.items };
}

function scalarField(name: string, label: string, type: string | undefined): DatasetField {
    switch (type) {
        case 'number':
        case 'ageindays':
            return { name, label, type: 'number' };
        case 'date':
        case 'datetime':
            return { name, label, type: 'date' };
        default: {
            const children = type ? childrenByType[type] : undefined;
            return children ? { name, label, type: 'object', children } : { name, label, type: 'string' };
        }
    }
}

export function selectedFieldToDataset(field: SelectedIssueField): DatasetField {
    switch (field.id) {
        case 'worklog':
            return { name: field.alias, label: field.name, type: 'array', children: worklogItemFields };
        case 'comment':
            return { name: field.alias, label: field.name, type: 'array', children: commentItemFields };
        case 'issuelinks':
            return { name: field.alias, label: field.name, type: 'array', children: linkItemFields };
        default:
            break;
    }
    if (richTextFields.has(field.id)) return { name: field.alias, label: field.name, type: 'string' };
    if (field.schemaType === 'array') {
        const item = scalarField('item', field.name, field.itemsType);
        return { name: field.alias, label: field.name, type: 'array', children: item.children ?? [{ name: 'value', type: item.type }] };
    }
    return scalarField(field.alias, field.name, field.schemaType);
}

export function getIssueSchema(fields: SelectedIssueField[]): DatasetField[] {
    return [
        { name: 'key', type: 'string' },
        { name: 'id', type: 'string' },
        ...fields.filter((f) => f.alias !== 'key' && f.alias !== 'id').map(selectedFieldToDataset),
    ];
}

export function getQueryFieldIds(fields: SelectedIssueField[]): string[] {
    const ids = new Set<string>();
    for (const f of fields) {
        ids.add(f.id === issueAgeFieldId ? 'created' : f.id);
    }
    return Array.from(ids);
}

function userName(user: unknown): string {
    const u = user as { displayName?: string; name?: string } | undefined;
    return u?.displayName || u?.name || '';
}

function normalizeWorklogs(value: unknown): Row[] {
    const worklogs = (value as { worklogs?: Row[] } | undefined)?.worklogs ?? [];
    return worklogs.map((w) => ({
        id: w.id,
        author: w.author,
        authorName: userName(w.author),
        started: w.started,
        timeSpentSeconds: w.timeSpentSeconds,
        hours: typeof w.timeSpentSeconds === 'number' ? w.timeSpentSeconds / 3600 : 0,
        comment: stringifyComment(w.comment as CommentText),
    }));
}

function normalizeComments(value: unknown): Row[] {
    const comments = (value as { comments?: Row[] } | undefined)?.comments ?? [];
    return comments.map((c) => ({
        id: c.id,
        author: c.author,
        authorName: userName(c.author),
        created: c.created,
        body: stringifyComment(c.body as CommentText),
    }));
}

interface LinkedIssue {
    key: string;
    fields?: { summary?: string; status?: { name?: string }; issuetype?: { name?: string }; priority?: { name?: string } };
}

interface IssueLink {
    type?: { name?: string; inward?: string; outward?: string };
    inwardIssue?: LinkedIssue;
    outwardIssue?: LinkedIssue;
}

function normalizeLinks(value: unknown): Row[] {
    const links = Array.isArray(value) ? (value as IssueLink[]) : [];
    return links.flatMap((link) => {
        const issue = link.outwardIssue || link.inwardIssue;
        if (!issue) return [];
        return [
            {
                linkType: link.outwardIssue ? link.type?.outward : link.type?.inward,
                linkTypeName: link.type?.name,
                key: issue.key,
                summary: issue.fields?.summary,
                status: issue.fields?.status?.name,
                issueType: issue.fields?.issuetype?.name,
                priority: issue.fields?.priority?.name,
            },
        ];
    });
}

function normalizeValue(fieldId: string, value: unknown): unknown {
    switch (fieldId) {
        case 'worklog':
            return normalizeWorklogs(value);
        case 'comment':
            return normalizeComments(value);
        case 'issuelinks':
            return normalizeLinks(value);
        default:
            break;
    }
    if (richTextFields.has(fieldId)) return stringifyComment(value as CommentText);
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && 'content' in (value as Row)) {
        return stringifyComment(value as CommentText);
    }
    return value ?? null;
}

export interface JiraIssue {
    id: string;
    key: string;
    fields?: Row;
}

export function normalizeIssue(issue: JiraIssue, fields: SelectedIssueField[], today: Date = new Date()): Row {
    const source = issue.fields ?? {};
    const row: Row = { key: issue.key, id: issue.id };
    for (const f of fields) {
        if (f.id === issueAgeFieldId) {
            const created = source.created ? new Date(String(source.created)) : null;
            row[f.alias] = created && !Number.isNaN(created.getTime()) ? differenceInCalendarDays(today, created) : null;
            continue;
        }
        row[f.alias] = normalizeValue(f.id, source[f.id]);
    }
    return row;
}

export async function loadJiraFields(): Promise<JiraFieldMeta[]> {
    const { $jira } = inject('JiraService');
    const fields = (await $jira.getCustomFields()) as JiraFieldMeta[];
    return [...fields].sort((a, b) => a.name.localeCompare(b.name));
}

export const defaultIssueFieldIds = ['summary', 'issuetype', 'status', 'assignee', 'priority', 'project', 'created', 'updated'];
