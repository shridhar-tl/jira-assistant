import { inject } from '@services';

const cachePrefix = 'jaPlanner_';
const runningRequests = new Map<string, Promise<unknown>>();
let isExpiredCacheRemoved = false;

function removeExpiredCache(): void {
    if (isExpiredCacheRemoved) {
        return;
    }
    isExpiredCacheRemoved = true;
    const { $cache } = inject('CacheService');
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(cachePrefix)) {
            keys.push(key);
        }
    }
    for (const key of keys) {
        try {
            if ($cache.get(key) === null) {
                localStorage.removeItem(key);
            }
        } catch {
            localStorage.removeItem(key);
        }
    }
}

function getScopedKey(key: string): string {
    const { $session } = inject('SessionService');
    return `${cachePrefix}${$session.userId || 0}_${key}`;
}

function expiryDate(ttlMinutes: number): Date {
    return new Date(Date.now() + ttlMinutes * 60000);
}

export function readCache<T>(key: string): T | null {
    const { $cache } = inject('CacheService');
    return ($cache.get(getScopedKey(key)) as T | null) ?? null;
}

export function writeCache<T>(key: string, value: T, ttlMinutes: number): void {
    const { $cache } = inject('CacheService');
    removeExpiredCache();
    try {
        $cache.set(getScopedKey(key), value, expiryDate(ttlMinutes));
    } catch (err) {
        console.warn('Unable to cache planner data', key, err);
    }
}

export function removeCache(key: string): void {
    const { $cache } = inject('CacheService');
    $cache.remove(getScopedKey(key));
}

export async function getCached<T>(key: string, ttlMinutes: number, loader: () => Promise<T>, force?: boolean): Promise<T> {
    if (!force) {
        const cached = readCache<T>(key);
        if (cached !== null && cached !== undefined) {
            return cached;
        }
    }

    const scopedKey = getScopedKey(key);
    const running = runningRequests.get(scopedKey) as Promise<T> | undefined;
    if (running) {
        return running;
    }

    const request = loader()
        .then((value) => {
            writeCache(key, value, ttlMinutes);
            return value;
        })
        .finally(() => runningRequests.delete(scopedKey));

    runningRequests.set(scopedKey, request);
    return request;
}

export function clearPlannerCache(keyPrefixes: string[]): void {
    const { $session } = inject('SessionService');
    const prefixes = keyPrefixes.map((p) => `${cachePrefix}${$session.userId || 0}_${p}`);

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && prefixes.some((p) => key.startsWith(p))) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
}
