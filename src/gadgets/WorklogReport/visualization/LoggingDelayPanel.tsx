import { useMemo } from 'react';

import { getBarWidth, pluralize, toPercentage } from './breakdown-utils';
import BreakdownRow from './BreakdownRow';
import { buildDelayBreakdown, delayBuckets, getAverageDelay } from './insight-utils';
import type { VisualizationWorklog } from './types';
import VizPanel from './VizPanel';

const delayBarClasses: Record<string, string> = {
    [delayBuckets.advance]: 'bg-(--viz-delay-advance)',
    [delayBuckets.sameDay]: 'bg-(--viz-delay-good)',
    [delayBuckets.nextDay]: 'bg-(--viz-delay-ok)',
    [delayBuckets.fewDays]: 'bg-(--viz-delay-warn)',
    [delayBuckets.week]: 'bg-(--viz-delay-late)',
    [delayBuckets.later]: 'bg-(--viz-delay-bad)',
};

interface LoggingDelayPanelProps {
    worklogs: VisualizationWorklog[];
    totalTimeSpent: number;
    formatTime: (secs: number) => string;
}

function formatAverage(days: number): string {
    if (days < 0.05) {
        return 'Logged on the day, on average';
    }
    return `Logged ${days.toFixed(1)} days after the work, on average`;
}

function LoggingDelayPanel({ worklogs, totalTimeSpent, formatTime }: LoggingDelayPanelProps) {
    const items = useMemo(() => buildDelayBreakdown(worklogs, totalTimeSpent), [worklogs, totalTimeSpent]);
    const averageDelay = useMemo(() => getAverageDelay(worklogs), [worklogs]);

    const sameDay = items.find((i) => i.label === delayBuckets.sameDay)?.worklogCount ?? 0;
    const maxTimeSpent = Math.max(0, ...items.map((i) => i.timeSpent));

    return (
        <VizPanel
            className="delay-panel"
            title="When work was logged"
            meta={`${toPercentage(sameDay, worklogs.length)}% same day`}
            accentClass="bg-(--viz-delay-good)"
        >
            <p className="delay-average m-0 mb-1 px-2 text-xs text-(--text-secondary)">
                {formatAverage(averageDelay)} · {pluralize(worklogs.length, 'worklog')}
            </p>
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                {items.map((item) => (
                    <BreakdownRow
                        key={item.label}
                        item={item}
                        barWidth={getBarWidth(item.timeSpent, maxTimeSpent)}
                        barClassName={delayBarClasses[item.label]}
                        formatTime={formatTime}
                    />
                ))}
            </ul>
        </VizPanel>
    );
}

export default LoggingDelayPanel;
