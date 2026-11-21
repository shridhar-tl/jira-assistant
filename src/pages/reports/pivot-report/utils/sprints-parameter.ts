import { inject } from '@services';

import { syncBoardSelection, toAgileBoards, type AgileBoard } from '@components/shared/sprint-selector';

import type { ReportParameterDefinition, SprintsParameterConfig, SprintsParameterValue } from '../types';

export const sprintsParameterName = 'Boards and sprints';
export const sprintsParameterKey = sprintsParameterName.toLowerCase();
export const sprintsParameterType = 'sprints';

export function getDefaultSprintBoards(): AgileBoard[] {
    const { $session } = inject('SessionService');
    return toAgileBoards($session.CurrentUser?.rapidViews);
}

export function getSprintsParameterDefinition({ range }: SprintsParameterConfig): ReportParameterDefinition {
    return { name: sprintsParameterName, type: sprintsParameterType, sprintRange: range };
}

/**
 * Boards newly added are selected with the sprint range configured in the report, whereas the selection of the existing boards is retained
 */
export function applyBoardsChange(value: SprintsParameterValue | undefined, boards: AgileBoard[], range: number): SprintsParameterValue {
    const prevBoards = value?.boards || [];
    const selection = syncBoardSelection(prevBoards, value?.selection || {}, boards);
    const knownBoardIds = new Set(prevBoards.map(({ id }) => id));

    boards.forEach(({ id }) => {
        if (!knownBoardIds.has(id) && selection[id]) {
            selection[id] = { ...selection[id], range };
        }
    });

    return { boards, selection };
}

export function getInitialSprintsValue(range = 0): SprintsParameterValue | undefined {
    const boards = getDefaultSprintBoards();

    return boards.length ? applyBoardsChange(undefined, boards, range) : undefined;
}
