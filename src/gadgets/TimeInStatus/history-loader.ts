import type { IssueStatusHistory, StatusTransition } from '@/types';
import { chunk, runOnQueue } from '@/utils';

import { inject } from '@services';
import type { JiraChangeHistory } from '@services/jira-service';

import { escapeJqlValue } from '../shared/jira-query-utils';

import { historyFetchConcurrency, issueKeyChunkSize } from './constants';
import type { TisIssue } from './types';

interface EmbeddedChangelogIssue {
    key: string;
    changelog?: { histories?: JiraChangeHistory[]; total?: number };
}

export interface HistoryPlan {
    cached: Record<string, StatusTransition[]>;
    stale: TisIssue[];
}

interface EmbeddedHistories {
    transitions: Record<string, StatusTransition[]>;
    overflowing: TisIssue[];
}

export interface FetchedHistories {
    transitions: Record<string, StatusTransition[]>;
    partialIssueKeys: string[];
    usedFallback: boolean;
}

const statusFieldId = 'status';

function toTransitions(histories: JiraChangeHistory[]): StatusTransition[] {
    const transitions: StatusTransition[] = [];

    for (const history of histories) {
        const at = typeof history.created === 'number' ? history.created : Date.parse(history.created);
        if (Number.isNaN(at)) {
            continue;
        }
        for (const item of history.items || []) {
            if (item.field === statusFieldId || item.fieldId === statusFieldId) {
                transitions.push({
                    at,
                    fromId: item.from || '',
                    from: item.fromString || '',
                    toId: item.to || '',
                    to: item.toString || '',
                });
            }
        }
    }

    return transitions.sort((a, b) => a.at - b.at);
}

function getCurrentUserId(): number {
    const { $session } = inject('SessionService');
    return Number($session.userId);
}

export async function planHistoryFetch(issues: TisIssue[]): Promise<HistoryPlan> {
    const { $storage } = inject('StorageService');
    const cached: Record<string, StatusTransition[]> = {};
    let entries: IssueStatusHistory[] = [];

    try {
        entries = await $storage.getIssueStatusHistories(
            getCurrentUserId(),
            issues.map((i) => i.key),
        );
    } catch (err) {
        console.warn('Unable to read the cached status history. All the history would be fetched from Jira.', err);
    }

    const updatedMap = new Map(issues.map((i) => [i.key, i.updated]));
    for (const entry of entries) {
        if (entry.updated && updatedMap.get(entry.issueKey) === entry.updated) {
            cached[entry.issueKey] = entry.transitions;
        }
    }

    return { cached, stale: issues.filter((i) => !cached[i.key]) };
}

async function saveToCache(issues: TisIssue[], fetched: FetchedHistories): Promise<void> {
    const { $storage } = inject('StorageService');
    const userId = getCurrentUserId();
    const partial = new Set(fetched.partialIssueKeys);
    const fetchedAt = Date.now();

    const entries: IssueStatusHistory[] = issues
        .filter((i) => !partial.has(i.key) && fetched.transitions[i.key] && i.updated)
        .map((i) => ({ userId, issueKey: i.key, issueId: i.id, updated: i.updated, transitions: fetched.transitions[i.key], fetchedAt }));

    try {
        await $storage.bulkPutIssueStatusHistories(entries);
    } catch (err) {
        console.warn('Unable to cache the status history of issues', err);
    }
}

async function searchWithEmbeddedChangelog(keys: string[]): Promise<EmbeddedChangelogIssue[]> {
    const { $jira, $session } = inject('JiraService', 'SessionService');
    const jql = `key in (${keys.map(escapeJqlValue).join(', ')})`;
    const opts = { expand: ['changelog'], ignoreWarnings: true };

    const issues = $session.CurrentUser?.isAtlasCloud
        ? await $jira.searchTickets(jql, ['created'], undefined, opts)
        : await $jira.searchTicketsFallback_V2(jql, ['created'], undefined, opts);

    return issues as EmbeddedChangelogIssue[];
}

