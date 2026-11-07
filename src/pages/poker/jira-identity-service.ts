import type { PokerIdentity, PokerIdentityService } from 'planning-poker/contracts';

import { inject } from '@services';

import { jiraAvatarUrl } from './avatar-url';

export default function createJiraIdentityService(requiresEmail: boolean): PokerIdentityService {
    let cached: PokerIdentity | null = null;

    return {
        requiresEmail,
        allowsAvatarPicker: true,

        async getIdentity() {
            if (cached !== null) {
                return cached;
            }

            try {
                const { $jira, $session } = inject('JiraService', 'SessionService');
                const user = await $jira.getCurrentUser();
                cached = {
                    id: user.accountId ?? undefined,
                    name: user.displayName ?? '',
                    email: user.emailAddress,
                    avatarUrl: jiraAvatarUrl(user.avatarUrls?.['48x48'], $session.rootUrl),
                };
                return cached;
            } catch (error) {
                console.error('Poker could not load the Jira user', error);
                return null;
            }
        },
    };
}
