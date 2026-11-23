import { inject } from '@services';

import { stringifyComment } from '@utils/worklog-utils';


import type { JiraIssueLinkType } from '@types';

type FieldValues = Record<string, unknown>;

export interface DerivedItemFilterOption {
    label: string;
    value: string;
}

export interface DerivedItemFilter {
    prop: string;
    label: string;
    placeholder: string;
    helpText: string;
    loadOptions: () => Promise<DerivedItemFilterOption[]>;
}

interface DerivedSource {
    prop: string;
    queryFields: string[];
    normalize?: (fields: FieldValues) => unknown;
    hydrate?: (issues: FieldValues[], props: Set<string>) => Promise<void>;
    itemFilter?: DerivedItemFilter;
}

interface LinkedIssueRef {
    id: string;
    key: string;
    fields?: {
        summary?: string;
        status?: unknown;
        issuetype?: unknown;
        priority?: unknown;
    };
}

interface JiraIssueLink {
    type?: Partial<JiraIssueLinkType>;
    inwardIssue?: LinkedIssueRef;
    outwardIssue?: LinkedIssueRef;
}

export interface LinkedIssueItem extends FieldValues {
    linkType?: string;
    linkTypeName?: string;
    id: string;
    issuekey: string;
    summary?: string;
    status?: unknown;
    issuetype?: unknown;
    priority?: unknown;
}

interface SearchedIssue {
    key: string;
    fields?: FieldValues;
}

const issueKeyPattern = /^[A-Z][A-Z0-9_]+-[1-9][0-9]*$/i;
const linkTypesHelpText =
    'Only the linked issues with the selected link types are considered. An issue linked in more than one way is counted for each link.';
const linkedIssuesBatchSize = 100;

const linkedIssueTimeFields: Record<string, string> = {
    timeSpent: 'aggregatetimespent',
    originalEstimate: 'aggregatetimeoriginalestimate',
    remainingEstimate: 'aggregatetimeestimate',
};

type CommentText = Parameters<typeof stringifyComment>[0];

function withPlainText(items: unknown, prop: string): FieldValues[] | undefined {
    if (!Array.isArray(items)) {
        return undefined;
    }

    return items.map((item: FieldValues) => ({ ...item, [prop]: stringifyComment(item[prop] as CommentText) }));
}

function toLinkedIssues(fields: FieldValues): LinkedIssueItem[] {
    const links = Array.isArray(fields.issuelinks) ? (fields.issuelinks as JiraIssueLink[]) : [];

    return links.reduce<LinkedIssueItem[]>((items, link) => {
        const linkedIssue = link.outwardIssue || link.inwardIssue;
        if (!linkedIssue) {
            return items;
        }

        const { summary, status, issuetype, priority } = linkedIssue.fields || {};
        items.push({
            linkType: link.outwardIssue ? link.type?.outward : link.type?.inward,
            linkTypeName: link.type?.name,
            id: linkedIssue.id,
            issuekey: linkedIssue.key,
            summary,
            status,
            issuetype,
            priority,
        });

        return items;
    }, []);
}

async function hydrateLinkedIssues(issues: FieldValues[], props: Set<string>) {
    const timeFields = Object.entries(linkedIssueTimeFields).filter(([prop]) => props.has(prop));
    if (!timeFields.length) {
        return;
    }

    const items = issues.flatMap((issue) => (issue.linkedIssues as LinkedIssueItem[] | undefined) || []);
    const keys = [...new Set(items.map((item) => item.issuekey).filter((key) => issueKeyPattern.test(key)))];
    if (!keys.length) {
        return;
    }

    const { $jira } = inject('JiraService');
    const jiraFields = timeFields.map(([, field]) => field);
    const fetched = new Map<string, FieldValues>();

    for (let i = 0; i < keys.length; i += linkedIssuesBatchSize) {
        const batch = keys.slice(i, i + linkedIssuesBatchSize);
        const result: SearchedIssue[] = await $jira.searchTickets(`key in (${batch.join(',')})`, jiraFields);
        result.forEach((issue) => fetched.set(issue.key.toUpperCase(), issue.fields || {}));
    }

    items.forEach((item) => {
        const fields = fetched.get(item.issuekey.toUpperCase());
        timeFields.forEach(([prop, field]) => {
            item[prop] = fields?.[field] ?? null;
        });
    });
}

async function loadLinkTypeOptions(): Promise<DerivedItemFilterOption[]> {
    const { $jira } = inject('JiraService');
    const linkTypes = await $jira.getIssueLinkTypes();
    const names = new Set(linkTypes.flatMap((type) => [type.outward, type.inward]).filter(Boolean));

    return [...names].sort((a, b) => a.localeCompare(b)).map((name) => ({ label: name, value: name }));
}

const derivedSources: Record<string, DerivedSource> = {
    worklog: {
        prop: 'worklog',
        queryFields: ['worklog'],
        normalize: (fields) => withPlainText((fields.worklog as { worklogs?: unknown[] } | undefined)?.worklogs, 'comment'),
    },
    comment: {
        prop: 'comment',
        queryFields: ['comment'],
        normalize: (fields) => withPlainText((fields.comment as { comments?: unknown[] } | undefined)?.comments, 'body'),
    },
    linkedIssues: {
        prop: 'linkedIssues',
        queryFields: ['issuelinks'],
        normalize: toLinkedIssues,
        hydrate: hydrateLinkedIssues,
        itemFilter: {
            prop: 'linkType',
            label: 'Link types',
            placeholder: 'All link types',
            helpText: linkTypesHelpText,
            loadOptions: loadLinkTypeOptions,
        },
    },
};

function getDerivedRoot(key: string): string {
    return key.split('.')[0];
}

export function getQueryFieldsForKey(key: string, isDerived?: boolean): string[] {
    if (!isDerived || !key.includes('.')) {
        return [key];
    }

    const root = getDerivedRoot(key);

    return derivedSources[root]?.queryFields ?? [root];
}

export function normalizeDerivedSources(fields: FieldValues): FieldValues {
    Object.values(derivedSources).forEach((source) => {
        if (source.normalize && source.queryFields.some((field) => fields[field] !== undefined)) {
            fields[source.prop] = source.normalize(fields);
        }
    });

    return fields;
}

export async function hydrateDerivedSources(issues: FieldValues[], derivedKeys: Set<string>) {
    const propsBySource = new Map<string, Set<string>>();

    derivedKeys.forEach((key) => {
        const [root, prop] = key.split('.');
        if (!prop || !derivedSources[root]?.hydrate) {
            return;
        }

        const props = propsBySource.get(root) || new Set<string>();
        props.add(prop);
        propsBySource.set(root, props);
    });

    for (const [root, props] of propsBySource) {
        await derivedSources[root].hydrate?.(issues, props);
    }
}

export function getDerivedItemFilter(key: string): DerivedItemFilter | undefined {
    return key.includes('.') ? derivedSources[getDerivedRoot(key)]?.itemFilter : undefined;
}

export function filterDerivedItems<T>(field: { key: string; itemFilterValues?: string[] }, items: T[]): T[] {
    const values = field.itemFilterValues;
    if (!values?.length) {
        return items;
    }

    const itemFilter = getDerivedItemFilter(field.key);
    if (!itemFilter) {
        return items;
    }

    const allowed = new Set(values);

    return items.filter((item) => allowed.has(String((item as FieldValues | null)?.[itemFilter.prop] ?? '')));
}
