export interface RetryPolicy {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    jitterRatio: number;
}

export interface RetryHooks {
    sleep?: (ms: number) => Promise<void>;
    random?: () => number;
    onRetry?: (attempt: number, delayMs: number) => void;
}

const rateLimitPattern = /rate[_\s-]?limit|too[_\s-]?many[_\s-]?requests|throttl/i;

function textOf(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'object' && value !== null) {
        const record = value as Record<string, unknown>;
        return [record.code, record.message, record.status, record.statusText].map((part) => (part === undefined ? '' : String(part))).join(' ');
    }
    return '';
}

export function isRateLimitError(error: unknown): boolean {
    if (typeof error === 'object' && error !== null) {
        const record = error as Record<string, unknown>;
        if (record.status === 429 || record.statusCode === 429) {
            return true;
        }
        const details = record.responseDetails as Record<string, unknown> | undefined;
        if (details?.status === 429) {
            return true;
        }
    }
    return rateLimitPattern.test(textOf(error));
}

export function hasRateLimitErrors(errors: unknown): boolean {
    if (!Array.isArray(errors)) {
        return false;
    }
    return errors.some((entry) => rateLimitPattern.test(textOf(entry)));
}

export class BusyError extends Error {
    constructor(message: string, readonly cause?: unknown) {
        super(message);
        this.name = 'BusyError';
    }
}

export function retryDelayMs(attempt: number, policy: RetryPolicy, random: () => number = Math.random): number {
    const exponential = Math.min(policy.baseDelayMs * 2 ** (attempt - 1), policy.maxDelayMs);
    const jitter = exponential * policy.jitterRatio * (random() * 2 - 1);
    return Math.max(0, Math.round(exponential + jitter));
}

function defaultSleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRateLimitRetry<T>(run: () => Promise<T>, policy: RetryPolicy, hooks: RetryHooks = {}): Promise<T> {
    const sleep = hooks.sleep ?? defaultSleep;
    let attempt = 1;

    for (;;) {
        try {
            return await run();
        } catch (error) {
            if (!isRateLimitError(error)) {
                throw error;
            }
            if (attempt >= policy.maxAttempts) {
                throw new BusyError('The request was rate limited and retries were exhausted.', error);
            }
            const delay = retryDelayMs(attempt, policy, hooks.random);
            hooks.onRetry?.(attempt, delay);
            await sleep(delay);
            attempt += 1;
        }
    }
}
