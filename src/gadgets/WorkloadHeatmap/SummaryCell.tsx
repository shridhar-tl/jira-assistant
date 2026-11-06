import { memo } from 'react';

import classNames from 'classnames';

import { loadLevelClassNames } from './constants';
import { formatHours, formatPercent } from './format-utils';
import type { LoadSummary } from './types';

interface SummaryCellProps {
    summary: LoadSummary;
    isToday?: boolean;
    isPast?: boolean;
    isWorkingDay?: boolean;
    emphasis?: boolean;
}

function SummaryCell({ summary, isToday, isPast, isWorkingDay = true, emphasis }: SummaryCellProps) {
    const hasLoad = summary.seconds > 0;
    const showValue = hasLoad || summary.capacity > 0;

    return (
        <td
            className={classNames('heat-cell h-9 min-w-16 border-b border-r border-(--border-primary) px-1 text-center', {
                [loadLevelClassNames[summary.level]]: hasLoad,
                'bg-(--bg-tertiary)': !hasLoad && !isWorkingDay,
                'heat-past': isPast,
                'heat-today': isToday,
                'font-semibold': emphasis,
            })}
            title={showValue ? `${formatHours(summary.seconds)} planned of ${formatHours(summary.capacity)} capacity` : undefined}
        >
            {showValue && (
                <div className="flex flex-col leading-tight">
                    <span className="text-xs font-semibold tabular-nums">{formatPercent(summary.percent)}</span>
                    <span className="text-[10px] tabular-nums opacity-80">{formatHours(summary.seconds)}</span>
                </div>
            )}
        </td>
    );
}

export default memo(SummaryCell);
