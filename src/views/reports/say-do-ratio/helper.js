import { inject } from "src/services";
const settingsName = 'reports_SayDoRatioReport';

export async function getSprintWiseSayDoRatio(settings) {
    const { sprintBoards, noOfSprints, velocitySprints, storyPointField } = settings;
    const { $sprint, $jira, $config } = inject('SprintService', 'JiraService', 'ConfigService');

    const customFields = await $jira.getCustomFields();
    const sprintFieldId = customFields.find(({ name }) => name === 'Sprint')?.id;

    const result = [];
    for (const { id, name } of sprintBoards) {
        const { closedSprintLists, ...boardProps } = await $sprint.computeAverageSprintVelocity(id, velocitySprints, storyPointField, sprintFieldId, noOfSprints + velocitySprints);

        const sprintList = closedSprintLists.slice(-noOfSprints);
        while (sprintList.length < noOfSprints) {
            sprintList.splice(0, 0, null);
        }
        result.push({ id, name, sprintList, ...boardProps });
    }

    await $config.saveSettings(settingsName, { sprintBoards, noOfSprints, velocitySprints });

    return result;
}

export function getSettings() {
    const { $session } = inject('SessionService');
    const settings = { sprintBoards: [], noOfSprints: 6, velocitySprints: 6, ...($session.pageSettings[settingsName] || {}) };
    settings.storyPointField = $session.CurrentUser.storyPointField?.id;

    return settings;
}
