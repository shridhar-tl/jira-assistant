import { asUser, route } from '@forge/api';
import { kvs } from '@forge/kvs';

export interface ResolverError {
    status: number;
    statusText: string;
    text: string;
}

interface BoardListPage {
    values?: { id?: unknown }[];
    isLast?: boolean;
}

type AccessMap = Record<string, boolean>;

interface AccessEntry {
    ok: boolean;
    at: number;
}

type AccessCache = Record<string, AccessEntry>;

const accessCacheMinutes = 10;
const accessCacheMs = accessCacheMinutes * 60000;
const deniedCacheMs = 60000;
const accessKeyPrefix = 'board-access-';
const adminProbeProperty = 'jaPlannerAccessCheck';
const directCheckLimit = 10;
const parallelChecks = 8;
const listPageSize = 50;
const maxListPages = 20;
const memoryCacheLimit = 500;

const memoryCache = new Map<string, AccessCache>();
const adminCache = new Map<string, { at: number; isAdmin: boolean }>();

export class AccessError extends Error {
    constructor(
        readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = 'AccessError';
    }
}

export function rejectWith(status: number, text: string): Promise<never> {
    const error: ResolverError = { status, statusText: text, text };
    return Promise.reject(error);
}

export function isBoardId(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

async function canViewBoard(boardId: number): Promise<boolean> {
    const response = await asUser().requestJira(route`/rest/agile/1.0/board/${boardId}`, { headers: { Accept: 'application/json' } });
    if (response.ok) {
        return true;
    }
    if (response.status === 403 || response.status === 404 || response.status === 401) {
        return false;
    }
    return rejectWith(response.status, 'Unable to verify the access to the board');
}

export async function ensureBoardAccess(boardId: unknown): Promise<number> {
    if (!isBoardId(boardId)) {
        return rejectWith(400, 'Invalid board');
    }
    if (!(await canViewBoard(boardId))) {
        return rejectWith(403, 'You do not have access to this board');
    }
    return boardId;
}

function remember<T>(cache: Map<string, T>, key: string, value: T) {
    if (cache.size >= memoryCacheLimit) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) {
            cache.delete(oldest);
        }
    }
    cache.set(key, value);
}

function freshEntries(cache: AccessCache | undefined, now: number): AccessCache {
    const fresh: AccessCache = {};
    Object.entries(cache || {}).forEach(([id, entry]) => {
        if (typeof entry?.at === 'number' && now - entry.at < (entry.ok ? accessCacheMs : deniedCacheMs)) {
            fresh[id] = entry;
        }
    });
    return fresh;
}

async function readCachedAccess(accountId: string, now: number): Promise<AccessCache> {
    const cached = memoryCache.get(accountId);
    if (cached) {
        return freshEntries(cached, now);
    }
    const stored = (await kvs.get(accessKeyPrefix + accountId)) as { entries?: AccessCache } | undefined;
    return freshEntries(stored?.entries, now);
}

async function checkEach(boardIds: number[]): Promise<AccessMap> {
    const result: AccessMap = {};
    for (let index = 0; index < boardIds.length; index += parallelChecks) {
        const batch = boardIds.slice(index, index + parallelChecks);
        const access = await Promise.all(batch.map(canViewBoard));
        batch.forEach((id, i) => (result[id] = access[i]));
    }
    return result;
}

async function listVisible(wanted: Set<number>): Promise<{ found: Set<number>; complete: boolean } | null> {
    const found = new Set<number>();
    for (let page = 0; page < maxListPages; page++) {
        const startAt = page * listPageSize;
        const response = await asUser().requestJira(route`/rest/agile/1.0/board?startAt=${startAt}&maxResults=${listPageSize}`, { headers: { Accept: 'application/json' } });
        if (!response.ok) {
            return null;
        }
        const body = (await response.json()) as BoardListPage;
        const values = Array.isArray(body.values) ? body.values : [];
        values.forEach((board) => isBoardId(board.id) && wanted.has(board.id) && found.add(board.id));
        if (found.size === wanted.size || body.isLast !== false || values.length < listPageSize) {
            return { found, complete: true };
        }
    }
    return { found, complete: false };
}

async function resolveAccess(boardIds: number[]): Promise<AccessMap> {
    if (boardIds.length <= directCheckLimit) {
        return checkEach(boardIds);
    }
    const listed = await listVisible(new Set(boardIds));
    if (!listed) {
        return checkEach(boardIds);
    }
    const result: AccessMap = {};
    boardIds.forEach((id) => listed.found.has(id) && (result[id] = true));
    const unresolved = boardIds.filter((id) => !listed.found.has(id));
    if (listed.complete) {
        unresolved.forEach((id) => (result[id] = false));
        return result;
    }
    return { ...result, ...(await checkEach(unresolved)) };
}

export async function getVisibleBoards(accountId: string | undefined, boardIds: Iterable<number>): Promise<Set<number>> {
    const ids = [...new Set(boardIds)].filter(isBoardId);
    if (!accountId || !ids.length) {
        return new Set();
    }
    const now = Date.now();
    const cached = await readCachedAccess(accountId, now);
    const unknown = ids.filter((id) => !cached[id]);
    let entries = cached;
    if (unknown.length) {
        const resolved = await resolveAccess(unknown);
        entries = { ...cached };
        unknown.forEach((id) => (entries[id] = { ok: resolved[id] === true, at: now }));
        memoryCache.delete(accountId);
        remember(memoryCache, accountId, entries);
        await kvs.set(accessKeyPrefix + accountId, { entries }, { ttl: { value: accessCacheMinutes, unit: 'MINUTES' } });
    }
    return new Set(ids.filter((id) => entries[id]?.ok));
}

/**
 * Jira has no read-only way to tell whether the user administers a board, so a small property is written as the user.
 * Jira answers 404 when the user may not change the board's properties.
 */
export async function isBoardAdmin(accountId: string | undefined, boardId: number): Promise<boolean> {
    if (!accountId) {
        return false;
    }
    const cacheKey = `${accountId}_${boardId}`;
    const cached = adminCache.get(cacheKey);
    if (cached && Date.now() - cached.at < accessCacheMs) {
        return cached.isAdmin;
    }
    const response = await asUser().requestJira(route`/rest/agile/1.0/board/${boardId}/properties/${adminProbeProperty}`, {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: true }),
    });
    if (!response.ok && response.status !== 403 && response.status !== 404 && response.status !== 401) {
        return rejectWith(response.status, 'Unable to verify the board permissions');
    }
    remember(adminCache, cacheKey, { at: Date.now(), isAdmin: response.ok });
    return response.ok;
}
