import type { EstimateTarget, IssueBatch, IssueBoard, IssueSprint, IssueSuggestion } from 'planning-poker/contracts';

import { inject } from '@services';

import { mergeUrl, viewIssueUrl } from '@utils/helpers';

import type { Issue } from '@types';

import type JiraService from '../../services/jira-service';
import type SessionService from '../../services/session-service';

interface PickerIssue {
    id?: string | number;
    key: string;
    summaryText?: string;
    summary?: string;
    img?: string;
    url?: string;
}

interface PickerSection {
    issues?: PickerIssue[];
}

interface JiraBoard {
    id: string | number;
    name: string;
}

interface JiraSprint {
    id: string | number;
    name: string;
    state?: string;
}

export const pokerIssueKeyTest = /^[A-Z][A-Z0-9_]*-[1-9][0-9]*$/i;

const minimumQueryLength = 2;
const maxQueryLength = 2000;
const sprintIdTest = /^[1-9][0-9]*$/;
const sprintStates: IssueSprint['state'][] = ['active', 'future'];
const missingFieldReason = 'Choose the story points field in Jira Assistant General settings (Default values) to update estimates in Jira.';
const otherSiteMessage = 'This issue belongs to a different Jira site, so its story points cannot be updated from here.';
const invalidEstimateMessage = 'Story points must be a number of zero or more.';
const updateFailureMessage = 'Jira did not accept the story points update.';
const searchFailureMessage = 'Jira could not run this search.';
const invalidSprintMessage = 'That sprint is not valid.';
const emptyQueryMessage = 'Enter a JQL query.';
const longQueryMessage = `The JQL query must be ${maxQueryLength} characters or fewer.`;

interface JiraErrorBody {
    errorMessages?: string[];
    errors?: Record<string, string>;
}

function jiraErrorBody(error: unknown): JiraErrorBody | undefined {
    return (error as { error?: JiraErrorBody } | null)?.error;
}

function jiraErrorText(error: unknown, fieldId: string): string {
    const body = jiraErrorBody(error);
    return body?.errors?.[fieldId] || body?.errorMessages?.[0] || Object.values(body?.errors ?? {})[0] || updateFailureMessage;
}

function searchErrorText(error: unknown): string {
    const body = jiraErrorBody(error);
    return body?.errorMessages?.join(' ') || Object.values(body?.errors ?? {})[0] || searchFailureMessage;
}

function currentRoot(session: SessionService): string {
    return session.CurrentUser.jiraUrl?.replace(/\/+$/, '') || '';
}

function fromPicker(issue: PickerIssue, root: string): IssueSuggestion {
    return {
        id: String(issue.id ?? issue.key),
        key: issue.key,
        summary: issue.summaryText || issue.summary || '',
        icon: issue.img ? mergeUrl(root, issue.img) : undefined,
        url: issue.url || viewIssueUrl(root, issue.key),
        root,
    };
}

