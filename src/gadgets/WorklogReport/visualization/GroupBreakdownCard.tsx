import { useMemo } from 'react';

import classNames from 'classnames';

import { getDimensionsForGroup, getGroupTotals, pluralize } from './breakdown-utils';
import BreakdownPanel from './BreakdownPanel';
import EstimatePanel from './EstimatePanel';
import HygienePanel from './HygienePanel';
import LoggingDelayPanel from './LoggingDelayPanel';
import TargetPanel from './TargetPanel';
import type { BreakdownDimension, DailyTarget, GroupTarget, VisualizationWorklog } from './types';

interface GroupBreakdownCardProps {
    title: string;
    worklogs: VisualizationWorklog[];
    reportUserGrp?: string;
    fieldDimensions: BreakdownDimension[];
    target?: GroupTarget | null;
    daily: DailyTarget;
    showEstimates: boolean;
    includeEpic: boolean;
    formatTime: (secs: number) => string;
}

function GroupBreakdownCard({ title, worklogs, reportUserGrp, fieldDimensions, target, daily, showEstimates, includeEpic, formatTime }: GroupBreakdownCardProps) {
    const totals = useMemo(() => getGroupTotals(worklogs), [worklogs]);
    const dimensions = useMemo(() => getDimensionsForGroup(fieldDimensions, reportUserGrp), [fieldDimensions, reportUserGrp]);

    const stats = [
        pluralize(totals.issueCount, 'issue'),
        pluralize(totals.worklogCount, 'worklog'),
        pluralize(totals.userCount, 'user'),
    ];

    const showTarget = !!target?.workingDays && target.users.length > 0;

    return (
        <article className="group-wise-charts @container rounded-xl border border-(--border-primary) bg-(--bg-primary) p-3 shadow-sm sm:p-5">
            <header className="group-chart-header mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-(--border-primary) pb-3">
                <div className="min-w-0">
                    <h3 className="m-0 truncate text-base font-semibold text-(--text-primary)">{title}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-(--text-secondary)">
                        {stats.map((s) => (
                            <span key={s}>{s}</span>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col items-start @sm:items-end">
                    <span className="text-xs tracking-wide text-(--text-secondary) uppercase">Total logged</span>
                    <span className="group-total text-xl font-semibold text-(--text-primary) tabular-nums">{formatTime(totals.timeSpent)}</span>
                </div>
            </header>
            <div className="group-insights mb-3 grid grid-cols-1 gap-3 @2xl:grid-cols-2">
                {showTarget && <TargetPanel target={target} daily={daily} formatTime={formatTime} />}
                {showEstimates && <EstimatePanel worklogs={worklogs} totalTimeSpent={totals.timeSpent} formatTime={formatTime} />}
                <LoggingDelayPanel worklogs={worklogs} totalTimeSpent={totals.timeSpent} formatTime={formatTime} />
                <HygienePanel worklogs={worklogs} totalTimeSpent={totals.timeSpent} includeEpic={includeEpic} formatTime={formatTime} />
            </div>
            <div className={classNames('group-breakdowns grid grid-cols-1 gap-3 @2xl:grid-cols-2', dimensions.length > 3 ? '@7xl:grid-cols-4' : '@5xl:grid-cols-3')}>
                {dimensions.map((d) => (
                    <BreakdownPanel key={d.key} dimension={d} worklogs={worklogs} totalTimeSpent={totals.timeSpent} formatTime={formatTime} />
                ))}
            </div>
        </article>
    );
}

export default GroupBreakdownCard;
