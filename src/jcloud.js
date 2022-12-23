import Resolver from '@forge/resolver';
import { storage } from '@forge/api';

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

export const handler = resolver.getDefinitions();
