import { inject } from '@services';

import { viewIssueUrl } from '@utils/helpers';

import type JiraService from '../../services/jira-service';
import type SessionService from '../../services/session-service';

export interface PokerIssueSuggestion {
    id: string;
    key: string;
    summary: string;
    icon?: string;
    url?: string;
    root?: string;
}

export type PokerEstimateTarget = { ready: true; fieldName: string } | { ready: false; reason: string };

export const pokerIssueKeyTest = /^[A-Z][A-Z0-9_]*-[1-9][0-9]*$/i;

const minimumQueryLength = 2;
const missingFieldReason = 'Choose the story points field in Jira Assistant General settings (Default values) to update estimates in Jira.';
const otherSiteMessage = 'This issue belongs to a different Jira site, so its story points cannot be updated from here.';
const invalidEstimateMessage = 'Story points must be a number of zero or more.';
const updateFailureMessage = 'Jira did not accept the story points update.';

interface JiraErrorBody {
    errorMessages?: string[];
    errors?: Record<string, string>;
}

function jiraErrorText(error: unknown, fieldId: string): string {
    const body = (error as { error?: JiraErrorBody } | null)?.error;
    return body?.errors?.[fieldId] || body?.errorMessages?.[0] || Object.values(body?.errors ?? {})[0] || updateFailureMessage;
}

function currentRoot(session: SessionService): string {
    return session.CurrentUser.jiraUrl?.replace(/\/+$/, '') || '';
}

export function toPokerIssue(issue: any, root: string): PokerIssueSuggestion {
    return {
        id: String(issue.id ?? issue.key),
        key: issue.key,
        summary: issue.summaryText || issue.summary || issue.fields?.summary || '',
        icon: issue.img || issue.fields?.issuetype?.iconUrl,
        url: issue.url || viewIssueUrl(root, issue.key),
        root,
    };
}

export async function lookupPokerIssues(query: string): Promise<PokerIssueSuggestion[]> {
    const text = query.trim();
    if (text.length < minimumQueryLength) {
        return [];
    }

    const { $jira, $session } = inject('JiraService', 'SessionService') as { $jira: JiraService; $session: SessionService };
    const root = currentRoot($session);
    const sections = await $jira.lookupIssues(text);
    const issues: PokerIssueSuggestion[] = [];

    sections.forEach((section: any) => {
        (section.issues || []).forEach((issue: any) => issues.push(toPokerIssue(issue, root)));
    });

    return issues;
}

export async function findPokerIssue(key: string): Promise<PokerIssueSuggestion | null> {
    const { $jira, $session } = inject('JiraService', 'SessionService') as { $jira: JiraService; $session: SessionService };
    const [issue] = await $jira.searchTickets(`key=${key}`);
    return issue ? toPokerIssue(issue, currentRoot($session)) : null;
}

export function getPokerEstimateTarget(): PokerEstimateTarget {
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
