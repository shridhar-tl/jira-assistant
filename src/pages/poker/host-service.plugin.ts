import { router } from '@forge/bridge';

import type { PokerHostService } from 'planning-poker/contracts';

import { pokerBasePath } from './constants';
import { forgeEngineDefaults } from './forge/constants';

const roomPlaceholder = '__poker_room__';

export async function resolveRoomUrlTemplate(moduleKey: string): Promise<string | null> {
    try {
        const url = await router.getUrl({ target: 'module', moduleKey, path: `${pokerBasePath}/room/${roomPlaceholder}` });
        return url ? url.toString() : null;
    } catch (error) {
        console.error('Poker could not resolve the shareable room URL', error);
        return null;
    }
}

export function createForgeHostService(roomUrlTemplate: string | null): PokerHostService {
    return {
        capabilities: { directory: true, invitations: true, listing: true, presenceHeartbeat: true },
        defaults: { requireApproval: forgeEngineDefaults.requireApproval, listed: forgeEngineDefaults.listed },
        hidesThemeToggle: true,
        shareUrl(roomId) {
            return roomUrlTemplate ? roomUrlTemplate.replace(roomPlaceholder, encodeURIComponent(roomId)) : roomId;
        },
    };
}
