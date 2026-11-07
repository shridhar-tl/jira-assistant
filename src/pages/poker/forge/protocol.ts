import type { ClientAction, ServerAction } from 'planning-poker/shared/types/realtime';

export type PokerOperation = 'dispatch' | 'createRoom' | 'joinRoom' | 'joinStatus' | 'cancelJoin' | 'summary' | 'snapshot' | 'directory' | 'enterRoom';

export interface PokerRequest {
    operation: PokerOperation;
    roomId?: string;
    action?: ClientAction;
    payload?: Record<string, unknown>;
}

export type PokerErrorCode = 'BUSY' | 'VALIDATION_FAILED' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'RATE_LIMITED' | 'UNSUPPORTED' | 'SERVER_ERROR';

export interface PokerFailure {
    ok: false;
    code: PokerErrorCode;
    message: string;
}

export interface PokerSuccess<T> {
    ok: true;
    data: T;
}

export type PokerResponse<T = unknown> = PokerSuccess<T> | PokerFailure;

export interface WireEvent {
    action: ServerAction;
    payload: unknown;
    id?: string;
    revision?: number;
    forSid?: string;
    exceptSid?: string;
}

export interface RealtimeBatch extends Record<string, unknown> {
    roomId: string;
    events: WireEvent[];
}

export interface DispatchData {
    result?: unknown;
    events: WireEvent[];
    token?: RealtimeTokenData;
    roomClosed?: boolean;
}

export interface RealtimeTokenData {
    token: string;
    expiresAt: number;
}

export interface SessionData {
    sid: string;
    roomId: string;
    role: 'mod' | 'player';
    room: unknown;
    token?: RealtimeTokenData;
}

export function isRealtimeBatch(value: unknown): value is RealtimeBatch {
    const candidate = value as RealtimeBatch | null;
    return typeof candidate === 'object' && candidate !== null && typeof candidate.roomId === 'string' && Array.isArray(candidate.events);
}
