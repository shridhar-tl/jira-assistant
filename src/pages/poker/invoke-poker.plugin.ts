import { invoke } from '@forge/bridge';

import { defaultRetryPolicy, type PokerRetryPolicy } from 'planning-poker/contracts';

import { pokerResolverFunction, pokerTokenResolverFunction } from './forge/constants';
import type { PokerErrorCode, PokerRequest, PokerResponse } from './forge/protocol';
import { isRateLimitError, retryDelayMs, type RetryPolicy } from './forge/rate-limit';

export class PokerClientError extends Error {
    constructor(
        readonly code: PokerErrorCode,
        message: string,
    ) {
        super(message);
        this.name = 'PokerClientError';
    }

    get isRetryable(): boolean {
        return this.code === 'BUSY' || this.code === 'RATE_LIMITED';
    }
}

export interface InvokeHooks {
    onRetry?: (attempt: number) => void;
    onRecovered?: () => void;
    policy?: PokerRetryPolicy;
    sleep?: (ms: number) => Promise<void>;
}

function toRetryPolicy(policy: PokerRetryPolicy): RetryPolicy {
    return { maxAttempts: policy.maxAttempts, baseDelayMs: policy.baseDelayMs, maxDelayMs: policy.maxDelayMs, jitterRatio: policy.jitterRatio };
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function invokeOnce<T>(functionKey: string, payload: unknown): Promise<T> {
    let response: PokerResponse<T>;
    try {
        response = (await invoke(functionKey, payload as Record<string, unknown>)) as PokerResponse<T>;
    } catch (error) {
        if (isRateLimitError(error)) {
            throw new PokerClientError('BUSY', 'Atlassian is rate limiting Jira Assistant right now.');
        }
        throw error;
    }

    if (!response || typeof response !== 'object' || !('ok' in response)) {
        throw new PokerClientError('SERVER_ERROR', 'Planning poker returned an unexpected response.');
    }
    if (!response.ok) {
        throw new PokerClientError(response.code, response.message);
    }
    return response.data;
}

async function withClientRetry<T>(run: () => Promise<T>, hooks: InvokeHooks): Promise<T> {
    const policy = toRetryPolicy(hooks.policy ?? defaultRetryPolicy);
    const sleep = hooks.sleep ?? delay;
    let retried = false;

    for (let attempt = 1; ; attempt += 1) {
        try {
            const result = await run();
            if (retried) {
                hooks.onRecovered?.();
            }
            return result;
        } catch (error) {
            const retryable = error instanceof PokerClientError ? error.isRetryable : false;
            if (!retryable || attempt >= policy.maxAttempts) {
                throw error;
            }
            retried = true;
            hooks.onRetry?.(attempt);
            await sleep(retryDelayMs(attempt, policy));
        }
    }
}

export function callPoker<T>(request: PokerRequest, hooks: InvokeHooks = {}): Promise<T> {
    return withClientRetry(() => invokeOnce<T>(pokerResolverFunction, request), hooks);
}

export function callPokerToken<T>(roomId: string, hooks: InvokeHooks = {}): Promise<T> {
    return withClientRetry(() => invokeOnce<T>(pokerTokenResolverFunction, { roomId }), hooks);
}
