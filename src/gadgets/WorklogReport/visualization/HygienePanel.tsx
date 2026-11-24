import { useMemo } from 'react';

import classNames from 'classnames';

import { pluralize } from './breakdown-utils';
import { buildHygieneMetrics } from './insight-utils';
import type { HygieneMetric, VisualizationWorklog } from './types';
import VizPanel from './VizPanel';

interface HygienePanelProps {
    worklogs: VisualizationWorklog[];
    totalTimeSpent: number;
    includeEpic: boolean;
    formatTime: (secs: number) => string;
}

function HygieneTile({ metric, formatTime }: { metric: HygieneMetric; formatTime: (secs: number) => string }) {
    const { key, title, description, worklogCount, timeSpent, percentage } = metric;
    const isClean = !worklogCount;

    return (
        <div className="hygiene-tile flex min-w-0 flex-col gap-0.5 rounded-md bg-(--bg-primary) px-3 py-2" data-metric={key}>
            <div className="flex items-center justify-between gap-2">
                <span className="hygiene-title truncate text-xs font-semibold text-(--text-primary)">{title}</span>
                <i className={classNames('fa text-xs', isClean ? 'fa-check-circle text-emerald-500' : 'fa-exclamation-circle text-amber-500')} />
            </div>
            <span className="hygiene-time text-base font-semibold text-(--text-primary) tabular-nums">{isClean ? 'None' : formatTime(timeSpent)}</span>
            <span className="hygiene-detail text-xs text-(--text-secondary) tabular-nums">
                {isClean ? 'Nothing to fix' : `${pluralize(worklogCount, 'worklog')} · ${percentage}%`}
            </span>
            <span className="text-[11px] leading-snug text-(--text-secondary)">{description}</span>
        </div>
    );
}

function HygienePanel({ worklogs, totalTimeSpent, includeEpic, formatTime }: HygienePanelProps) {
    const metrics = useMemo(() => buildHygieneMetrics(worklogs, totalTimeSpent, includeEpic), [worklogs, totalTimeSpent, includeEpic]);
    const issueCount = metrics.filter((m) => m.worklogCount > 0).length;

    return (
        <VizPanel
            className="hygiene-panel"
            title="Logging hygiene"
            meta={issueCount ? `${pluralize(issueCount, 'thing')} to check` : 'All clean'}
            accentClass="bg-(--viz-hygiene)"
        >
            <div className="grid grid-cols-1 gap-2 px-2 @xs:grid-cols-2 @xl:grid-cols-3">
                {metrics.map((metric) => (
                    <HygieneTile key={metric.key} metric={metric} formatTime={formatTime} />
                ))}
            </div>
        </VizPanel>
    );
}

export default HygienePanel;
