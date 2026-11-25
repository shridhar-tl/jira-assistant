import { Filter, FilterConditions, kvs } from '@forge/kvs';

import { isConditionFailure } from '../../../../common/kvs-condition';
import { casRetry } from '../constants';
import { BusyError, retryDelayMs } from '../rate-limit';

import { EngineError, type RateLimiterPort } from './poker-engine';

export interface UsageLimiter extends RateLimiterPort {
    consume(bucketKey: string, amount: number, limit: number, message: string): Promise<void>;
}

const windowMinutes = 60;
const windowMs = windowMinutes * 60000;
const usageEntity = 'poker-usage';
const unsafeKeyChars = /[^A-Za-z0-9:._#-]/g;
const windowOptions = { ttl: { value: windowMinutes * 2, unit: 'MINUTES' as const } };

interface UsageWindow {
    count: number;
}

/** Hourly counters per user. Each increment is conditional on the count that was read, so parallel calls cannot pass the limit. */
export function createUsageLimiter(now: () => number = () => Date.now()): UsageLimiter {
    async function consume(bucketKey: string, amount: number, limit: number, message: string): Promise<void> {
        const key = `${bucketKey.replace(unsafeKeyChars, '_')}-${Math.floor(now() / windowMs)}`;
        for (let attempt = 1; attempt <= casRetry.maxAttempts; attempt += 1) {
            const count = (await kvs.entity<UsageWindow>(usageEntity).get(key))?.count;
            if ((count ?? 0) + amount > limit) {
                throw new EngineError('CONFLICT', message);
            }
            const conditions = new Filter<UsageWindow>().and('count', count === undefined ? FilterConditions.notExists() : FilterConditions.equalTo(count));
            try {
                await kvs.transact().set<UsageWindow>(key, { count: (count ?? 0) + amount }, { entityName: usageEntity, conditions }, windowOptions).execute();
                return;
            } catch (error) {
                if (!isConditionFailure(error)) {
                    throw error;
                }
                await new Promise((resolve) => setTimeout(resolve, retryDelayMs(attempt, casRetry)));
            }
        }
        throw new BusyError('The room is busy. Please retry.');
    }

    return {
        consume,
        enforce(bucketKey, limit, message) {
            return consume(bucketKey, 1, limit, message);
        },
    };
}
