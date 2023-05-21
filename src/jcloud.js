import Resolver from '@forge/resolver';
import { storage, asUser, asApp } from '@forge/api';

const resolver = new Resolver();

resolver.define('StorageService', (req) => {
    const {
        payload: { action, args: [category, value] },
        context: { accountId }
    } = req;

    const key = `${accountId}_${category}`;

    if (action === 1) {
        return storage.set(key, value);
    } else if (action === 0) {
        return storage.get(key);
    } else if (action === -1) {
        return storage.delete(key);
    }

    return Promise.reject(`Unknown action:-${action}`);
});

resolver.define('AuthenticateMSO', async () => {
    const mso = asUser().withProvider('mso', 'ms-apis');
    if (!await mso.hasCredentials()) {
        await mso.requestCredentials();
    }
    return true;
});

resolver.define('GetMSOEvents', async (req) => {
    const mso = asUser().withProvider('mso', 'ms-apis');
    if (!await mso.hasCredentials()) {
        await mso.requestCredentials();
    }

    const { payload: { eventsUrl } } = req;

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

resolver.define('VelocityChart', async (req) => {
    const { payload: { boardId } } = req;
    const response = await asApp.fetch(`/rest/greenhopper/1.0/rapid/charts/velocity?rapidViewId=${boardId}`);

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