/**
 * Search results carry only a limited number of history entries for each issue in Jira Cloud.
 * Issues having more history than what is embedded are returned as overflowing.
 */
async function fetchEmbeddedHistories(issues: TisIssue[]): Promise<EmbeddedHistories> {
    const transitions: Record<string, StatusTransition[]> = {};
    const overflowing: TisIssue[] = [];
    const issueMap = new Map(issues.map((i) => [i.key, i]));

    for (const keys of chunk([...issueMap.keys()], issueKeyChunkSize)) {
        for (const result of await searchWithEmbeddedChangelog(keys)) {
            const histories = result.changelog?.histories || [];
            const issue = issueMap.get(result.key);
            transitions[result.key] = toTransitions(histories);
            if (issue && (result.changelog?.total ?? 0) > histories.length) {
                overflowing.push(issue);
            }
        }
    }

    return { transitions, overflowing };
}

async function fetchIssueByIssue(issues: TisIssue[], transitions: Record<string, StatusTransition[]>): Promise<string[]> {
    const { $jira } = inject('JiraService');
    const partialIssueKeys: string[] = [];

    await runOnQueue(issues, historyFetchConcurrency, async ({ key }) => {
        try {
            transitions[key] = toTransitions(await $jira.getIssueChangeHistories(key));
        } catch (err) {
            console.error(`Unable to fetch the complete history of ${key}`, err);
            partialIssueKeys.push(key);
        }
    });

    return partialIssueKeys;
}

async function fetchUsingBulkApi(issues: TisIssue[], transitions: Record<string, StatusTransition[]>): Promise<string[]> {
    const { $jira } = inject('JiraService');
    // Field filter is not used as Jira does not match the history items recorded without fieldId (e.g. older or imported data)
    const historiesById = await $jira.getBulkChangeHistories(issues.map((i) => i.id));
    const partialIssueKeys: string[] = [];

    for (const issue of issues) {
        const histories = historiesById[issue.id];
        if (histories) {
            transitions[issue.key] = toTransitions(histories);
        } else {
            partialIssueKeys.push(issue.key);
        }
    }

    return partialIssueKeys;
}

/**
 * History of all the issues is fetched along with the search results. Only for the issues having more history than
 * what is embedded, the bulk changelog API of Jira Cloud is used, so that it takes only a few calls for the whole report.
 * As the bulk API is experimental, failures are handled by fetching the history of those few issues one by one.
 * Jira Data Center does not have any bulk API and so the individual approach is used directly.
 */
export async function fetchStatusHistories(issues: TisIssue[], isCloud: boolean): Promise<FetchedHistories> {
    if (!issues.length) {
        return { transitions: {}, partialIssueKeys: [], usedFallback: false };
    }

    const { transitions, overflowing } = await fetchEmbeddedHistories(issues);
    const partialIssueKeys: string[] = [];
    let usedFallback = false;

    if (overflowing.length) {
        if (isCloud) {
            try {
                partialIssueKeys.push(...(await fetchUsingBulkApi(overflowing, transitions)));
            } catch (err) {
                console.warn('Bulk changelog API failed. Falling back to fetch the history of overflowing issues individually.', err);
                usedFallback = true;
                partialIssueKeys.push(...(await fetchIssueByIssue(overflowing, transitions)));
            }
        } else {
            partialIssueKeys.push(...(await fetchIssueByIssue(overflowing, transitions)));
        }
    }

    for (const issue of issues) {
        if (!transitions[issue.key]) {
            // Issue might have been moved or deleted after the search
            transitions[issue.key] = [];
            partialIssueKeys.push(issue.key);
        }
    }

    const fetched: FetchedHistories = { transitions, partialIssueKeys, usedFallback };
    await saveToCache(issues, fetched);
    return fetched;
}
