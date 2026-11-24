import { useCallback, type MouseEvent } from 'react';

import classNames from 'classnames';

import { hideTooltip, showTooltip } from '@components';

import type { BreakdownItem } from './types';

interface BreakdownRowProps {
    item: BreakdownItem;
    barWidth: number;
    barClassName: string;
    isOthers?: boolean;
    formatTime: (secs: number) => string;
}

function BreakdownRow({ item, barWidth, barClassName, isOthers, formatTime }: BreakdownRowProps) {
    const { label, timeSpent, percentage, worklogCount, issueCount } = item;
    const timeDisplay = formatTime(timeSpent);

    const onMouseEnter = useCallback(
        (e: MouseEvent) =>
            showTooltip(e, {
                placement: 'topLeft',
                content: (
                    <div className="flex max-w-72 flex-col gap-1 text-xs">
                        <span className="font-semibold break-words">{label}</span>
                        <span>
                            {timeDisplay} · {percentage}%
                        </span>
                        <span>
                            {worklogCount} worklog{worklogCount === 1 ? '' : 's'} on {issueCount} issue{issueCount === 1 ? '' : 's'}
                        </span>
                    </div>
                ),
            }),
        [label, timeDisplay, percentage, worklogCount, issueCount],
    );

    const onMouseLeave = useCallback(() => hideTooltip({ timeout: 0 }), []);

    return (
        <li
            className="breakdown-row flex flex-col gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-(--bg-hover)"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span
                    className={classNames('breakdown-label line-clamp-2 min-w-0 break-words', isOthers ? 'text-(--text-secondary) italic' : 'text-(--text-primary)')}
                >
                    {label}
                </span>
                <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                    <span className="breakdown-time font-semibold text-(--text-primary)">{timeDisplay}</span>
                    <span className="breakdown-percent w-12 text-right text-xs text-(--text-secondary)">{percentage}%</span>
                </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-(--viz-track)">
                <div
                    className={classNames('h-full rounded-full transition-[width] duration-500 ease-out', barClassName)}
                    style={{ width: `${barWidth}%` }}
                />
            </div>
        </li>
    );
}

export default BreakdownRow;
