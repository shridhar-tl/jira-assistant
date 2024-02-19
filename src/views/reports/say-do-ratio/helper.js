import { inject } from "src/services";
const settingsName = 'reports_SayDoRatioReport';

export async function getSprintWiseSayDoRatio(settings) {
    const { sprintBoards, noOfSprints, velocitySprints, storyPointField } = settings;
    const { $sprint, $config } = inject('SprintService', 'SessionService', 'ConfigService');

    const result = [];
    for (const { id, name } of sprintBoards) {
        const { closedSprintLists, averageCommitted, averageCompleted, sayDoRatio } = await $sprint.computeAverageSprintVelocity(id, velocitySprints, storyPointField, noOfSprints + velocitySprints);

        const sprintList = closedSprintLists.slice(-noOfSprints);
        while (sprintList.length < noOfSprints) {
            sprintList.splice(0, 0, null);
        }
        result.push({ id, name, sprintList, averageCommitted, averageCompleted, sayDoRatio });
    }

    await $config.saveSettings(settingsName, settings);

    return result;
}

export function getSettings() {
    const { $session } = inject('SessionService');
    const settings = $session.pageSettings[settingsName] || { sprintBoards: [], noOfSprints: 6, velocitySprints: 6 };
    settings.storyPointField = $session.CurrentUser.storyPointField?.id;

    return settings;
}
