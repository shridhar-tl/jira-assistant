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

async function fetchIssueByIssue(issues: TisIssue[]): Promise<FetchedHistories> {
    const { $jira } = inject('JiraService');
    const transitions: Record<string, StatusTransition[]> = {};
    const partialIssueKeys: string[] = [];
    const overflowing: EmbeddedChangelogIssue[] = [];

    for (const keys of chunk(
        issues.map((i) => i.key),
        issueKeyChunkSize,
    )) {
        const results = await searchWithEmbeddedChangelog(keys);
        for (const result of results) {
            const histories = result.changelog?.histories || [];
            transitions[result.key] = toTransitions(histories);
            if ((result.changelog?.total ?? 0) > histories.length) {
                overflowing.push(result);
            }
        }
    }

    await runOnQueue(overflowing, historyFetchConcurrency, async ({ key }) => {
        try {
            transitions[key] = toTransitions(await $jira.getIssueChangeHistories(key));
        } catch (err) {
            console.error(`Unable to fetch the complete history of ${key}`, err);
            partialIssueKeys.push(key);
        }
    });

    for (const issue of issues) {
        if (!transitions[issue.key]) {
            // Issue might have been moved or deleted after the search
            transitions[issue.key] = [];
            partialIssueKeys.push(issue.key);
        }
    }

    return { transitions, partialIssueKeys, usedFallback: false };
}

async function fetchUsingBulkApi(issues: TisIssue[]): Promise<FetchedHistories> {
    const { $jira } = inject('JiraService');
    // Field filter is not used as Jira does not match the history items recorded without fieldId (e.g. older or imported data)
    const historiesById = await $jira.getBulkChangeHistories(issues.map((i) => i.id));

    const transitions: Record<string, StatusTransition[]> = {};
    for (const issue of issues) {
        transitions[issue.key] = toTransitions(historiesById[issue.id] || []);
    }

    return { transitions, partialIssueKeys: [], usedFallback: false };
}

/**
 * Jira Cloud offers a bulk changelog API to fetch the history of many issues in a few calls.
 * As it is an experimental API, failures are handled by falling back to embedded changelog in search results
 * and fetching individually only for issues having more history than what is embedded.
 * Jira Data Center does not have any bulk API and so the individual approach is used directly.
 */
export async function fetchStatusHistories(issues: TisIssue[], isCloud: boolean): Promise<FetchedHistories> {
    if (!issues.length) {
        return { transitions: {}, partialIssueKeys: [], usedFallback: false };
    }

    let fetched: FetchedHistories;

    if (isCloud) {
        try {
            fetched = await fetchUsingBulkApi(issues);
        } catch (err) {
            console.warn('Bulk changelog API failed. Falling back to fetch the history from search results.', err);
            fetched = { ...(await fetchIssueByIssue(issues)), usedFallback: true };
        }
    } else {
        fetched = await fetchIssueByIssue(issues);
    }

    await saveToCache(issues, fetched);
    return fetched;
}
