import { Filter, FilterConditions, kvs, MetadataField, Sort } from '@forge/kvs';

import { batchGetChunkSize, roomLifetimeHours, serverRetry } from '../constants';
import { isRateLimitError, withRateLimitRetry } from '../rate-limit';

export type ConditionOperator = 'equalTo' | 'notEqualTo' | 'exists' | 'notExists';

export interface EntityCondition {
    field: string;
    operator: ConditionOperator;
    value?: string | number | boolean;
}

export type TransactionOperation =
    | { kind: 'set'; entity: string; key: string; value: Record<string, unknown>; when?: EntityCondition[]; ttl?: boolean }
    | { kind: 'delete'; entity: string; key: string; when?: EntityCondition[] }
    | { kind: 'check'; entity: string; key: string; when: EntityCondition[] };

export interface IndexQuery {
    entity: string;
    index: string;
    partition: Array<string | number | boolean>;
    descending?: boolean;
    limit: number;
}

export class ConditionFailedError extends Error {
    constructor(message = 'A storage condition was not met.') {
        super(message);
        this.name = 'ConditionFailedError';
    }
}

export interface EntityGateway {
    get<T extends Record<string, unknown>>(entity: string, key: string): Promise<T | undefined>;
    batchGet<T extends Record<string, unknown>>(entity: string, keys: string[]): Promise<Map<string, T>>;
    set(entity: string, key: string, value: Record<string, unknown>, options?: { ttl?: boolean }): Promise<void>;
    delete(entity: string, key: string): Promise<void>;
    transact(operations: TransactionOperation[]): Promise<void>;
    query<T extends Record<string, unknown>>(query: IndexQuery): Promise<T[]>;
}

const conditionFailurePattern = /condition|check.*fail|precondition|already exists/i;

function failureText(error: unknown): string {
    if (typeof error !== 'object' || error === null) {
        return String(error);
    }
    const record = error as Record<string, unknown>;
    return `${String(record.code ?? '')} ${String(record.message ?? '')}`;
}

function buildFilter(conditions: EntityCondition[]) {
    const clause = (condition: EntityCondition) => {
        switch (condition.operator) {
            case 'equalTo':
                return FilterConditions.equalTo(condition.value as string | number | boolean);
            case 'notEqualTo':
                return FilterConditions.notEqualTo(condition.value as string | number | boolean);
            case 'exists':
                return FilterConditions.exists();
            case 'notExists':
                return FilterConditions.notExists();
        }
    };

    const [first, ...rest] = conditions;
    const filter = new Filter<Record<string, unknown>>().and(first.field, clause(first));
    for (const condition of rest) {
        filter.and(condition.field, clause(condition));
    }
    return filter;
}

const ttlOption = { ttl: { value: roomLifetimeHours, unit: 'HOURS' as const } };

function wrapFailure(error: unknown): never {
    if (isRateLimitError(error)) {
        throw error;
    }
    if (conditionFailurePattern.test(failureText(error))) {
        throw new ConditionFailedError(failureText(error));
    }
    throw error;
}

export function createForgeEntityGateway(): EntityGateway {
    const retry = <T>(run: () => Promise<T>) => withRateLimitRetry(run, serverRetry);

    return {
        async get<T extends Record<string, unknown>>(entity: string, key: string) {
            return await retry(() => kvs.entity<T>(entity).get(key));
        },

        async batchGet<T extends Record<string, unknown>>(entity: string, keys: string[]) {
            const found = new Map<string, T>();
            for (let index = 0; index < keys.length; index += batchGetChunkSize) {
                const chunk = keys.slice(index, index + batchGetChunkSize);
                const result = await retry(() => kvs.batchGet<T>(chunk.map((key) => ({ key, entityName: entity }))));
                for (const item of result.successfulKeys) {
                    found.set(item.key, item.value);
                }
                const failed = result.failedKeys.find((item) => isRateLimitError(item.error));
                if (failed) {
                    throw failed.error;
                }
            }
            return found;
        },

        async set(entity, key, value, options) {
            await retry(() => kvs.entity<Record<string, unknown>>(entity).set(key, value, options?.ttl === false ? undefined : ttlOption));
        },

        async delete(entity, key) {
            await retry(() => kvs.entity<Record<string, unknown>>(entity).delete(key));
        },

        async transact(operations) {
            await retry(async () => {
                const builder = kvs.transact();
                for (const operation of operations) {
                    if (operation.kind === 'set') {
                        builder.set(
                            operation.key,
                            operation.value,
                            { entityName: operation.entity, conditions: operation.when?.length ? buildFilter(operation.when) : undefined },
                            operation.ttl === false ? undefined : ttlOption,
                        );
                    } else if (operation.kind === 'delete') {
                        builder.delete(operation.key, { entityName: operation.entity, conditions: operation.when?.length ? buildFilter(operation.when) : undefined });
                    } else {
                        builder.check(operation.key, { entityName: operation.entity, conditions: buildFilter(operation.when) });
                    }
                }
                try {
                    await builder.execute();
                } catch (error) {
                    wrapFailure(error);
                }
            });
        },

        async query<T extends Record<string, unknown>>(query: IndexQuery) {
            return await retry(async () => {
                const builder = kvs
                    .entity<T>(query.entity)
                    .query({ metadataFields: [MetadataField.EXPIRE_TIME] })
                    .index(query.index, { partition: query.partition })
                    .sort(query.descending ? Sort.DESC : Sort.ASC)
                    .limit(query.limit);
                const result = await builder.getMany();
                return result.results.map((item) => item.value);
            });
        },
    };
}
