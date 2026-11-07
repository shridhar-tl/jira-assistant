import { bulkJoinBatchSize, busyMessage, directoryLimit, forgeEngineDefaults, hostAwayGraceMs } from '../constants';
import type { DispatchData, PokerErrorCode, PokerRequest, PokerResponse, RealtimeTokenData, SessionData, WireEvent } from '../protocol';
import { BusyError, isRateLimitError } from '../rate-limit';
import type { ForgePokerAdapter } from './forge-room-store';
import {
    createEngine,
    defaultEngineConfig,
    EngineError,
    normalizeUserRef,
    optionalHttpUrl,
    parseAvatarId,
    parseScoreType,
    requireRoomId,
    requireText,
    toRoom,
    type Engine,
    type EngineEvent,
    type JoinOutcome,
} from './poker-engine';
import type { RealtimePublisher } from './realtime-publisher';

export interface PokerCallContext {
    accountId?: string;
}

export interface PokerHandlerDeps {
    adapter: ForgePokerAdapter;
    publisher: RealtimePublisher;
    now?: () => Date;
}

type Payload = Record<string, unknown>;

const missingUserMessage = 'Planning poker needs a signed-in Jira user.';
const notMemberMessage = 'You are not a member of this room.';

function payloadOf(request: PokerRequest): Payload {
    return typeof request.payload === 'object' && request.payload !== null ? request.payload : {};
}

function failure(code: PokerErrorCode, message: string): PokerResponse<never> {
    return { ok: false, code, message };
}

function toFailure(error: unknown): PokerResponse<never> {
    if (error instanceof EngineError) {
        return failure(error.code, error.message);
    }
    if (error instanceof BusyError || isRateLimitError(error)) {
        return failure('BUSY', busyMessage);
    }
    console.error('[poker] unexpected failure', error);
    return failure('SERVER_ERROR', 'Something went wrong. Please try again.');
}

export function createPokerEngine(adapter: ForgePokerAdapter, now?: () => Date): Engine {
    return createEngine({
        store: adapter.store,
        invitations: adapter.invitations,
        directory: adapter.directory,
        presence: adapter.presence,
        now,
        config: {
            ...defaultEngineConfig,
            directoryEnabled: true,
            invitationsEnabled: true,
            defaultAccess: { requireApproval: forgeEngineDefaults.requireApproval, listed: forgeEngineDefaults.listed },
            hostAwayGraceMs,
            bulkJoinBatchSize,
            directoryLimit,
        },
    });
}

