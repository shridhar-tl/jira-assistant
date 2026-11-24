import { useMemo } from 'react';

import classNames from 'classnames';

import { ProgressBar } from '@components';

import { Link } from '../../../controls';

import { toPercentage } from './breakdown-utils';
import { buildEstimateSummary } from './insight-utils';
import type { IssueEstimate, VisualizationWorklog } from './types';
import VizPanel from './VizPanel';

const allTimeNote = 'Estimates and logged time are for the whole issue, by everyone and at any time';

interface EstimatePanelProps {
    worklogs: VisualizationWorklog[];
    totalTimeSpent: number;
    formatTime: (secs: number) => string;
}

function EstimateStat({ label, value, detail, className }: { label: string; value: string; detail?: string; className: string }) {
    return (
        <div className={classNames(className, 'flex min-w-0 flex-col rounded-md bg-(--bg-primary) px-3 py-2')}>
            <span className="text-[11px] tracking-wide text-(--text-secondary) uppercase">{label}</span>
            <span className="estimate-stat-value text-base font-semibold text-(--text-primary) tabular-nums">{value}</span>
            {detail && <span className="estimate-stat-detail truncate text-xs text-(--text-secondary)">{detail}</span>}
        </div>
    );
}

function OverrunRow({ issue, formatTime }: { issue: IssueEstimate; formatTime: (secs: number) => string }) {
    const { ticketNo, summary, ticketUrl, originalEstimate, totalLogged, remainingEstimate, variance } = issue;
    const projected = totalLogged + remainingEstimate;
    const withinEstimate = Math.min(totalLogged, originalEstimate);

    return (
        <li className="overrun-row flex flex-col gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-(--bg-hover)" data-issue={ticketNo}>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate text-(--text-primary)" title={summary}>
                    {ticketUrl ? (
                        <Link href={ticketUrl} className="overrun-key link cursor-pointer font-medium">
                            {ticketNo}
                        </Link>
                    ) : (
                        <span className="overrun-key font-medium">{ticketNo}</span>
                    )}{' '}
                    <span className="text-(--text-secondary)">{summary}</span>
                </span>
                <span className="overrun-variance shrink-0 font-semibold text-rose-600 tabular-nums dark:text-rose-400">+{formatTime(variance)}</span>
            </div>
            <ProgressBar
                value={projected}
                max={projected}
                size="xs"
                layout="rounded"
                ariaLabel={`${ticketNo}: estimated ${formatTime(originalEstimate)}, projected ${formatTime(projected)}`}
                multipleValues={[
                    { value: withinEstimate, variant: 'primary', label: 'Logged within estimate' },
                    { value: totalLogged - withinEstimate, variant: 'danger', label: 'Logged over estimate' },
                    { value: remainingEstimate, variant: 'warning', label: 'Remaining' },
                ]}
            />
            <span className="overrun-detail text-xs text-(--text-secondary) tabular-nums">
                Estimated {formatTime(originalEstimate)} · logged {formatTime(totalLogged)}
                {remainingEstimate > 0 && ` · ${formatTime(remainingEstimate)} remaining`}
            </span>
        </li>
    );
}

function EstimatePanel({ worklogs, totalTimeSpent, formatTime }: EstimatePanelProps) {
    const summary = useMemo(() => buildEstimateSummary(worklogs), [worklogs]);
    const { issueCount, estimatedCount, overCount, totalEstimate, totalProjected, unestimatedTime, overruns } = summary;
    const projectedVariance = totalProjected - totalEstimate;

    return (
        <VizPanel className="estimate-panel" title="Estimate vs actual" meta={`${estimatedCount} of ${issueCount} estimated`} accentClass="bg-(--viz-estimate)">
            <div className="mb-2 grid grid-cols-2 gap-2 px-2 @lg:grid-cols-3">
                <EstimateStat
                    className="estimate-over"
                    label="Over estimate"
                    value={`${overCount} of ${estimatedCount}`}
                    detail={`${toPercentage(overCount, estimatedCount)}% of estimated issues`}
                />
                <EstimateStat
                    className="estimate-projected"
                    label="Estimated / projected"
                    value={`${formatTime(totalEstimate)} / ${formatTime(totalProjected)}`}
                    detail={projectedVariance ? `${projectedVariance > 0 ? '+' : '-'}${formatTime(Math.abs(projectedVariance))} overall` : 'Exactly as estimated'}
                />
                <EstimateStat
                    className="estimate-unestimated"
                    label="Logged unestimated"
                    value={formatTime(unestimatedTime)}
                    detail={`${toPercentage(unestimatedTime, totalTimeSpent)}% of the time in this report`}
                />
            </div>
            {overruns.length > 0 ? (
                <>
                    <h5 className="m-0 mt-1 mb-1 px-2 text-xs font-semibold tracking-wide text-(--text-secondary) uppercase">Largest overruns</h5>
                    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                        {overruns.map((issue) => (
                            <OverrunRow key={issue.ticketNo} issue={issue} formatTime={formatTime} />
                        ))}
                    </ul>
                </>
            ) : (
                <p className="estimate-none m-0 px-2 py-1 text-xs text-(--text-secondary)">{estimatedCount ? 'No issue has gone over its estimate.' : 'None of these issues have an estimate.'}</p>
            )}
            <p className="m-0 mt-2 px-2 text-[11px] text-(--text-secondary) italic">{allTimeNote}</p>
        </VizPanel>
    );
}

export default EstimatePanel;
