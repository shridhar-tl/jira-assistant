import { memo, useCallback, type MouseEvent } from 'react';

import classNames from 'classnames';

import { loadLevelClassNames } from './constants';
import { formatHours, formatPercent } from './format-utils';
import { useHeatmapOverlay } from './overlay-context';
import type { HeatmapDay, UserDayLoad } from './types';

interface HeatmapCellProps {
    day: HeatmapDay;
    load: UserDayLoad;
    userName: string;
}

function HeatmapCell({ day, load, userName }: HeatmapCellProps) {
    const hasLoad = load.seconds > 0;
    const { open, scheduleClose } = useHeatmapOverlay();

    const showDetails = useCallback(
        (e: MouseEvent<HTMLElement>) => open(e.currentTarget, { kind: 'cell', userName, date: day.date, load }),
        [open, userName, day.date, load],
    );

    return (
        <td
            className={classNames('heat-cell h-11 min-w-16 cursor-pointer border-b border-r border-(--border-primary) px-1 text-center', {
                [loadLevelClassNames[load.level]]: hasLoad,
                'bg-(--bg-tertiary)': !hasLoad && !day.isWorkingDay,
                'heat-past': day.isPast,
                'heat-today': day.isToday,
            })}
            onMouseEnter={showDetails}
            onMouseLeave={scheduleClose}
            onClick={showDetails}
        >
            {hasLoad ? (
                <div className="flex flex-col leading-tight">
                    <span className="text-[13px] font-semibold tabular-nums">{formatPercent(load.percent)}</span>
                    <span className="text-[10px] tabular-nums opacity-80">{formatHours(load.seconds)}</span>
                </div>
            ) : (
                <span className="text-(--text-tertiary)">{day.isWorkingDay && !day.isPast ? '0%' : ''}</span>
            )}
        </td>
    );
}

export default memo(HeatmapCell);
