import FeedbackPromise from "src/common/FeedbackPromise";
import { inject } from "src/services";
const settingsName = 'reports_SayDoRatioReport';

export function getSprintWiseSayDoRatio(settings) {
    return new FeedbackPromise(async (resolve, _, progress) => {
        const { sprintBoards, noOfSprints, velocitySprints, storyPointField, workingDays, includeNonWorkingDays } = settings;
        const { $sprint, $jira, $config } = inject('SprintService', 'JiraService', 'ConfigService');

        await $config.saveSettings(settingsName, { sprintBoards, noOfSprints, velocitySprints, includeNonWorkingDays });

        const customFields = await $jira.getCustomFields();
        const sprintFieldId = customFields.find(({ name }) => name === 'Sprint')?.id;
        progress({ data: [], completed: 5 });

        const workingDaysToUse = includeNonWorkingDays ? undefined : workingDays;

        const result = [];
        for (const { id, name } of sprintBoards) {
            const { closedSprintLists, ...boardProps } = await $sprint.computeAverageSprintVelocity(id,
                velocitySprints, storyPointField, sprintFieldId, noOfSprints + velocitySprints, workingDaysToUse)
                .progress(({ completed }) => {
                    progress({ completed: 5 + (((result.length + (completed / 100)) * 95) / sprintBoards.length) });
                });

            const sprintList = closedSprintLists.slice(-noOfSprints);
            while (sprintList.length < noOfSprints) {
                sprintList.splice(0, 0, null); // Add nulls to the beginning if there are no sufficient number of sprints
            }
            result.push({ id, name, sprintList, ...boardProps });
            progress({ data: [...result], completed: 5 + (result.length * 95 / sprintBoards.length) });
        }

        resolve(result);
    });
}

export function getSettings() {
    const { $session } = inject('SessionService');
    const settings = { sprintBoards: [], noOfSprints: 6, velocitySprints: 6, ...($session.pageSettings[settingsName] || {}) };
    settings.storyPointField = $session.CurrentUser.storyPointField?.id;
    settings.workingDays = $session.CurrentUser.workingDays || [1, 2, 3, 4, 5];

    return settings;
}
