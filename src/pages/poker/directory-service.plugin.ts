import type { PokerDirectoryService } from 'planning-poker/contracts';
import type { RoomDirectory } from 'planning-poker/shared/types/poker';

import { callPoker } from './invoke-poker.plugin';

export function createForgeDirectoryService(): PokerDirectoryService {
    return {
        async list() {
            return await callPoker<RoomDirectory>({ operation: 'directory' });
        },
    };
}
