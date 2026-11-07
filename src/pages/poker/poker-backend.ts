import type { PokerApiEndpoints } from 'planning-poker/standalone';
import type { PokerHostService } from 'planning-poker/ui';

import { pokerBasePath } from './constants';

const { VITE_POKER_API_URL, VITE_POKER_WS_URL } = import.meta.env;

export const pokerApiEndpoints: PokerApiEndpoints = {
    apiBaseUrl: VITE_POKER_API_URL || 'https://poker-api.utilsware.com',
    wsBaseUrl: VITE_POKER_WS_URL || 'wss://poker-ws.utilsware.com',
};

export function createWebHostService(): PokerHostService {
    return {
        capabilities: { directory: false, invitations: false, listing: false, presenceHeartbeat: false },
        defaults: { requireApproval: false, listed: false },
        hidesThemeToggle: true,
        shareUrl(roomId) {
            return `${window.location.origin}${pokerBasePath}/room/${encodeURIComponent(roomId)}`;
        },
    };
}
