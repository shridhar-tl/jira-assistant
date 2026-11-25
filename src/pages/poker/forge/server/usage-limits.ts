import { kvs } from '@forge/kvs';

import { EngineError, type RateLimiterPort } from './poker-engine';

export interface UsageLimiter extends RateLimiterPort {
    consume(bucketKey: string, amount: number, limit: number, message: string): Promise<void>;
}

const windowMinutes = 60;
const windowMs = windowMinutes * 60000;
const keyPrefix = 'poker-usage-';
const unsafeKeyChars = /[^A-Za-z0-9:._#-]/g;

interface UsageWindow {
    count: number;
}

/**
 * Hourly counters per user in app storage. They are not transactional, so a burst of parallel calls can pass the limit by a few,
 * which is fine for keeping one user from using up the storage and invocation quota of the whole site.
 */
export function createUsageLimiter(now: () => number = () => Date.now()): UsageLimiter {
    async function consume(bucketKey: string, amount: number, limit: number, message: string): Promise<void> {
        const windowStart = Math.floor(now() / windowMs);
        const key = `${keyPrefix}${bucketKey.replace(unsafeKeyChars, '_')}-${windowStart}`;
        const current = ((await kvs.get(key)) as UsageWindow | undefined)?.count ?? 0;
        if (current + amount > limit) {
            throw new EngineError('CONFLICT', message);
        }
        await kvs.set(key, { count: current + amount }, { ttl: { value: windowMinutes * 2, unit: 'MINUTES' } });
    }

    return {
        consume,
        enforce(bucketKey, limit, message) {
            return consume(bucketKey, 1, limit, message);
        },
    };
}
