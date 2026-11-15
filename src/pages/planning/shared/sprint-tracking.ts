import { endOfDay, isAfter, isBefore } from 'date-fns';

import { isPluginBuild } from '@/constants/build-info';

import { inject } from '@services';

import { getCached } from './cache';
import { sprintStartPropertyKey } from './constants';
import type { ScopeChange } from './health';
import { searchIssuePages } from './jira-api';

interface RawWorklog {
    author?: { accountId?: string; name?: string };
    started?: string;
    timeSpentSeconds?: number;
}

export interface LoggedTime {
    byMember: Record<string, number>;
    partialIssues: string[];
}

const scopeCacheMinutes = 10;

/**
 * Issues added and removed since the sprint started (one request).
 * Forge reads the snapshot written at sprint start. Other builds read Jira's sprint report.
 */
export function loadScopeChange(boardId: number, sprintId: number, currentKeys: string[], force?: boolean): Promise<ScopeChange | null> {
    return getCached(
        `scope_${boardId}_${sprintId}`,
        scopeCacheMinutes,
        async () => {
            const { $jira } = inject('JiraService');
            if (isPluginBuild) {
                const snapshot = (await $jira.getSprintProperty(sprintId, sprintStartPropertyKey)) as Record<string, unknown> | null;
                if (!snapshot) {
                    return null;
                }
                const startKeys = new Set(Object.keys(snapshot));
                const current = new Set(currentKeys);
                return { added: currentKeys.filter((k) => !startKeys.has(k)), removed: [...startKeys].filter((k) => !current.has(k)) };
            }
            const report = (await $jira.getRapidSprintDetails(boardId, sprintId)) as {
                contents?: { issueKeysAddedDuringSprint?: Record<string, boolean>; puntedIssues?: { key: string }[] };
            } | null;
            if (!report?.contents) {
                return null;
            }
            return {
                added: Object.keys(report.contents.issueKeysAddedDuringSprint || {}),
                removed: (report.contents.puntedIssues || []).map((i) => i.key),
            };
        },
        force,
    );
}

/**
 * Time logged by each person on the sprint's issues within the sprint dates (one search with the worklog field).
 * Jira returns the latest 20 worklogs of an issue in a search. Issues with more are reported as partial instead of
 * being requested one by one.
 */
export async function loadLoggedTime(sprintId: number, start: Date, end: Date): Promise<LoggedTime> {
    const { issues } = await searchIssuePages(`sprint = ${sprintId}`, ['worklog'], { maxPages: 3 });
    const byMember: Record<string, number> = {};
    const partialIssues: string[] = [];
    const rangeEnd = endOfDay(end);

    for (const issue of issues) {
        const worklog = issue.fields.worklog as { worklogs?: RawWorklog[]; total?: number } | undefined;
        const list = worklog?.worklogs || [];
        if ((worklog?.total || 0) > list.length) {
            partialIssues.push(issue.key);
        }
        for (const log of list) {
            const started = log.started ? new Date(log.started) : null;
            const author = log.author?.accountId || log.author?.name;
            if (!started || !author || isBefore(started, start) || isAfter(started, rangeEnd)) {
                continue;
            }
            byMember[author] = (byMember[author] || 0) + (log.timeSpentSeconds || 0) / 3600;
        }
    }

    return { byMember, partialIssues };
}
