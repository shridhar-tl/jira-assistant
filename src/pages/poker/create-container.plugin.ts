import { view } from '@forge/bridge';
import type { ServiceContainer } from 'fluxo-ui/services';

import { createPokerContainer, pokerServices, registerPokerService } from 'planning-poker/ui';

import { createForgeDirectoryService } from './directory-service.plugin';
import { createForgeHostService, resolveRoomUrlTemplate } from './host-service.plugin';
import createJiraIdentityService from './jira-identity-service';
import createJiraIssueProvider from './jira-issue-provider';
import { createForgeRealtimeService } from './realtime-service.plugin';
import { createForgeRoomService } from './room-service.plugin';
import { createForgeSessionService } from './session-service.plugin';
import jiraUserPicker from './user-picker.plugin';

const fallbackModuleKey = 'jira-assistant-app';

export default async function createPokerHostContainer(): Promise<ServiceContainer> {
    const context = await view.getContext();
    const roomUrlTemplate = await resolveRoomUrlTemplate(context.moduleKey || fallbackModuleKey);
    const container = createPokerContainer();
    const session = createForgeSessionService();

    registerPokerService(container, pokerServices.session, () => session);
    registerPokerService(container, pokerServices.room, () => createForgeRoomService(session));
    registerPokerService(container, pokerServices.realtime, () => createForgeRealtimeService(session));
    registerPokerService(container, pokerServices.identity, () => createJiraIdentityService(false));
    registerPokerService(container, pokerServices.issues, createJiraIssueProvider);
    registerPokerService(container, pokerServices.host, () => createForgeHostService(roomUrlTemplate));
    registerPokerService(container, pokerServices.directory, createForgeDirectoryService);
    registerPokerService(container, pokerServices.userPicker, () => jiraUserPicker);

    return container;
}
