import { bulkJoinBatchSize, busyMessage, directoryLimit, forgeEngineDefaults, hostAwayGraceMs } from '../constants';
import type { DispatchData, PokerErrorCode, PokerRequest, PokerResponse, RealtimeTokenData, SessionData, WireEvent } from '../protocol';
import { BusyError, isRateLimitError } from '../rate-limit';

import type { ForgePokerAdapter } from './forge-room-store';
import { findRestrictedIssues, getJiraIdentity, isJiraHostedUrl, resolveJiraUsers } from './jira-directory';
import {
    createEngine,
    defaultEngineConfig,
    EngineError,
    parseAvatarId,
    parseScoreType,
    requireRoomId,
    requireText,
    toRoom,
    type Engine,
    type EngineEvent,
    type JoinOutcome,
    type PokerUserRef,
    type RateLimiterPort,
} from './poker-engine';
import type { RealtimePublisher } from './realtime-publisher';
import type { UsageLimiter } from './usage-limits';

export interface PokerCallContext {
    accountId?: string;
    siteUrl?: string;
}

export interface PokerHandlerDeps {
    adapter: ForgePokerAdapter;
    publisher: RealtimePublisher;
    limiter?: UsageLimiter;
    now?: () => Date;
}

type Payload = Record<string, unknown>;

const missingUserMessage = 'Planning poker needs a signed-in Jira user.';
const notMemberMessage = 'You are not a member of this room.';
const maxRoomsPerHour = 10;
const maxInvitationsPerHour = 200;
const tooManyInvitationsMessage = 'You have invited too many people in the last hour. Please try again later.';
const unredactedTargetedActions = new Set(['kicked']);
const issueActions = new Set(['addIssue', 'addIssues']);

function hostingMessage(roomName: string): string {
    return `You are hosting the room "${roomName}". Close it before you create or join another room.`;
}

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

export function createPokerEngine(adapter: ForgePokerAdapter, now?: () => Date, rateLimiter?: RateLimiterPort): Engine {
    return createEngine({
        store: adapter.store,
        invitations: adapter.invitations,
        directory: adapter.directory,
        presence: adapter.presence,
        rateLimiter,
        now,
        config: {
            ...defaultEngineConfig,
            maxRoomsPerMemberPerHour: maxRoomsPerHour,
            directoryEnabled: true,
            invitationsEnabled: true,
            defaultAccess: { requireApproval: forgeEngineDefaults.requireApproval, listed: forgeEngineDefaults.listed },
            hostAwayGraceMs,
            bulkJoinBatchSize,
            directoryLimit,
        },
    });
}

function siteUrlOf(value: unknown, siteUrl: string | undefined): string | undefined {
    if (typeof value !== 'string' || !siteUrl) {
        return undefined;
    }
    try {
        return new URL(value).origin === new URL(siteUrl).origin ? value : undefined;
    } catch {
        return undefined;
    }
}

function sanitizeIssue(raw: unknown, siteUrl: string | undefined): unknown {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return raw;
    }
    const issue = raw as Record<string, unknown>;
    return {
        id: issue.id,
        key: issue.key,
        summary: issue.summary,
        url: siteUrlOf(issue.url, siteUrl),
        root: siteUrlOf(issue.root, siteUrl),
        icon: isJiraHostedUrl(issue.icon, siteUrl) ? issue.icon : undefined,
    };
}

function sanitizeIssuePayload(action: string, payload: Payload, siteUrl: string | undefined): Payload {
    if (action === 'addIssues') {
        return { ...payload, issues: Array.isArray(payload.issues) ? payload.issues.map((issue) => sanitizeIssue(issue, siteUrl)) : payload.issues };
    }
    return payload.issue === undefined ? (sanitizeIssue(payload, siteUrl) as Payload) : { ...payload, issue: sanitizeIssue(payload.issue, siteUrl) };
}

