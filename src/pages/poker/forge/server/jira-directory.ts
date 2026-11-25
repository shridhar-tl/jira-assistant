import { asUser, route } from '@forge/api';

import { EngineError, type PokerUserRef } from './poker-engine';

export interface JiraIdentity {
    name: string;
    avatarUrl?: string;
}

interface RawUser {
    accountId?: string;
    displayName?: string;
    emailAddress?: string;
    avatarUrls?: Record<string, string>;
    active?: boolean;
}

const identityCacheMs = 10 * 60000;
const identityCacheLimit = 1000;
const userBulkSize = 50;
const issueBulkSize = 100;
const maxNameLength = 100;
const jiraAvatarHostSuffixes = ['.atlassian.net', '.atl-paas.net'];
const accountIdPattern = /^[A-Za-z0-9:_-]{1,128}$/;
const issueKeyPattern = /^[A-Z][A-Z0-9_]*-\d+$/;
const controlChars = /\p{Cc}/gu;
const fallbackName = 'Jira user';
const identityUnavailableMessage = 'Your Jira profile could not be read. Please try again.';

const identities = new Map<string, { at: number; identity: JiraIdentity }>();

function cleanName(value: unknown): string {
    const name = typeof value === 'string' ? value.replace(controlChars, '').trim() : '';
    return name.slice(0, maxNameLength) || fallbackName;
}

export function isJiraHostedUrl(value: unknown, siteUrl?: string): value is string {
    if (typeof value !== 'string' || value.length > 2048) {
        return false;
    }
    try {
        const url = new URL(value);
        const siteHost = siteUrl ? new URL(siteUrl).hostname : null;
        return url.protocol === 'https:' && (url.hostname === siteHost || jiraAvatarHostSuffixes.some((suffix) => url.hostname.endsWith(suffix)));
    } catch {
        return false;
    }
}

function avatarOf(user: RawUser): string | undefined {
    const url = user.avatarUrls?.['48x48'] || user.avatarUrls?.['32x32'];
    return isJiraHostedUrl(url) ? url : undefined;
}

export async function getJiraIdentity(accountId: string): Promise<JiraIdentity> {
    const cached = identities.get(accountId);
    if (cached && Date.now() - cached.at < identityCacheMs) {
        return cached.identity;
    }
    const response = await asUser().requestJira(route`/rest/api/3/myself`, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
        throw new EngineError('SERVER_ERROR', identityUnavailableMessage);
    }
    const me = (await response.json()) as RawUser;
    if (me.accountId !== accountId) {
        throw new EngineError('FORBIDDEN', identityUnavailableMessage);
    }
    const identity: JiraIdentity = { name: cleanName(me.displayName), avatarUrl: avatarOf(me) };
    if (identities.size >= identityCacheLimit) {
        const oldest = identities.keys().next().value;
        if (oldest !== undefined) {
            identities.delete(oldest);
        }
    }
    identities.set(accountId, { at: Date.now(), identity });
    return identity;
}

export async function resolveJiraUsers(raw: unknown[], limit: number): Promise<PokerUserRef[]> {
    const ids = [
        ...new Set(
            raw
                .map((entry) => (typeof entry === 'object' && entry !== null ? (entry as { id?: unknown }).id : undefined))
                .filter((id): id is string => typeof id === 'string' && accountIdPattern.test(id)),
        ),
    ].slice(0, limit);
    const users: PokerUserRef[] = [];
    for (let index = 0; index < ids.length; index += userBulkSize) {
        const params = new URLSearchParams({ maxResults: String(userBulkSize) });
        ids.slice(index, index + userBulkSize).forEach((id) => params.append('accountId', id));
        const response = await asUser().requestJira(route`/rest/api/3/user/bulk?${params}`, { headers: { Accept: 'application/json' } });
        if (!response.ok) {
            throw new EngineError('SERVER_ERROR', 'The people to invite could not be looked up in Jira. Please try again.');
        }
        const body = (await response.json()) as { values?: RawUser[] };
        (body.values || [])
            .filter((user) => user.accountId && user.active !== false)
            .forEach((user) => {
                const ref: PokerUserRef = { id: user.accountId as string, name: cleanName(user.displayName) };
                if (typeof user.emailAddress === 'string' && user.emailAddress.length <= 254) {
                    ref.email = user.emailAddress;
                }
                const avatarUrl = avatarOf(user);
                if (avatarUrl) {
                    ref.avatarUrl = avatarUrl;
                }
                users.push(ref);
            });
    }
    return users;
}

export async function findRestrictedIssues(keys: string[]): Promise<string[]> {
    const wanted = [...new Set(keys.filter((key) => issueKeyPattern.test(key)))];
    const visible = new Set<string>();
    for (let index = 0; index < wanted.length; index += issueBulkSize) {
        const response = await asUser().requestJira(route`/rest/api/3/issue/bulkfetch`, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ issueIdsOrKeys: wanted.slice(index, index + issueBulkSize), fields: ['key'] }),
        });
        if (!response.ok) {
            throw new EngineError('SERVER_ERROR', 'Your access to the issues of this room could not be checked. Please try again.');
        }
        const body = (await response.json()) as { issues?: { key?: string }[] };
        (body.issues || []).forEach((issue) => issue.key && visible.add(issue.key));
    }
    return wanted.filter((key) => !visible.has(key));
}
