import type { ServiceContainer } from 'fluxo-ui/services';

import type { PokerIdentityService } from 'planning-poker/contracts';
import { registerPokerApiServices } from 'planning-poker/standalone';
import { createPokerContainer, pokerServices, registerPokerService } from 'planning-poker/ui';

import { createWebHostService, pokerApiEndpoints } from './poker-backend';

function createGuestIdentityService(): PokerIdentityService {
    return {
        requiresEmail: true,
        allowsAvatarPicker: true,
        async getIdentity() {
            return null;
        },
    };
}

export default function createGuestPokerContainer(): ServiceContainer {
    const container = createPokerContainer();

    registerPokerApiServices(container, pokerApiEndpoints);
    registerPokerService(container, pokerServices.identity, createGuestIdentityService);
    registerPokerService(container, pokerServices.host, createWebHostService);

    return container;
}
