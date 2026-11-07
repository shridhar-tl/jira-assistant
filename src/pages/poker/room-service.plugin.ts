import type {
    CreateRoomRequest,
    JoinPendingResponse,
    JoinRoomRequest,
    RoomSnapshot,
    RoomSummary,
} from 'planning-poker/shared/types/poker';
import type {
    JoinStatusRequest,
    JoinStatusResponse,
    PokerRoomService,
    PokerSessionService,
    SessionResponse,
} from 'planning-poker/contracts';

import type { SessionData } from './forge/protocol';
import { callPoker } from './invoke-poker.plugin';
import { encodeToken, sessionExpiry } from './session-service.plugin';

interface PendingData {
    status: 'pending';
    requestId: string;
    roomId: string;
    roomName: string;
}

interface JoinStatusData {
    status: JoinStatusResponse['status'];
    reason?: string;
    session?: SessionData;
}

function toSessionResponse(data: SessionData): SessionResponse {
    return {
        token: encodeToken(data.token),
        sid: data.sid,
        roomId: data.roomId,
        role: data.role,
        expiresAt: sessionExpiry(),
        room: data.room as SessionResponse['room'],
    };
}

export function createForgeRoomService(session: PokerSessionService): PokerRoomService {
    function keep(data: SessionData, name: string): SessionResponse {
        const response = toSessionResponse(data);
        session.store(response, name);
        return response;
    }

    return {
        async createRoom(request: CreateRoomRequest) {
            const data = await callPoker<SessionData>({
                operation: 'createRoom',
                payload: {
                    name: request.name,
                    roomName: request.roomName,
                    scoreType: request.scoreType,
                    avatarId: request.avatarId ?? null,
                    avatarUrl: request.avatarUrl,
                    requireApproval: request.requireApproval,
                    listed: request.listed,
                    invitees: request.invitees,
                },
            });
            return keep(data, request.name);
        },

        async joinRoom(request: JoinRoomRequest): Promise<SessionResponse | JoinPendingResponse> {
            const data = await callPoker<SessionData | PendingData>({
                operation: 'joinRoom',
                roomId: request.roomId,
                payload: { name: request.name, avatarId: request.avatarId ?? null, avatarUrl: request.avatarUrl },
            });
            if ('status' in data && data.status === 'pending') {
                return data;
            }
            return keep(data as SessionData, request.name);
        },

        async getJoinStatus(request: JoinStatusRequest): Promise<JoinStatusResponse> {
            const data = await callPoker<JoinStatusData>({
                operation: 'joinStatus',
                roomId: request.roomId,
                payload: { requestId: request.requestId, name: request.name ?? '', avatarId: request.avatarId ?? null, avatarUrl: request.avatarUrl },
            });
            if (data.session) {
                return { status: data.status, reason: data.reason, session: keep(data.session, request.name ?? '') };
            }
            return { status: data.status, reason: data.reason };
        },

        async cancelJoinRequest(request: JoinStatusRequest) {
            await callPoker({ operation: 'cancelJoin', roomId: request.roomId, payload: { requestId: request.requestId } });
        },

        async getRoomSummary(roomId: string): Promise<RoomSummary> {
            return await callPoker<RoomSummary>({ operation: 'summary', roomId });
        },

        async getSnapshot(): Promise<RoomSnapshot> {
            const current = session.getSession();
            if (current === null) {
                throw new Error('There is no active poker session.');
            }
            return await callPoker<RoomSnapshot>({ operation: 'snapshot', roomId: current.roomId });
        },
    };
}
