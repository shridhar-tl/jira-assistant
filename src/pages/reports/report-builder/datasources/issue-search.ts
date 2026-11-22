import { inject } from '@services';

import type { Dataset, DatasourceFetchContext } from '@components/report-builder';

import { getIssueSchema, getQueryFieldIds, normalizeIssue, type JiraIssue, type SelectedIssueField } from '../config/jira-fields';
import { formatJqlValue } from '../config/jql-format';

export interface IssueSearchOptions {
    maxResults?: number;
    worklogStartDate?: Date;
    worklogEndDate?: Date;
}

export async function searchIssues(jql: string, fields: SelectedIssueField[], options: IssueSearchOptions = {}): Promise<JiraIssue[]> {
    const { $jira } = inject('JiraService');
    const fieldIds = getQueryFieldIds(fields);
    if (options.maxResults && options.maxResults > 0) {
        const page = await $jira.searchTicketsUpTo(jql, fieldIds, options.maxResults);
        return page.issues as JiraIssue[];
    }
    return (await $jira.searchTickets(jql, fieldIds, undefined, {
        worklogStartDate: options.worklogStartDate,
        worklogEndDate: options.worklogEndDate,
    })) as JiraIssue[];
}

export function issuesToDataset(issues: JiraIssue[], fields: SelectedIssueField[]): Dataset {
    const today = new Date();
    return { rows: issues.map((issue) => normalizeIssue(issue, fields, today)), fields: getIssueSchema(fields) };
}

/** A placeholder already wrapped in quotes, such as "{{ Parameters.word }}", whose quotes would double the ones added to the value. */
const quotedPlaceholder = /(["'])(\{\{[^{}]*\}\})\1/g;

export function interpolateJql(template: string | undefined, context: DatasourceFetchContext): Promise<string> {
    return context.interpolate((template ?? '').replace(quotedPlaceholder, '$2'), formatJqlValue);
}

export function combineJql(...parts: Array<string | undefined>): string {
    const clauses = parts.map((p) => p?.trim()).filter((p): p is string => !!p);
    if (clauses.length === 0) return '';
    const orderBy = clauses
        .map((c) => /\border\s+by\b[\s\S]*$/i.exec(c)?.[0])
        .filter(Boolean)
        .pop();
    const filters = clauses.map((c) => c.replace(/\border\s+by\b[\s\S]*$/i, '').trim()).filter(Boolean);
    const where = filters.length > 1 ? filters.map((f) => `(${f})`).join(' AND ') : (filters[0] ?? '');
    return orderBy ? `${where} ${orderBy}`.trim() : where;
}
