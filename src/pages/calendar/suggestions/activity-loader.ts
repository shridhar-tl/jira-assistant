import { endOfDay, format, startOfDay } from 'date-fns';

import { inject } from '@services';

import type { JiraChangeHistory } from '@services/jira-service';

import type { Issue } from '@types';

export interface ActivityInterval {
    start: number;
    end: number;
}

export interface IssueActivity {
    key: string;
    summary: string;
    intervals: ActivityInterval[];
}

interface JiraStatus {
    id: string;
    statusCategory?: { key?: string };
}

const maxIssues = 200;
const inProgressCategoryKey = 'indeterminate';
const inProgressCategoryId = 4;
const trackedFields = ['status', 'assignee'];
const issueFields = ['summary', 'status', 'assignee'];

const toJqlDate = (date: Date) => format(date, 'yyyy/MM/dd HH:mm');

function buildIntervals(issue: Issue, histories: JiraChangeHistory[], accountId: string, inProgressIds: Set<string>, now: number) {
    const changes = histories
        .map((h) => ({ at: typeof h.created === 'number' ? h.created : Date.parse(h.created), items: h.items || [] }))
        .filter((h) => !Number.isNaN(h.at))
        .sort((a, b) => a.at - b.at);

    const firstValue = (field: string, fallback: string) => {
        for (const { items } of changes) {
            const item = items.find((i) => (i.fieldId || i.field) === field);
            if (item) {
                return item.from || '';
            }
        }
        return fallback;
    };

    let status = firstValue('status', issue.fields.status?.id || '');
    let assignee = firstValue('assignee', issue.fields.assignee?.accountId || '');
    let activeSince: number | null = null;
    const intervals: ActivityInterval[] = [];

    const update = (at: number) => {
        const active = inProgressIds.has(status) && assignee === accountId;
        if (active && activeSince === null) {
            activeSince = at;
        } else if (!active && activeSince !== null) {
            intervals.push({ start: activeSince, end: at });
            activeSince = null;
        }
    };

    update(Number.NEGATIVE_INFINITY);
    for (const { at, items } of changes) {
        for (const item of items) {
            const field = item.fieldId || item.field;
            if (field === 'status') {
                status = item.to || '';
            } else if (field === 'assignee') {
                assignee = item.to || '';
            }
        }
        update(at);
    }
    if (activeSince !== null) {
        intervals.push({ start: activeSince, end: now });
    }

    return intervals.filter((i) => i.end > i.start);
}

export async function loadIssueActivity(start: Date, end: Date): Promise<IssueActivity[]> {
    const { $jira, $session } = inject('JiraService', 'SessionService');
    const { accountId } = $session.CurrentUser;
    if (!accountId) {
        return [];
    }

    const now = Date.now();
    const from = toJqlDate(startOfDay(start));
    const to = toJqlDate(new Date(Math.min(endOfDay(end).getTime(), now)));

    const jql = `assignee was currentUser() DURING ("${from}", "${to}") AND (status changed AFTER "${from}" OR statusCategory = ${inProgressCategoryId})`;

    const [{ issues }, statuses]: [{ issues: Issue[] }, JiraStatus[]] = await Promise.all([
        $jira.searchTicketsUpTo(jql, issueFields, maxIssues),
        $jira.getJiraStatuses(),
    ]);

    if (!issues.length) {
        return [];
    }

    const inProgressIds = new Set(statuses.filter((s) => s.statusCategory?.key === inProgressCategoryKey).map((s) => s.id));
    const histories = await $jira.getBulkChangeHistories(
        issues.map((i) => i.id),
        trackedFields,
    );

    return issues
        .map((issue) => ({
            key: issue.key,
            summary: issue.fields.summary || '',
            intervals: buildIntervals(issue, histories[issue.id] || [], accountId, inProgressIds, now),
        }))
        .filter((a) => a.intervals.length);
}