function readEstimate(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function fromSearch(issue: Issue, root: string, estimateFieldId: string | undefined): IssueSuggestion {
    return {
        id: String(issue.id),
        key: issue.key,
        summary: issue.fields.summary || '',
        icon: issue.fields.issuetype?.iconUrl,
        url: viewIssueUrl(root, issue.key),
        root,
        status: issue.fields.status?.name,
        estimate: estimateFieldId ? readEstimate(issue.fields[estimateFieldId]) : undefined,
    };
}

function toSprintState(state: string | undefined): IssueSprint['state'] | null {
    const normalized = state?.toLowerCase();
    return sprintStates.find((value) => value === normalized) ?? null;
}

export async function lookupPokerIssues(query: string): Promise<IssueSuggestion[]> {
    const text = query.trim();
    if (text.length < minimumQueryLength) {
        return [];
    }

    const { $jira, $session } = inject('JiraService', 'SessionService') as { $jira: JiraService; $session: SessionService };
    const root = currentRoot($session);
    const sections: PickerSection[] = await $jira.lookupIssues(text);

    return sections.flatMap((section) => (section.issues ?? []).map((issue) => fromPicker(issue, root)));
}

export async function findPokerIssue(key: string): Promise<IssueSuggestion | null> {
    const { $jira, $session } = inject('JiraService', 'SessionService') as { $jira: JiraService; $session: SessionService };
    const { issues } = await $jira.searchTicketsUpTo(`key = ${key}`, ['summary', 'issuetype', 'status'], 1);
    return issues[0] ? fromSearch(issues[0], currentRoot($session), undefined) : null;
}

function isStandardIssue(issue: Issue): boolean {
    return issue.fields.issuetype?.subtask !== true;
}

async function searchPokerIssues(jql: string, limit: number, include: (issue: Issue) => boolean = () => true): Promise<IssueBatch> {
    const { $jira, $session } = inject('JiraService', 'SessionService') as { $jira: JiraService; $session: SessionService };
    const estimateFieldId = $session.CurrentUser.storyPointField?.id;
    const fields = ['summary', 'issuetype', 'status', ...(estimateFieldId ? [estimateFieldId] : [])];

    try {
        const { issues, hasMore } = await $jira.searchTicketsUpTo(jql, fields, limit);
        const root = currentRoot($session);
        return { issues: issues.filter(include).map((issue) => fromSearch(issue, root, estimateFieldId)), hasMore };
    } catch (error) {
        console.error('Poker issue search failed', error);
        throw new Error(searchErrorText(error), { cause: error });
    }
}

export async function listPokerBoards(): Promise<IssueBoard[]> {
    const { $jira } = inject('JiraService') as { $jira: JiraService };
    const boards: JiraBoard[] = await $jira.getRapidViews();
    return boards.map((board) => ({ id: String(board.id), name: board.name }));
}

export async function listPokerSprints(boardId: string): Promise<IssueSprint[]> {
    const { $jira } = inject('JiraService') as { $jira: JiraService };
    const sprints = (await $jira.getRapidSprintList([boardId], { state: sprintStates.join(',') })) as JiraSprint[];

    return sprints
        .flatMap((sprint): IssueSprint[] => {
            const state = toSprintState(sprint.state);
            return state ? [{ id: String(sprint.id), name: sprint.name, state }] : [];
        })
        .sort((a, b) => sprintStates.indexOf(a.state) - sprintStates.indexOf(b.state) || Number(a.id) - Number(b.id));
}

export async function loadPokerSprintIssues(sprintId: string, limit: number): Promise<IssueBatch> {
    if (!sprintIdTest.test(sprintId)) {
        throw new Error(invalidSprintMessage);
    }
    return searchPokerIssues(`sprint = ${sprintId} ORDER BY Rank ASC`, limit, isStandardIssue);
}

export async function loadPokerJqlIssues(query: string, limit: number): Promise<IssueBatch> {
    const jql = query.trim();
    if (!jql) {
        throw new Error(emptyQueryMessage);
    }
    if (jql.length > maxQueryLength) {
        throw new Error(longQueryMessage);
    }
    return searchPokerIssues(jql, limit);
}

export function getPokerEstimateTarget(): EstimateTarget {
    const { $session } = inject('SessionService') as { $session: SessionService };
    const field = $session.CurrentUser.storyPointField;
    if (!field?.id) {
        return { ready: false, reason: missingFieldReason };
    }
    return { ready: true, fieldName: field.name || field.id };
}

export async function updatePokerEstimate(key: string, root: string | undefined, points: number): Promise<void> {
    const { $jira, $session } = inject('JiraService', 'SessionService') as { $jira: JiraService; $session: SessionService };
    const fieldId = $session.CurrentUser.storyPointField?.id;
    if (!fieldId) {
        throw new Error(missingFieldReason);
    }
    if (!pokerIssueKeyTest.test(key)) {
        throw new Error('That does not look like a valid issue key.');
    }
    if (!Number.isFinite(points) || points < 0) {
        throw new Error(invalidEstimateMessage);
    }
    if (root && root.replace(/\/+$/, '') !== currentRoot($session)) {
        throw new Error(otherSiteMessage);
    }

    try {
        await $jira.updateIssue(key, { fields: { [fieldId]: points } });
    } catch (error) {
        console.error(`Could not update the story points of ${key}`, error);
        throw new Error(jiraErrorText(error, fieldId), { cause: error });
    }
}
