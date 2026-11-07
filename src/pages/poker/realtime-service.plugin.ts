import { realtime } from '@forge/bridge';

import type {
    ConnectionStatus,
    PokerRealtimeService,
    PokerSessionService,
    ServerMessageListener,
    StatusListener,
} from 'planning-poker/contracts';
import { defaultRetryPolicy } from 'planning-poker/contracts';
import type { RoomSnapshot } from 'planning-poker/shared/types/poker';
import type { ClientAction, ServerMessage } from 'planning-poker/shared/types/realtime';

import { degradedResyncMs, pokerChannelOf, rateLimitedActionMessage, recoveryMaxDelayMs, seenEventLimit } from './forge/constants';
import { isRealtimeBatch, type DispatchData, type RealtimeTokenData, type WireEvent } from './forge/protocol';
import { isRateLimitError, retryDelayMs } from './forge/rate-limit';
import { callPoker, callPokerToken, PokerClientError } from './invoke-poker.plugin';
import { decodeToken, encodeToken } from './session-service.plugin';

interface EnterData {
    snapshot: RoomSnapshot;
    token: RealtimeTokenData | null;
}

interface Subscription {
    unsubscribe: () => Promise<void>;
}

const tokenIssuePattern = /token|expired|permission/i;
const silentActions = new Set<ClientAction>(['heartbeat', 'exitRoom']);
const unreachableRoomMessage = 'Planning poker could not open this room right now. Please try again in a moment.';

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createForgeRealtimeService(session: PokerSessionService): PokerRealtimeService {
    const messageListeners = new Set<ServerMessageListener>();
    const statusListeners = new Set<StatusListener>();
    const seenEvents: string[] = [];
    const seenLookup = new Set<string>();

    let status: ConnectionStatus = 'idle';
    let activeRoom: string | null = null;
    let generation = 0;
    let subscription: Subscription | null = null;
    let degradedTimer: ReturnType<typeof setInterval> | null = null;
    let recovering = false;
    let token: RealtimeTokenData | null = null;
    let resyncing = false;

    function setStatus(next: ConnectionStatus) {
        if (status === next) {
            return;
        }
        status = next;
        statusListeners.forEach((listener) => {
            try {
                listener(next);
            } catch (error) {
                console.error('Poker status listener failed', error);
            }
        });
    }

    function emit(message: ServerMessage) {
        messageListeners.forEach((listener) => {
            try {
                listener(message);
            } catch (error) {
                console.error('Poker message listener failed', error);
            }
        });
    }

    function emitError(action: ClientAction | undefined, error: unknown) {
        if (error instanceof PokerClientError) {
            const rateLimited = error.isRetryable;
            emit({
                action: 'error',
                payload: { code: rateLimited ? 'RATE_LIMITED' : error.code, action, message: rateLimited ? rateLimitedActionMessage : error.message },
            });
            return;
        }
        console.error('Poker request failed', error);
        emit({ action: 'error', payload: { code: 'SERVER_ERROR', action, message: 'Something went wrong. Please try again.' } });
    }

    function alreadySeen(id: string | undefined): boolean {
        if (id === undefined) {
            return false;
        }
        if (seenLookup.has(id)) {
            return true;
        }
        seenLookup.add(id);
        seenEvents.push(id);
        if (seenEvents.length > seenEventLimit) {
            const evicted = seenEvents.shift();
            if (evicted !== undefined) {
                seenLookup.delete(evicted);
            }
        }
        return false;
    }

    function deliver(event: WireEvent) {
        const own = session.getSession()?.sid;
        if (event.forSid && event.forSid !== own) {
            return;
        }
        if (event.exceptSid && event.exceptSid === own) {
            return;
        }
        if (alreadySeen(event.id)) {
            return;
        }
        emit({ action: event.action, payload: event.payload, revision: event.revision });
    }

    function safeParse(raw: string): unknown {
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    function onRealtimeMessage(payload: unknown, error?: Error) {
        if (error) {
            console.error('Poker realtime subscription reported an error', error);
            markSubscriptionLost();
            return;
        }
        const body = typeof payload === 'string' ? safeParse(payload) : payload;
        if (!isRealtimeBatch(body) || body.roomId !== activeRoom) {
            return;
        }
        body.events.forEach((event) => deliver(event));
    }

    function storeToken(next: RealtimeTokenData | null) {
        token = next;
        const current = session.getSession();
        if (current && next) {
            session.store({ token: encodeToken(next), sid: current.sid, roomId: current.roomId, role: current.role, expiresAt: current.expiresAt }, current.name);
        }
    }

    async function ensureToken(roomId: string, forceRefresh: boolean): Promise<RealtimeTokenData | null> {
        const nowSeconds = Date.now() / 1000;
        const cached = token ?? decodeToken(session.sessionFor(roomId)?.token ?? '');
        if (!forceRefresh && cached && cached.expiresAt - 120 > nowSeconds) {
            token = cached;
            return cached;
        }
        try {
            storeToken(await callPokerToken<RealtimeTokenData | null>(roomId));
        } catch (error) {
            console.error('Poker realtime token could not be refreshed', error);
        }
        return token;
    }

    async function subscribe(roomId: string, run: number): Promise<boolean> {
        const policy = defaultRetryPolicy;
        let forceRefresh = false;

        for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
            if (run !== generation) {
                return false;
            }
            try {
                const current = await ensureToken(roomId, forceRefresh);
                const created = (await realtime.subscribe(pokerChannelOf(roomId), onRealtimeMessage, current ? { token: current.token } : undefined)) as Subscription;
                if (run !== generation) {
                    await created.unsubscribe().catch(() => undefined);
                    return false;
                }
                subscription = created;
                return true;
            } catch (error) {
                console.error(`Poker subscribe attempt ${attempt} failed`, error);
                forceRefresh = !isRateLimitError(error) && tokenIssuePattern.test(String((error as Error)?.message ?? error));
                setStatus('degraded');
                if (attempt < policy.maxAttempts) {
                    await delay(retryDelayMs(attempt, policy));
                }
            }
        }
        return false;
    }

    function stopDegradedPolling() {
        if (degradedTimer !== null) {
            clearInterval(degradedTimer);
            degradedTimer = null;
        }
    }

    function startDegradedPolling(run: number) {
        if (degradedTimer !== null) {
            return;
        }
        degradedTimer = setInterval(() => {
            if (run !== generation) {
                stopDegradedPolling();
                return;
            }
            void resync();
        }, degradedResyncMs);
    }

    async function recoverSubscription(roomId: string, run: number) {
        if (recovering) {
            return;
        }
        recovering = true;
        try {
            for (let round = 1; run === generation; round += 1) {
                if (await subscribe(roomId, run)) {
                    stopDegradedPolling();
                    setStatus('connected');
                    await resync();
                    return;
                }
                await delay(Math.min(retryDelayMs(round, defaultRetryPolicy) * 2, recoveryMaxDelayMs));
            }
        } finally {
            recovering = false;
        }
    }

    function markSubscriptionLost() {
        const roomId = activeRoom;
        const current = subscription;
        subscription = null;
        if (current) {
            current.unsubscribe().catch(() => undefined);
        }
        if (roomId === null) {
            return;
        }
        setStatus('degraded');
        startDegradedPolling(generation);
        void resync();
        void recoverSubscription(roomId, generation);
    }

    async function resync() {
        if (resyncing || activeRoom === null) {
            return;
        }
        resyncing = true;
        try {
            await send('requestResync');
        } finally {
            resyncing = false;
        }
    }

    async function start(roomId: string, run: number) {
        if (session.sessionFor(roomId) === null) {
            setStatus('closed');
            return;
        }

        const subscribed = await subscribe(roomId, run);
        if (run !== generation) {
            return;
        }

        try {
            const entered = await callPoker<EnterData>(
                { operation: 'enterRoom', roomId },
                { onRetry: () => setStatus('degraded'), onRecovered: () => undefined },
            );
            if (run !== generation) {
                return;
            }
            storeToken(entered.token);
            emit({ action: 'roomState', payload: entered.snapshot, revision: entered.snapshot.room.revision });
        } catch (error) {
            if (run !== generation) {
                return;
            }
            console.error('Poker could not enter the room', error);
            const reason = error instanceof PokerClientError && !error.isRetryable ? error.message : unreachableRoomMessage;
            emit({ action: 'authResult', payload: { ok: false, error: reason } });
            setStatus('closed');
            return;
        }

        if (subscribed) {
            setStatus('connected');
        } else {
            setStatus('degraded');
            startDegradedPolling(run);
            void recoverSubscription(roomId, run);
        }
    }

    async function sendSilent(roomId: string, action: ClientAction): Promise<boolean> {
        try {
            const attempts = action === 'exitRoom' ? 1 : 2;
            const data = await callPoker<DispatchData>({ operation: 'dispatch', roomId, action, payload: {} }, { policy: { ...defaultRetryPolicy, maxAttempts: attempts } });
            if (action === 'heartbeat') {
                emit({ action: 'heartbeatResult', payload: data.result });
            }
            data.events.forEach((event) => deliver(event));
            return true;
        } catch (error) {
            console.error(`Poker ${action} failed`, error);
            return false;
        }
    }

    async function send<TPayload>(action: ClientAction, payload?: TPayload): Promise<boolean> {
        const roomId = activeRoom ?? session.getSession()?.roomId ?? null;
        if (roomId === null) {
            if (!silentActions.has(action)) {
                emitError(action, new PokerClientError('FORBIDDEN', 'You are not in a poker room.'));
            }
            return false;
        }

        if (silentActions.has(action)) {
            return await sendSilent(roomId, action);
        }

        const wasConnected = status === 'connected';
        try {
            const data = await callPoker<DispatchData>(
                { operation: 'dispatch', roomId, action, payload: (payload ?? {}) as Record<string, unknown> },
                {
                    onRetry: () => setStatus('degraded'),
                    onRecovered: () => {
                        if (wasConnected && subscription !== null) {
                            setStatus('connected');
                        }
                    },
                },
            );

            if (action === 'requestResync') {
                const snapshot = data.result as RoomSnapshot;
                emit({ action: 'roomState', payload: snapshot, revision: snapshot.room.revision });
                if (data.token) {
                    storeToken(data.token);
                }
            }
            data.events.forEach((event) => deliver(event));
            return true;
        } catch (error) {
            emitError(action, error);
            if (wasConnected && subscription !== null) {
                setStatus('connected');
            }
            return false;
        }
    }

    function teardown() {
        generation += 1;
        stopDegradedPolling();
        const current = subscription;
        subscription = null;
        if (current) {
            current.unsubscribe().catch((error) => console.error('Poker unsubscribe failed', error));
        }
        token = null;
        resyncing = false;
        recovering = false;
    }

    return {
        connect(roomId) {
            if (activeRoom === roomId && (status === 'connecting' || status === 'connected' || status === 'degraded')) {
                return;
            }
            teardown();
            activeRoom = roomId;
            setStatus('connecting');
            void start(roomId, generation);
        },

        disconnect(intentional = true) {
            teardown();
            if (intentional) {
                activeRoom = null;
                setStatus('closed');
            }
        },

        send,

        requestResync() {
            void resync();
        },

        onMessage(listener) {
            messageListeners.add(listener);
            return () => messageListeners.delete(listener);
        },

        onStatusChange(listener) {
            statusListeners.add(listener);
            return () => statusListeners.delete(listener);
        },

        getStatus() {
            return status;
        },
    };
}
