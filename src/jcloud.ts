import { asUser } from '@forge/api';
import { kvs, WhereConditions } from '@forge/kvs';
import Resolver from '@forge/resolver';

import { registerPlannerResolvers } from './pages/planning/forge/planner-resolvers';
import { registerPokerResolvers } from './pages/poker/forge/server';

interface StoragePayload {
    action: unknown;
    args: unknown;
}

interface EventsPayload {
    eventsUrl: unknown;
}

const resolver = new Resolver();

const storageCategoryPattern = /^[A-Za-z0-9_.-]{1,64}$/;
const maxStorageValueBytes = 64 * 1024;
const maxStorageKeysPerUser = 50;
const storageActions = { get: 0, set: 1, remove: -1 } as const;
const graphOrigin = 'https://graph.microsoft.com';
const graphPathPattern =
    /^\/v1\.0\/(me|users\/[A-Za-z0-9@._%-]{1,256}|users\('[A-Za-z0-9@._%-]{1,256}'\))\/+(calendar\/calendarView|calendars|calendars\/[A-Za-z0-9=_+%-]{1,512}\/calendarView|calendars\('[A-Za-z0-9=_+%/-]{1,512}'\)\/calendarView)$/;

function rejectRequest(status: number, text: string): Promise<never> {
    return Promise.reject({ status, statusText: text, text });
}

function storageKeyOf(accountId: unknown, category: unknown): string | null {
    if (typeof accountId !== 'string' || !accountId || typeof category !== 'string' || !storageCategoryPattern.test(category)) {
        return null;
    }
    return `${accountId}_${category}`;
}

function jsonSize(value: unknown): number {
    const json = JSON.stringify(value);
    return json === undefined ? 0 : Buffer.byteLength(json, 'utf8');
}

async function countUserKeys(prefix: string): Promise<number> {
    const result = await kvs
        .query()
        .where('key', WhereConditions.beginsWith(prefix))
        .limit(maxStorageKeysPerUser + 1)
        .getMany();
    return result.results.length;
}

async function writeStorage(key: string, prefix: string, value: unknown): Promise<void> {
    if (value === undefined || jsonSize(value) > maxStorageValueBytes) {
        return rejectRequest(413, 'The value is too large to be stored.');
    }
    if ((await kvs.get(key)) === undefined && (await countUserKeys(prefix)) >= maxStorageKeysPerUser) {
        return rejectRequest(429, 'Too many values are stored for this user.');
    }
    await kvs.set(key, value);
}

resolver.define('StorageService', (req) => {
    const { action, args } = (req.payload || {}) as unknown as StoragePayload;
    const [category, value] = Array.isArray(args) ? args : [];
    const accountId = req.context.accountId as unknown;
    const key = storageKeyOf(accountId, category);
    if (!key) {
        return rejectRequest(400, 'Invalid storage request');
    }

    if (action === storageActions.set) {
        return writeStorage(key, `${accountId as string}_`, value);
    } else if (action === storageActions.get) {
        return kvs.get(key);
    } else if (action === storageActions.remove) {
        return kvs.delete(key);
    }

    return rejectRequest(400, 'Unknown storage action');
});

function toGraphEventsUrl(value: unknown): string | null {
    if (typeof value !== 'string' || value.length > 4096) {
        return null;
    }
    try {
        const url = new URL(value);
        return url.origin === graphOrigin && !url.username && !url.password && graphPathPattern.test(url.pathname) ? url.href : null;
    } catch {
        return null;
    }
}

resolver.define('AuthenticateMSO', async () => {
    const mso = asUser().withProvider('mso', 'ms-apis');
    if (!(await mso.hasCredentials())) {
        await mso.requestCredentials();
    }
    return true;
});

resolver.define('GetMSOEvents', async (req) => {
    const eventsUrl = toGraphEventsUrl(((req.payload || {}) as unknown as EventsPayload).eventsUrl);
    if (!eventsUrl) {
        return rejectRequest(400, 'Invalid calendar request');
    }

    const mso = asUser().withProvider('mso', 'ms-apis');
    if (!(await mso.hasCredentials())) {
        await mso.requestCredentials();
    }

    const response = await mso.fetch(eventsUrl);
    if (response.ok) {
        return response.json();
    }

    return Promise.reject({
        status: response.status,
        statusText: response.statusText,
        text: await response.text(),
    });
});

registerPokerResolvers(resolver);
registerPlannerResolvers(resolver);

export const handler = resolver.getDefinitions();
