import { asUser } from '@forge/api';
import { kvs } from '@forge/kvs';
import Resolver from '@forge/resolver';

type StorageValue = string | number | boolean | Record<string, any> | any[];

const resolver = new Resolver();

resolver.define('StorageService', (req) => {
    const { payload, context } = req;
    const {
        action,
        args: [category, value],
    } = payload as { action: number; args: [string, unknown] };
    const accountId = context.accountId as string;

    const key = `${accountId}_${category}`;

    if (action === 1) {
        return kvs.set(key, value as StorageValue);
    } else if (action === 0) {
        return kvs.get(key);
    } else if (action === -1) {
        return kvs.delete(key);
    }

    return Promise.reject(`Unknown action:-${action}`);
});

resolver.define('AuthenticateMSO', async () => {
    const mso = asUser().withProvider('mso', 'ms-apis');
    if (!(await mso.hasCredentials())) {
        await mso.requestCredentials();
    }
    return true;
});

resolver.define('GetMSOEvents', async (req) => {
    const mso = asUser().withProvider('mso', 'ms-apis');
    if (!(await mso.hasCredentials())) {
        await mso.requestCredentials();
    }

    const { eventsUrl } = req.payload as { eventsUrl: string };

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

export const handler = resolver.getDefinitions();
