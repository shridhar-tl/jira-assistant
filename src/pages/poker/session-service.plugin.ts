import type { PokerSession } from 'planning-poker/shared/types/poker';
import type { PokerSessionService, StoredSession } from 'planning-poker/contracts';

import type { RealtimeTokenData } from './forge/protocol';

const storageKey = 'pokerForgeSession';
const fallbackLifetimeMs = 12 * 3_600_000;

function isExpired(session: StoredSession): boolean {
    return new Date(session.expiresAt).getTime() <= Date.now();
}

function readStored(): StoredSession | null {
    try {
        const raw = window.sessionStorage.getItem(storageKey);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw) as StoredSession;
        return parsed.roomId && parsed.sid && !isExpired(parsed) ? parsed : null;
    } catch (error) {
        console.error('Poker session could not be read', error);
        return null;
    }
}

function writeStored(session: StoredSession | null): void {
    try {
        if (session === null) {
            window.sessionStorage.removeItem(storageKey);
        } else {
            window.sessionStorage.setItem(storageKey, JSON.stringify(session));
        }
    } catch (error) {
        console.error('Poker session could not be saved', error);
    }
}

export function sessionExpiry(): string {
    return new Date(Date.now() + fallbackLifetimeMs).toISOString();
}

export function encodeToken(token: RealtimeTokenData | undefined): string {
    return token ? JSON.stringify(token) : '';
}

export function decodeToken(raw: string): RealtimeTokenData | null {
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw) as RealtimeTokenData;
        return typeof parsed.token === 'string' && typeof parsed.expiresAt === 'number' ? parsed : null;
    } catch {
        return null;
    }
}

export function createForgeSessionService(): PokerSessionService {
    let current: StoredSession | null = readStored();

    return {
        store(session: PokerSession, name: string) {
            current = {
                token: session.token,
                sid: session.sid,
                roomId: session.roomId,
                role: session.role,
                expiresAt: session.expiresAt,
                name,
            };
            writeStored(current);
        },
        clear() {
            current = null;
            writeStored(null);
        },
        getSession() {
            if (current !== null && isExpired(current)) {
                current = null;
                writeStored(null);
            }
            return current;
        },
        sessionFor(roomId: string) {
            const session = this.getSession();
            return session !== null && session.roomId === roomId ? session : null;
        },
    };
}
