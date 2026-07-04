import { FeedbackPromise } from '@/common';
import { inject } from '@/services';

import type { BoardData, ReportSettings } from './types';

const settingsName = 'reports_SayDoRatioReport';

export function getSprintWiseSayDoRatio(settings: ReportSettings): FeedbackPromise<BoardData[]> {
    return new FeedbackPromise(async (resolve, _, progress) => {
        const { sprintBoards, noOfSprints, velocitySprints, storyPointField, workingDays, includeNonWorkingDays } = settings;
        const { $sprint, $jira, $config } = inject('SprintService', 'JiraService', 'ConfigService');

        await $config.saveSettings(settingsName, { sprintBoards, noOfSprints, velocitySprints, includeNonWorkingDays });

        const customFields = await $jira.getCustomFields();
        const statuses = await $jira.getJiraStatuses();

        const statusMap = statuses.reduce((map: Record<string, string>, s: any) => {
            map[s.id] = s.untranslatedName || s.name;
            return map;
        }, {});

        const sprintFieldId = customFields.find(({ name }: any) => name === 'Sprint')?.id || '';
        progress({ data: [], completed: 2 });

        const workingDaysToUse = includeNonWorkingDays ? undefined : workingDays;

        const result: BoardData[] = [];
        for (const { id, name } of sprintBoards) {
            const { closedSprintLists, ...boardProps } = await $sprint
                .computeAverageSprintVelocity(
                    id,
                    velocitySprints,
                    storyPointField!,
                    sprintFieldId,
                    noOfSprints + velocitySprints,
                    workingDaysToUse,
                    statusMap,
                )
                .progress(({ completed }: any) => {
                    progress({ completed: 2 + ((result.length + completed / 100) * 98) / sprintBoards.length });
                });

            const sprintList = closedSprintLists.slice(-noOfSprints);
            while (sprintList.length < noOfSprints) {
                sprintList.splice(0, 0, null); // Add nulls to the beginning if there are no sufficient number of sprints
            }
            result.push({ id, name, sprintList, ...boardProps });
            progress({ data: [...result], completed: 5 + (result.length * 95) / sprintBoards.length });
        }

        resolve(result);
    });
}

export function getSettings(): ReportSettings {
    const { $session } = inject('SessionService');
    const settings: ReportSettings = {
        sprintBoards: [],
        noOfSprints: 6,
        velocitySprints: 6,
        workingDays: [1, 2, 3, 4, 5],
        includeNonWorkingDays: false,
        ...($session.pageSettings[settingsName] || {}),
    };
    settings.storyPointField = ($session.CurrentUser as any).storyPointField?.id;
    settings.workingDays = ($session.CurrentUser as any).workingDays || [1, 2, 3, 4, 5];

    return settings;
}
