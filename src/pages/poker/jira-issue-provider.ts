import type { PokerIssueProvider } from 'planning-poker/contracts';

import { findPokerIssue, getPokerEstimateTarget, lookupPokerIssues, pokerIssueKeyTest, updatePokerEstimate } from './issue-lookup';

export default function createJiraIssueProvider(): PokerIssueProvider {
    return {
        async isAvailable() {
            return true;
        },

        async lookupIssues(query) {
            try {
                return await lookupPokerIssues(query);
            } catch (error) {
                console.error('Poker issue lookup failed', error);
                return [];
            }
        },

        async getIssue(key) {
            const trimmed = key.trim();
            if (!pokerIssueKeyTest.test(trimmed)) {
                return null;
            }

            try {
                return await findPokerIssue(trimmed);
            } catch (error) {
                console.error('Poker issue lookup failed', error);
                return null;
            }
        },

        async getEstimateTarget() {
            return getPokerEstimateTarget();
        },

        async updateEstimate(issue, points) {
            await updatePokerEstimate(issue.key.trim(), issue.root, points);
        },
    };
}
