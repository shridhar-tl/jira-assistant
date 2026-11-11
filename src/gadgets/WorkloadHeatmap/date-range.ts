import { addDays, format, isSameYear, startOfDay, startOfWeek } from 'date-fns';

import { getStartOfWeek } from '@utils';

import { getBoardSprints, getSprintState, type AgileSprint } from '@components/shared/sprint-selector';

import { noActiveSprintMessage, openSprintStates, sprintNotPlannedMessage, sprintUnavailableMessage } from './constants';
import type { HeatmapBoard, HeatmapDateRange, HeatmapRangeMode } from './types';

type PlannedSprint = AgileSprint & { startDate: Date; endDate: Date };

export interface ResolvedRange {
    range: HeatmapDateRange;
    warning?: string;
}

export function formatRangeLabel(fromDate: Date, toDate: Date): string {
    const fromFormat = isSameYear(fromDate, toDate) ? 'dd MMM' : 'dd MMM yyyy';
    return `${format(fromDate, fromFormat)} – ${format(toDate, 'dd MMM yyyy')}`;
}

export function getCalendarRange(rangeMode: Exclude<HeatmapRangeMode, 'sprint'>, offset: number, today = new Date()): HeatmapDateRange {
    const length = rangeMode === 'week' ? 7 : 14;
    const fromDate = addDays(startOfWeek(startOfDay(today), { weekStartsOn: getStartOfWeek() }), offset * length);
    const toDate = addDays(fromDate, length - 1);
    return { fromDate, toDate, label: formatRangeLabel(fromDate, toDate) };
}

export async function getOpenSprints(boardId: number): Promise<AgileSprint[]> {
    const sprints = await getBoardSprints([boardId], openSprintStates);
    return sprints[boardId] || [];
}

function isPlanned(sprint: AgileSprint | undefined): sprint is PlannedSprint {
    return !!sprint?.startDate && !!sprint.endDate;
}

function toSprintRange(sprint: PlannedSprint, warning?: string): ResolvedRange {
    const fromDate = startOfDay(sprint.startDate);
    const toDate = startOfDay(sprint.endDate);
    return {
        range: { fromDate, toDate, label: formatRangeLabel(fromDate, toDate), sprintId: sprint.id, sprintName: sprint.name },
        warning,
    };
}

export async function resolveDateRange(
    rangeMode: HeatmapRangeMode,
    board: HeatmapBoard | null,
    sprintId: number | null,
    offset: number,
): Promise<ResolvedRange> {
    if (rangeMode !== 'sprint') {
        return { range: getCalendarRange(rangeMode, offset) };
    }

    const sprints = board ? await getOpenSprints(board.id) : [];
    const activeSprint = sprints.find((s): s is PlannedSprint => getSprintState(s) === 'active' && isPlanned(s));

    if (sprintId) {
        const sprint = sprints.find((s) => s.id === sprintId);
        if (isPlanned(sprint)) {
            return toSprintRange(sprint);
        }
        if (sprint) {
            return {
                range: { ...getCalendarRange('week', 0), sprintId: sprint.id, sprintName: sprint.name },
                warning: sprintNotPlannedMessage,
            };
        }
        if (activeSprint) {
            return toSprintRange(activeSprint, sprintUnavailableMessage);
        }
    }

    if (!activeSprint) {
        return { range: getCalendarRange('week', 0), warning: noActiveSprintMessage };
    }

    return toSprintRange(activeSprint);
}
