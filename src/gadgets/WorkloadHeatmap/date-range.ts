import { addDays, format, isSameYear, startOfDay, startOfWeek } from 'date-fns';

import { inject } from '@services';

import { getStartOfWeek } from '@utils';

import { noActiveSprintMessage } from './constants';
import type { HeatmapBoard, HeatmapDateRange, HeatmapRangeMode } from './types';

interface JiraSprint {
    id: number;
    name: string;
    state: string;
    startDate?: Date;
    endDate?: Date;
}

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

async function getActiveSprint(board: HeatmapBoard): Promise<JiraSprint | undefined> {
    const { $jira } = inject('JiraService');
    const sprints = (await $jira.getRapidSprintList([board.id], { state: 'active' })) as JiraSprint[];
    return sprints.find((s) => s.state === 'active' && s.startDate && s.endDate);
}

export async function resolveDateRange(rangeMode: HeatmapRangeMode, board: HeatmapBoard | null, offset: number): Promise<ResolvedRange> {
    if (rangeMode !== 'sprint') {
        return { range: getCalendarRange(rangeMode, offset) };
    }

    const sprint = board ? await getActiveSprint(board) : undefined;
    if (!sprint?.startDate || !sprint.endDate) {
        return { range: getCalendarRange('week', 0), warning: noActiveSprintMessage };
    }

    const fromDate = startOfDay(sprint.startDate);
    const toDate = startOfDay(sprint.endDate);
    return {
        range: { fromDate, toDate, label: formatRangeLabel(fromDate, toDate), sprintName: sprint.name },
    };
}
