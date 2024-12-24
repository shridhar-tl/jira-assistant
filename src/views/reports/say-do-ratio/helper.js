import { inject } from "src/services";
const settingsName = 'reports_SayDoRatioReport';

export async function getSprintWiseSayDoRatio(settings) {
    const { sprintBoards, noOfSprints, velocitySprints, storyPointField, workingDays, includeNonWorkingDays } = settings;
    const { $sprint, $jira, $config } = inject('SprintService', 'JiraService', 'ConfigService');

    await $config.saveSettings(settingsName, { sprintBoards, noOfSprints, velocitySprints, includeNonWorkingDays });

    const customFields = await $jira.getCustomFields();
    const sprintFieldId = customFields.find(({ name }) => name === 'Sprint')?.id;

    const workingDaysToUse = includeNonWorkingDays ? undefined : workingDays;

    const result = [];
    for (const { id, name } of sprintBoards) {
        const { closedSprintLists, ...boardProps } = await $sprint.computeAverageSprintVelocity(id,
            velocitySprints, storyPointField, sprintFieldId, noOfSprints + velocitySprints, workingDaysToUse);

        const sprintList = closedSprintLists.slice(-noOfSprints);
        while (sprintList.length < noOfSprints) {
            sprintList.splice(0, 0, null);
        }
        result.push({ id, name, sprintList, ...boardProps });
    }

    return result;
}

export function getSettings() {
    const { $session } = inject('SessionService');
    const settings = { sprintBoards: [], noOfSprints: 6, velocitySprints: 6, ...($session.pageSettings[settingsName] || {}) };
    settings.storyPointField = $session.CurrentUser.storyPointField?.id;
    settings.workingDays = $session.CurrentUser.workingDays || [1, 2, 3, 4, 5];

    return settings;
}