export function createPokerHandlers({ adapter, publisher, now }: PokerHandlerDeps) {
    const engine = createPokerEngine(adapter, now);
    const clock = () => (now ? now() : new Date());

    function requireAccount(context: PokerCallContext): string {
        if (!context.accountId) {
            throw new EngineError('FORBIDDEN', missingUserMessage);
        }
        return context.accountId;
    }

    async function requireSid(roomId: string, accountId: string): Promise<string> {
        const sid = await adapter.findSidByKey(roomId, accountId);
        if (!sid) {
            throw new EngineError('FORBIDDEN', notMemberMessage);
        }
        return sid;
    }

    async function publishEvents(roomId: string, events: EngineEvent[], callerSid: string | null, revision?: number): Promise<WireEvent[]> {
        const wire: WireEvent[] = [];
        const own: WireEvent[] = [];

        events.forEach((event, index) => {
            if (event.audience.kind === 'room') {
                const roomEvent: WireEvent = {
                    action: event.action,
                    payload: event.payload,
                    id: revision === undefined ? undefined : `${revision}:${index}`,
                    revision,
                    exceptSid: event.audience.exceptSid,
                };
                wire.push(roomEvent);
                if (callerSid !== null) {
                    own.push(roomEvent);
                }
            } else if (event.audience.sid === callerSid) {
                own.push({ action: event.action, payload: event.payload });
            } else {
                wire.push({ action: event.action, payload: event.payload, forSid: event.audience.sid });
            }
        });

        if (wire.length > 0) {
            await publisher.publishEvents(roomId, wire);
        }
        return own;
    }

    async function sessionFor(room: Parameters<typeof toRoom>[0], sid: string): Promise<SessionData> {
        const token = await publisher.subscribeToken(room.roomId);
        return {
            sid,
            roomId: room.roomId,
            role: room.moderatorId === sid ? 'mod' : 'player',
            room: toRoom(room),
            token: token ?? undefined,
        };
    }

    function joinFields(roomId: string, accountId: string, payload: Payload) {
        return {
            roomId,
            memberKey: accountId,
            name: requireText(payload.name, 'Your name', { min: 2, max: 100 }),
            avatarId: parseAvatarId(payload.avatarId),
            avatarUrl: optionalHttpUrl(payload.avatarUrl, 'Avatar URL'),
        };
    }

    async function respondToJoin(outcome: JoinOutcome, roomId: string): Promise<unknown> {
        if (outcome.kind === 'pending') {
            await publishEvents(roomId, outcome.events, null);
            return { status: 'pending', requestId: outcome.request.requestId, roomId, roomName: outcome.room.roomName };
        }
        return await sessionFor(outcome.room, outcome.member.sid);
    }

    async function createRoom(accountId: string, payload: Payload): Promise<SessionData> {
        const invitees = Array.isArray(payload.invitees) ? payload.invitees.map(normalizeUserRef) : [];
        const { room, member } = await engine.rooms.createRoom({
            memberKey: accountId,
            name: requireText(payload.name, 'Your name', { min: 2, max: 100 }),
            roomName: requireText(payload.roomName, 'Room name', { min: 3, max: 40 }),
            scoreType: parseScoreType(payload.scoreType),
            avatarId: parseAvatarId(payload.avatarId),
            avatarUrl: optionalHttpUrl(payload.avatarUrl, 'Avatar URL'),
            requireApproval: typeof payload.requireApproval === 'boolean' ? payload.requireApproval : undefined,
            listed: typeof payload.listed === 'boolean' ? payload.listed : undefined,
            invitees,
        });
        return await sessionFor(room, member.sid);
    }

    async function joinStatus(accountId: string, roomId: string, payload: Payload): Promise<unknown> {
        const status = await engine.rooms.getJoinRequest(roomId, accountId);
        if (!status.admitted) {
            return { status: status.status, reason: status.reason };
        }
        const outcome = await engine.rooms.joinRoom(joinFields(roomId, accountId, payload));
        if (outcome.kind !== 'joined') {
            return { status: outcome.request.status };
        }
        return { status: 'approved', session: await sessionFor(outcome.room, outcome.member.sid) };
    }

    async function enterRoom(accountId: string, roomId: string): Promise<unknown> {
        const sid = await requireSid(roomId, accountId);
        await adapter.store.updateMember(roomId, sid, { lastSeenAt: clock().toISOString() });
        const events = await engine.rooms.announceMember(roomId, sid);
        await publishEvents(roomId, events, sid);
        const snapshot = await engine.rooms.buildSnapshot(roomId, sid);
        const room = await engine.rooms.requireRoom(roomId);
        return { snapshot, token: await publisher.subscribeToken(roomId), moderatorId: room.moderatorId };
    }

    async function dispatch(accountId: string, request: PokerRequest): Promise<DispatchData> {
        const roomId = requireRoomId(request.roomId);
        if (!request.action) {
            throw new EngineError('VALIDATION_FAILED', 'An action is required.');
        }
        const sid = await requireSid(roomId, accountId);
        const outcome = await engine.dispatch({ principal: { sid, roomId }, action: request.action, payload: payloadOf(request) });
        const callerEvents = await publishEvents(roomId, outcome.events, sid, outcome.revision);

        const data: DispatchData = { result: outcome.result, events: callerEvents, roomClosed: outcome.roomClosed };
        const token: RealtimeTokenData | null = request.action === 'requestResync' ? await publisher.subscribeToken(roomId) : null;
        if (token) {
            data.token = token;
        }
        return data;
    }

    async function handle(request: PokerRequest, context: PokerCallContext): Promise<PokerResponse> {
        try {
            const accountId = requireAccount(context);
            const payload = payloadOf(request);

            switch (request.operation) {
                case 'createRoom':
                    return { ok: true, data: await createRoom(accountId, payload) };
                case 'joinRoom': {
                    const roomId = requireRoomId(request.roomId);
                    const outcome = await engine.rooms.joinRoom(joinFields(roomId, accountId, payload));
                    return { ok: true, data: await respondToJoin(outcome, roomId) };
                }
                case 'joinStatus':
                    return { ok: true, data: await joinStatus(accountId, requireRoomId(request.roomId), payload) };
                case 'cancelJoin': {
                    const roomId = requireRoomId(request.roomId);
                    const events = await engine.rooms.cancelJoinRequest(roomId, accountId);
                    await publishEvents(roomId, events, null);
                    return { ok: true, data: { status: 'cancelled' } };
                }
                case 'summary':
                    return { ok: true, data: await engine.rooms.getSummary(request.roomId) };
                case 'snapshot': {
                    const roomId = requireRoomId(request.roomId);
                    return { ok: true, data: await engine.rooms.buildSnapshot(roomId, await requireSid(roomId, accountId)) };
                }
                case 'directory':
                    return { ok: true, data: await engine.rooms.listDirectory(accountId) };
                case 'enterRoom':
                    return { ok: true, data: await enterRoom(accountId, requireRoomId(request.roomId)) };
                case 'dispatch':
                    return { ok: true, data: await dispatch(accountId, request) };
                default:
                    return failure('VALIDATION_FAILED', 'Unknown poker operation.');
            }
        } catch (error) {
            return toFailure(error);
        }
    }

    return { handle, engine };
}
