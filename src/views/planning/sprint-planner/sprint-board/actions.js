import { create } from 'zustand';
import { inject } from "src/services";
import { getEpicDetailsForSprints } from '../store/epic-helper';

export const useSprintIssueStatus = create(() => ({}));

export function rearrangeIssue(setState, getState) {
    return async function (issues, sprint, { source, target } = {}) {
        if (!source || !target) {
            // This handler will be once again fired for item removed from source sprint
            // Removing item from source sprint is already handled below
            // So just return without handling it
            return;
        }

        const { index: sourceIndex, item: sourceItem, args: sourceSprint } = source;
        const { index: targetIndex, item: targetItem } = target;

        const issueKey = sourceItem.key;
        const data = { issues: [issueKey] };

        if (targetItem) {
            if (sourceIndex > targetIndex) {
                data.rankBeforeIssue = targetItem.key;
            } else {
                data.rankAfterIssue = targetItem.key;
            }
        } else if (targetIndex === issues.length - 1 && issues.length > 1) {
            // Item is moved to the end of the list, so take the second last issue
            data.rankAfterIssue = issues[issues.length - 2].key;
        }

        let sprintWiseIssues = getState('sprintWiseIssues');
        sprintWiseIssues = { ...sprintWiseIssues };
        sprintWiseIssues[sprint.id] = issues;

        // Remove issue from source sprint from where it is pulled
        const sourceSprintIssues = sprintWiseIssues[sourceSprint.id];
        sprintWiseIssues[sourceSprint.id] = sourceSprintIssues.filter(issue => issue !== sourceItem);

        setState({ sprintWiseIssues });

        // Update EPIC's list in state
        const { sprintLists, epicNameField } = getState();
        // Intentionally did not add await as this data is not immediately necessary
        getEpicDetailsForSprints(sprintWiseIssues, sprintLists, epicNameField).then(setState);

        // API call to update issues in sprint

        const { $jira } = inject('JiraService');

        useSprintIssueStatus.setState({ [issueKey]: true });

        await $jira.moveIssuesToSprint(sprint.id, data);

        useSprintIssueStatus.setState({ [issueKey]: undefined });
    };
}
