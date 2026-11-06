import classNames from 'classnames';

import { loadLevelClassNames } from './constants';
import { formatHours, formatPercent, formatShortDate } from './format-utils';
import IssueLink from './IssueLink';
import type { UserDayLoad } from './types';

interface CellIssueListProps {
    load: UserDayLoad;
}

export default function CellIssueList({ load }: CellIssueListProps) {
    const fillPercent = load.capacity > 0 ? Math.min(100, (load.seconds * 100) / load.capacity) : load.seconds > 0 ? 100 : 0;

    return (
        <div className="workload-heatmap flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                    <span className="text-lg font-semibold tabular-nums text-(--text-primary)">{formatPercent(load.percent)}</span>
                    <span className="text-xs tabular-nums text-(--text-secondary)">
                        {formatHours(load.seconds)} planned of {formatHours(load.capacity)}
                    </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-(--bg-tertiary)">
                    <div
                        className={classNames('heat-swatch h-full rounded-full', loadLevelClassNames[load.level])}
                        style={{ width: `${fillPercent}%` }}
                    />
                </div>
            </div>

            {!load.allocations.length && <div className="text-xs text-(--text-secondary)">No estimated work is planned for this day.</div>}

            {!!load.allocations.length && (
                <ul className="-mx-2 flex flex-col">
                    {load.allocations.map(({ issue, seconds, spanStart, spanEnd, isOverdue, isDerivedSpan }) => (
                        <li key={issue.key} className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-(--bg-hover)">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <IssueLink issue={issue} />
                                    <span className="rounded bg-(--bg-tertiary) px-1.5 text-[10px] font-medium text-(--text-secondary)">
                                        {issue.status}
                                    </span>
                                    {isOverdue && (
                                        <span className="rounded bg-red-100 px-1.5 text-[10px] font-semibold uppercase text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                            Overdue
                                        </span>
                                    )}
                                </div>
                                <div className="truncate text-xs text-(--text-primary)" title={issue.summary}>
                                    {issue.summary}
                                </div>
                                <div className="text-[11px] text-(--text-secondary)">
                                    {formatShortDate(spanStart)} – {formatShortDate(spanEnd)}
                                    {isDerivedSpan && ' · span estimated from due date'}
                                </div>
                            </div>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-(--text-primary)">
                                {formatHours(seconds)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
