import type { ServiceContainer } from 'fluxo-ui/services';

import { registerPokerApiServices } from 'planning-poker/standalone';
import { createPokerContainer, pokerServices, registerPokerService } from 'planning-poker/ui';

import createJiraIdentityService from './jira-identity-service';
import createJiraIssueProvider from './jira-issue-provider';
import { createWebHostService, pokerApiEndpoints } from './poker-backend';

export default async function createPokerHostContainer(): Promise<ServiceContainer> {
    const container = createPokerContainer();

    registerPokerApiServices(container, pokerApiEndpoints);
    registerPokerService(container, pokerServices.identity, () => createJiraIdentityService(true));
    registerPokerService(container, pokerServices.issues, createJiraIssueProvider);
    registerPokerService(container, pokerServices.host, createWebHostService);

    return container;
}
