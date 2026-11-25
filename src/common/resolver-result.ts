import type Resolver from '@forge/resolver';
import type { Request } from '@forge/resolver';

export type ResolverResult<T> = { ok: true; value: T } | { ok: false; status: number; message: string };

/** A refusal reported to the caller with its status and reason. Forge hides both when a resolver throws, so resolvers return it as a result instead. */
export class ResolverError extends Error {
    constructor(
        readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = 'ResolverError';
    }
}

export function rejectWith(status: number, message: string): Promise<never> {
    return Promise.reject(new ResolverError(status, message));
}

export function defineResolver<T>(resolver: Resolver, functionKey: string, handler: (request: Request) => Promise<T> | T): void {
    resolver.define(functionKey, async (request: Request): Promise<ResolverResult<T>> => {
        try {
            return { ok: true, value: await handler(request) };
        } catch (error) {
            if (error instanceof ResolverError) {
                return { ok: false, status: error.status, message: error.message };
            }
            throw error;
        }
    });
}
