import { endOfDay, format, startOfDay } from 'date-fns';
import { ClockIcon } from 'fluxo-ui/icons';

import { inject } from '@services';

import type { DatasetField, DatasourceFetchContext, DatasourcePlugin } from '@components/report-builder';

import { convertToDate } from '@utils/helpers';

import { normalizeIssue, selectedFieldToDataset, worklogItemFields } from '../config/jira-fields';
import type { JiraIssue, SelectedIssueField } from '../config/jira-fields';
import { getUserIdentifiers } from '../config/jql-format';

import { openConfigureDialog } from './configure-dialog-store';
import { combineJql, interpolateJql, searchIssues } from './issue-search';

export const worklogsDatasourceType = 'jira-worklogs';

export type WorklogUserMode = 'me' | 'groups' | 'expression' | 'any';

export interface WorklogsDatasourceConfig {
    fromExpression: string;
    toExpression: string;
    userMode: WorklogUserMode;
    groupNames: string[];
    userExpression?: string;
    jql?: string;
    issueFields: SelectedIssueField[];
}

interface WorklogEntry {
    id?: string;
    author?: { accountId?: string; name?: string; emailAddress?: string; key?: string; displayName?: string };
    started?: string;
    timeSpentSeconds?: number;
    comment?: string;
}

interface UserGroupRecord {
    name: string;
    users: Array<{ accountId?: string; name?: string; emailAddress?: string; key?: string }>;
}

const worklogFieldId = 'worklog';

function worklogSchema(issueFields: SelectedIssueField[]): DatasetField[] {
    return [
        { name: 'issueKey', type: 'string' },
        ...issueFields.filter((f) => f.id !== worklogFieldId).map(selectedFieldToDataset),
        ...worklogItemFields.map((f) => (f.name === 'id' ? { ...f, name: 'worklogId' } : f)),
        { name: 'date', type: 'date' },
    ];
}

async function evaluateDate(expression: string, context: DatasourceFetchContext, label: string): Promise<Date> {
    if (!expression?.trim()) throw new Error(`Enter the expression for the ${label} date.`);
    const date = convertToDate(await context.evaluate(expression));
    if (!date) throw new Error(`The ${label} date expression "${expression}" did not return a valid date.`);
    return date;
}

async function resolveUsers(cfg: WorklogsDatasourceConfig, context: DatasourceFetchContext): Promise<string[] | null> {
    switch (cfg.userMode) {
        case 'any':
            return null;
        case 'me': {
            const { $session } = inject('SessionService');
            return getUserIdentifiers($session.CurrentUser.jiraUser);
        }
        case 'groups': {
            const { $usergroup } = inject('UserGroupService');
            const groups = (await $usergroup.getUserGroups()) as UserGroupRecord[];
            const wanted = new Set(cfg.groupNames ?? []);
            return getUserIdentifiers(groups.filter((g) => wanted.has(g.name)));
        }
        case 'expression':
            if (!cfg.userExpression?.trim()) throw new Error('Enter the expression returning the users.');
            return getUserIdentifiers(await context.evaluate(cfg.userExpression));
        default:
            return null;
    }
}

function quoteUser(id: string): string {
    return `"${id.replace(/"/g, '\\"')}"`;
}

export const worklogsDatasourcePlugin: DatasourcePlugin = {
    type: worklogsDatasourceType,
    name: 'Worklogs',
    description: 'Worklogs of a date range for you, your user groups or chosen users, one row per worklog.',
    icon: ClockIcon,
    category: 'Jira',
    initialConfig: () => ({
        fromExpression: 'StartOf(\'month\', Today())',
        toExpression: 'EndOf(\'month\', Today())',
        userMode: 'me',
        groupNames: [],
        issueFields: [],
    }),
    configure: (request) => openConfigureDialog('worklogs', request),
    describe: (config) => {
        const cfg = config as unknown as WorklogsDatasourceConfig;
        const users =
            cfg.userMode === 'me'
                ? 'My worklogs'
                : cfg.userMode === 'groups'
                  ? `Groups: ${(cfg.groupNames ?? []).join(', ') || 'none'}`
                  : cfg.userMode === 'expression'
                    ? `Users from ${cfg.userExpression || '(no expression)'}`
                    : 'All users';
        return `${users} · ${cfg.fromExpression} to ${cfg.toExpression}`;
    },
    fetch: async (config, context) => {
        const cfg = config as unknown as WorklogsDatasourceConfig;
        const from = startOfDay(await evaluateDate(cfg.fromExpression, context, 'start'));
        const to = endOfDay(await evaluateDate(cfg.toExpression, context, 'end'));
        if (from > to) throw new Error('The start date is after the end date.');
        const users = await resolveUsers(cfg, context);
        const issueFields = cfg.issueFields ?? [];
        const schema = worklogSchema(issueFields);
        if (users && users.length === 0) return { rows: [], fields: schema };

        const dateClause = `worklogDate >= '${format(from, 'yyyy-MM-dd')}' AND worklogDate <= '${format(to, 'yyyy-MM-dd')}'`;
        const userClause = users ? `worklogAuthor in (${users.map(quoteUser).join(', ')})` : undefined;
        const filter = await interpolateJql(cfg.jql, context);
        const jql = combineJql(dateClause, userClause, filter);
        const queryFields: SelectedIssueField[] = [
            ...issueFields.filter((f) => f.id !== worklogFieldId),
            { id: worklogFieldId, alias: '__worklog', name: 'Worklog' },
        ];
        const issues = await searchIssues(jql, queryFields, { worklogStartDate: from, worklogEndDate: to });

        const allowed = users ? new Set(users.map((u) => u.toLowerCase())) : null;
        const today = new Date();
        const rows = issues.flatMap((issue: JiraIssue) => {
            const issueValues = normalizeIssue(
                issue,
                issueFields.filter((f) => f.id !== worklogFieldId),
                today,
            );
            delete issueValues.key;
            delete issueValues.id;
            const worklogs = (issue.fields?.worklog as { worklogs?: WorklogEntry[] } | undefined)?.worklogs ?? [];
            return worklogs
                .filter((w) => {
                    const started = w.started ? new Date(w.started) : null;
                    if (!started || started < from || started > to) return false;
                    if (!allowed) return true;
                    return getUserIdentifiers(w.author).some((id) => allowed.has(id.toLowerCase()));
                })
                .map((w) => {
                    const started = new Date(w.started as string);
                    return {
                        issueKey: issue.key,
                        ...issueValues,
                        worklogId: w.id,
                        author: w.author,
                        authorName: w.author?.displayName || w.author?.name || '',
                        started: w.started,
                        timeSpentSeconds: w.timeSpentSeconds ?? 0,
                        hours: (w.timeSpentSeconds ?? 0) / 3600,
                        comment: w.comment ?? '',
                        date: format(started, 'yyyy-MM-dd'),
                    };
                });
        });
        return { rows, fields: schema };
    },
    inferSchema: (config) => worklogSchema((config as unknown as WorklogsDatasourceConfig).issueFields ?? []),
};
