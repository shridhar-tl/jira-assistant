import { fallbackTokenLifetimeSeconds, pokerChannelOf, realtimeTokenRefreshMarginSeconds, serverRetry } from '../constants';
import type { RealtimeBatch, RealtimeTokenData, WireEvent } from '../protocol';
import { BusyError, hasRateLimitErrors, isRateLimitError, withRateLimitRetry, type RetryHooks } from '../rate-limit';

export interface RealtimePublishResult {
    errors?: unknown;
}

export interface RealtimeSignResult {
    token: string | null;
    expiresAt: unknown;
    errors?: unknown;
}

export interface RealtimeApi {
    publish(channel: string, payload: RealtimeBatch, options?: { token?: string }): Promise<RealtimePublishResult>;
    signToken(channel: string, claims: Record<string, unknown>, permissions: Array<'subscribe' | 'publish'>): Promise<RealtimeSignResult>;
}

export interface RealtimePublisher {
    publishEvents(roomId: string, events: WireEvent[]): Promise<boolean>;
    subscribeToken(roomId: string): Promise<RealtimeTokenData | null>;
}

interface PublisherOptions {
    api: RealtimeApi;
    now?: () => number;
    hooks?: RetryHooks;
}

class RealtimeRateLimited extends Error {}

const millisecondThreshold = 1e11;

function jwtExpiry(token: string): number | null {
    const segment = token.split('.')[1];
    if (!segment) {
        return null;
    }
    try {
        const claims = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as { exp?: unknown };
        return typeof claims.exp === 'number' && Number.isFinite(claims.exp) ? claims.exp : null;
    } catch {
        return null;
    }
}

export function tokenExpirySeconds(token: string, raw: unknown, nowMs: number): number {
    const fromJwt = jwtExpiry(token);
    if (fromJwt !== null) {
        return fromJwt;
    }
    const numeric = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw)) ? Number(raw) : null;
    if (numeric !== null) {
        return numeric > millisecondThreshold ? Math.floor(numeric / 1000) : numeric;
    }
    if (typeof raw === 'string') {
        const parsed = Date.parse(raw);
        if (Number.isFinite(parsed)) {
            return Math.floor(parsed / 1000);
        }
    }
    return Math.floor(nowMs / 1000) + fallbackTokenLifetimeSeconds;
}

export function createRealtimePublisher({ api, now = () => Date.now(), hooks }: PublisherOptions): RealtimePublisher {
    const publishTokens = new Map<string, RealtimeTokenData>();
    const subscribeTokens = new Map<string, RealtimeTokenData>();

    const claimsOf = (roomId: string) => ({ roomId });

    function isFresh(token: RealtimeTokenData | undefined): token is RealtimeTokenData {
        return token !== undefined && token.expiresAt - realtimeTokenRefreshMarginSeconds > now() / 1000;
    }

    async function mint(cache: Map<string, RealtimeTokenData>, roomId: string, permission: 'subscribe' | 'publish'): Promise<RealtimeTokenData | null> {
        const cached = cache.get(roomId);
        if (isFresh(cached)) {
            return cached;
        }

        try {
            const result = await withRateLimitRetry(
                async () => {
                    const signed = await api.signToken(pokerChannelOf(roomId), claimsOf(roomId), [permission]);
                    if (hasRateLimitErrors(signed.errors)) {
                        throw new RealtimeRateLimited('RATE_LIMIT_EXCEEDED');
                    }
                    return signed;
                },
                serverRetry,
                hooks,
            );
            if (!result.token) {
                return null;
            }
            const token = { token: result.token, expiresAt: tokenExpirySeconds(result.token, result.expiresAt, now()) };
            cache.set(roomId, token);
            return token;
        } catch (error) {
            if (error instanceof BusyError || isRateLimitError(error)) {
                return null;
            }
            console.error('[poker] realtime token could not be created', error);
            return null;
        }
    }

    return {
        async publishEvents(roomId, events) {
            if (events.length === 0) {
                return true;
            }

            const token = await mint(publishTokens, roomId, 'publish');
            const batch: RealtimeBatch = { roomId, events };

            try {
                return await withRateLimitRetry(
                    async () => {
                        const result = await api.publish(pokerChannelOf(roomId), batch, token ? { token: token.token } : undefined);
                        if (hasRateLimitErrors(result.errors)) {
                            throw new RealtimeRateLimited('RATE_LIMIT_EXCEEDED');
                        }
                        if (Array.isArray(result.errors) && result.errors.length > 0) {
                            console.error('[poker] realtime publish reported errors', result.errors);
                            return false;
                        }
                        return true;
                    },
                    serverRetry,
                    hooks,
                );
            } catch (error) {
                console.error('[poker] realtime publish failed after the change was saved', error);
                return false;
            }
        },

        async subscribeToken(roomId) {
            return await mint(subscribeTokens, roomId, 'subscribe');
        },
    };
}