export function createPokerHandlers({ adapter, publisher, limiter, now }: PokerHandlerDeps) {
    const engine = createPokerEngine(adapter, now, limiter);
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

    async function ensureNotHosting(accountId: string, exceptRoomId?: string): Promise<void> {
        const rooms = await adapter.directory.listRoomsOfMember(accountId, directoryLimit);
        const hosted = rooms.find((room) => room.moderatorKey === accountId && room.roomId !== exceptRoomId);
        if (hosted) {
            throw new EngineError('CONFLICT', hostingMessage(hosted.roomName));
        }
    }

    async function invitedUsers(accountId: string, raw: unknown): Promise<PokerUserRef[]> {
        const entries = Array.isArray(raw) ? raw : [];
        if (!entries.length) {
            return [];
        }
        const users = await resolveJiraUsers(entries, defaultEngineConfig.maxInvitationsPerRoom);
        if (limiter && users.length) {
            await limiter.consume(`invite#${accountId}`, users.length, maxInvitationsPerHour, tooManyInvitationsMessage);
        }
        return users;
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
            } else if (unredactedTargetedActions.has(event.action)) {
                wire.push({ action: event.action, payload: event.payload, forSid: event.audience.sid });
            } else {
                // The room channel reaches every member, so only the targeted member is told to fetch the details
                wire.push({ action: event.action, payload: null, forSid: event.audience.sid, redacted: true });
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

    async function joinFields(roomId: string, accountId: string, payload: Payload, restrictedIssueKeys?: string[]) {
        const identity = await getJiraIdentity(accountId);
        return {
            roomId,
            memberKey: accountId,
            name: identity.name,
            avatarId: parseAvatarId(payload.avatarId),
            avatarUrl: payload.avatarUrl ? identity.avatarUrl : undefined,
            restrictedIssueKeys,
        };
    }

    async function restrictedIssuesFor(roomId: string, accountId: string): Promise<string[] | undefined> {
        if (await adapter.findSidByKey(roomId, accountId)) {
            return undefined;
        }
        await ensureNotHosting(accountId, roomId);
        if (await adapter.invitations.getInvitation(roomId, accountId)) {
            return undefined;
        }
        const room = await engine.rooms.requireRoom(roomId);
        const restricted = await findRestrictedIssues(room.issues.map((issue) => issue.key));
        return restricted.length ? restricted : undefined;
    }

    async function respondToJoin(outcome: JoinOutcome, roomId: string): Promise<unknown> {
        if (outcome.kind === 'pending') {
            await publishEvents(roomId, outcome.events, null);
            return { status: 'pending', requestId: outcome.request.requestId, roomId, roomName: outcome.room.roomName };
        }
        return await sessionFor(outcome.room, outcome.member.sid);
    }

    async function createRoom(accountId: string, payload: Payload): Promise<SessionData> {
        const roomName = requireText(payload.roomName, 'Room name', { min: 3, max: 40 });
        const scoreType = parseScoreType(payload.scoreType);
        await ensureNotHosting(accountId);
        const identity = await getJiraIdentity(accountId);
        const invitees = (await invitedUsers(accountId, payload.invitees)).filter((user) => user.id !== accountId);
        const { room, member } = await engine.rooms.createRoom({
            memberKey: accountId,
            name: identity.name,
            roomName,
            scoreType,
            avatarId: parseAvatarId(payload.avatarId),
            avatarUrl: payload.avatarUrl ? identity.avatarUrl : undefined,
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
        const outcome = await engine.rooms.joinRoom(await joinFields(roomId, accountId, payload));
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

    async function actionPayload(accountId: string, sid: string, roomId: string, action: string, payload: Payload, siteUrl: string | undefined): Promise<Payload> {
        if (issueActions.has(action)) {
            return sanitizeIssuePayload(action, payload, siteUrl);
        }
        if (action === 'inviteMembers') {
            const room = await engine.rooms.requireRoom(roomId);
            if (room.moderatorId !== sid) {
                throw new EngineError('FORBIDDEN', 'Only the moderator can perform this action.');
            }
            return { ...payload, users: await invitedUsers(accountId, payload.users) };
        }
        return payload;
    }

    async function dispatch(accountId: string, request: PokerRequest, siteUrl: string | undefined): Promise<DispatchData> {
        const roomId = requireRoomId(request.roomId);
        if (typeof request.action !== 'string' || !engine.isHandled(request.action)) {
            throw new EngineError('VALIDATION_FAILED', 'An action is required.');
        }
        const sid = await requireSid(roomId, accountId);
        const payload = await actionPayload(accountId, sid, roomId, request.action, payloadOf(request), siteUrl);
        const outcome = await engine.dispatch({ principal: { sid, roomId }, action: request.action, payload });
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
                    const restricted = await restrictedIssuesFor(roomId, accountId);
                    const outcome = await engine.rooms.joinRoom(await joinFields(roomId, accountId, payload, restricted));
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
                    return { ok: true, data: await dispatch(accountId, request, context.siteUrl) };
                default:
                    return failure('VALIDATION_FAILED', 'Unknown poker operation.');
            }
        } catch (error) {
            return toFailure(error);
        }
    }

    return { handle, engine };
}
