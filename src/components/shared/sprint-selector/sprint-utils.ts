import { format, isSameYear } from 'date-fns';

import { inject } from '@services';

import type { AgileBoard, AgileSprint, BoardSprintSelection, SprintRangeOption, SprintSelectionMap } from './types';

export const customSprintRange = -1;

export const sprintRangeOptions: SprintRangeOption[] = [
    { value: 0, label: 'Last sprint' },
    { value: 1, label: 'Last closed sprint' },
    { value: 2, label: 'Last 2 sprints' },
    { value: 3, label: 'Last 3 sprints' },
    { value: 4, label: 'Last 4 sprints' },
    { value: 5, label: 'Last 5 sprints' },
    { value: customSprintRange, label: 'Choose sprints' },
];

const defaultSprintStates = 'active,closed';

export function getSprintState(sprint: AgileSprint): string {
    return (sprint.state || '').toLowerCase();
}

function getStartTime(sprint: AgileSprint): number {
    return sprint.startDate ? new Date(sprint.startDate).getTime() : 0;
}

export function createBoardSelection(board: AgileBoard, existing?: BoardSprintSelection): BoardSprintSelection {
    return {
        range: 0,
        ...existing,
        custom: { ...existing?.custom },
        name: board.name,
    };
}

export function getSelectedBoardIds(selection: SprintSelectionMap | null | undefined): string[] {
    return Object.keys(selection || {}).filter((boardId) => selection?.[boardId]?.selected);
}

export function getCustomSprintCount(selection: BoardSprintSelection | undefined): number {
    return Object.keys(selection?.custom || {}).filter((id) => selection?.custom[id]).length;
}

/**
 * Removes the boards having custom range without any sprints chosen and the boards which are no longer available.
 */
export function cleanSprintSelection(selection: SprintSelectionMap, boards?: AgileBoard[]): SprintSelectionMap {
    const boardIds = boards ? new Set(boards.map((b) => String(b.id))) : null;
    const result: SprintSelectionMap = {};

    Object.keys(selection || {}).forEach((boardId) => {
        const board = selection[boardId];
        if (!board || (boardIds && !boardIds.has(boardId))) {
            return;
        }
        if (board.range === customSprintRange && !getCustomSprintCount(board)) {
            return;
        }
        result[boardId] = { ...board, custom: { ...board.custom } };
    });

    return result;
}

/**
 * Returns the sprints chosen for the board in the order of their start date
 */
export function pickSelectedSprints<T extends AgileSprint>(selection: BoardSprintSelection | undefined, sprints: T[] | undefined): T[] {
    if (!selection || !sprints?.length) {
        return [];
    }

    const { range, custom } = selection;
    const sprintList = [...sprints].sort((a, b) => getStartTime(b) - getStartTime(a));

    switch (range) {
        case customSprintRange:
            return sprintList.filter((s) => custom?.[s.id]).reverse();
        case 0:
            return [sprintList[0]].filter(Boolean);
        case 1: {
            const [lastSprint, prevSprint] = sprintList;
            return [lastSprint.completeDate ? lastSprint : prevSprint].filter(Boolean);
        }
        default:
            return sprintList.slice(0, range).reverse();
    }
}

export async function getBoardSprints(
    boardIds: (string | number)[],
    state: string = defaultSprintStates,
): Promise<Record<number, AgileSprint[]>> {
    if (!boardIds.length) {
        return {};
    }
    const { $jira } = inject('JiraService');
    const states = state.split(',');
    const sprints = (await $jira.getRapidSprintList(boardIds, { state })) as AgileSprint[];

    // Fallback api of Jira ignores the state filter and hence the sprints are filtered again
    return sprints
        .filter((sprint) => states.includes(getSprintState(sprint)))
        .reduce<Record<number, AgileSprint[]>>((result, sprint) => {
        const boardId = Number(sprint.rapidId);
        (result[boardId] ||= []).push(sprint);
        return result;
    }, {});
}

/**
 * Resolves the sprints selected across all the boards. Duplicate sprints shared between boards are returned only once.
 */
export async function resolveSelectedSprints(selection: SprintSelectionMap | null | undefined): Promise<AgileSprint[]> {
    const boardIds = getSelectedBoardIds(selection);
    if (!selection || !boardIds.length) {
        return [];
    }

    const allSprints = await getBoardSprints(boardIds);
    const unique = new Map<number, AgileSprint>();

    boardIds.forEach((boardId) => {
        pickSelectedSprints(selection[boardId], allSprints[Number(boardId)]).forEach((s) => unique.set(s.id, s));
    });

    return [...unique.values()];
}

export function getSprintRangeLabel(selection: BoardSprintSelection | undefined): string {
    if (!selection) {
        return '';
    }
    if (selection.range === customSprintRange) {
        const count = getCustomSprintCount(selection);
        return `${count} sprint${count === 1 ? '' : 's'}`;
    }
    return sprintRangeOptions.find((o) => o.value === selection.range)?.label || '';
}

export function getSprintSelectionSummary(selection: SprintSelectionMap | null | undefined): string | null {
    const boardIds = getSelectedBoardIds(selection);
    if (!selection || !boardIds.length) {
        return null;
    }
    if (boardIds.length > 1) {
        return `${boardIds.length} boards`;
    }
    const board = selection[boardIds[0]];
    return `${board.name} · ${getSprintRangeLabel(board)}`;
}

export function formatSprintDates(sprint: AgileSprint): string {
    const { startDate } = sprint;
    const endDate = sprint.completeDate || sprint.endDate;
    if (!startDate || !endDate) {
        return '';
    }
    const from = new Date(startDate);
    const to = new Date(endDate);
    return `${format(from, isSameYear(from, to) ? 'dd MMM' : 'dd MMM yyyy')} – ${format(to, 'dd MMM yyyy')}`;
}

function toComparable(selection: SprintSelectionMap | null | undefined) {
    return Object.keys(selection || {})
        .sort()
        .map((boardId) => {
            const { selected, name, range, custom } = selection![boardId];
            return [boardId, !!selected, name, range, Object.keys(custom || {}).filter((id) => custom[id]).sort()];
        });
}

export function isSameSprintSelection(a: SprintSelectionMap | null | undefined, b: SprintSelectionMap | null | undefined): boolean {
    return JSON.stringify(toComparable(a)) === JSON.stringify(toComparable(b));
}

export function getSprintSelectionKey(selection: SprintSelectionMap | null | undefined): string {
    return JSON.stringify(
        getSelectedBoardIds(selection).map((boardId) => {
            const { range, custom } = selection![boardId];
            const sprintIds = range === customSprintRange ? Object.keys(custom || {}).filter((id) => custom[id]).sort() : [];
            return [boardId, range, sprintIds];
        }),
    );
}
