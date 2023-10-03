import { create } from 'zustand';
import { inject } from "src/services";

export const useSprintIssueStatus = create(() => ({}));

export function rearrangeIssue(setState, getState) {
    return async function (issues, sprint, { source, target } = {}) {
        if (!source || !target) {
            return;
        }
        const { index: sourceIndex, item: sourceItem } = source;
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

        // ToDo: need to do api call

        let sprintWiseIssues = getState('sprintWiseIssues');
        sprintWiseIssues = { ...sprintWiseIssues };
        sprintWiseIssues[sprint.id] = issues;

        setState({ sprintWiseIssues });

        const { $jira } = inject('JiraService');

        useSprintIssueStatus.setState({ [issueKey]: true });

        await $jira.moveIssuesToSprint(sprint.id, data);

        useSprintIssueStatus.setState({ [issueKey]: undefined });
    };
}
