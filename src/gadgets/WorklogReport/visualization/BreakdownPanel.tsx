import { useCallback, useMemo, useState } from 'react';

import classNames from 'classnames';

import { Button } from '@components';

import { buildBreakdown, foldBreakdown, pluralize } from './breakdown-utils';
import BreakdownRow from './BreakdownRow';
import type { BreakdownAccent, BreakdownDimension, BreakdownItem, VisualizationWorklog } from './types';

const visibleItemCount = 6;
const minimumBarWidth = 1.5;

const accentClasses: Record<BreakdownAccent, string> = {
    epic: 'bg-(--viz-epic)',
    project: 'bg-(--viz-project)',
    'issue-type': 'bg-(--viz-issue-type)',
    status: 'bg-(--viz-status)',
};

interface BreakdownPanelProps {
    dimension: BreakdownDimension;
    worklogs: VisualizationWorklog[];
    totalTimeSpent: number;
    formatTime: (secs: number) => string;
}

function getBarWidth(item: BreakdownItem, maxTimeSpent: number): number {
    if (!maxTimeSpent || !item.timeSpent) {
        return 0;
    }
    return Math.max(minimumBarWidth, (item.timeSpent * 100) / maxTimeSpent);
}

function BreakdownPanel({ dimension, worklogs, totalTimeSpent, formatTime }: BreakdownPanelProps) {
    const [showAll, setShowAll] = useState(false);
    const toggleShowAll = useCallback(() => setShowAll((v) => !v), []);

    const items = useMemo(() => buildBreakdown(worklogs, dimension.field, totalTimeSpent), [worklogs, dimension.field, totalTimeSpent]);
    const { visible, others } = useMemo(() => foldBreakdown(items, visibleItemCount, totalTimeSpent), [items, totalTimeSpent]);

    const rows = showAll ? items : visible;
    const maxTimeSpent = Math.max(items[0]?.timeSpent ?? 0, showAll ? 0 : (others?.timeSpent ?? 0));
    const accentClass = accentClasses[dimension.accent];

    return (
        <section className="breakdown-panel flex min-w-0 flex-col rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-3 sm:p-4">
            <header className="mb-2 flex items-center gap-2 px-2">
                <span className={classNames('h-2.5 w-2.5 shrink-0 rounded-full', accentClass)} />
                <h4 className="breakdown-title m-0 flex-1 truncate text-sm font-semibold text-(--text-primary)">{dimension.title}</h4>
                <span className="breakdown-count shrink-0 text-xs text-(--text-secondary)">{pluralize(items.length, dimension.unit)}</span>
            </header>
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                {rows.map((item) => (
                    <BreakdownRow key={item.label} item={item} barWidth={getBarWidth(item, maxTimeSpent)} barClassName={accentClass} formatTime={formatTime} />
                ))}
                {!showAll && others && (
                    <BreakdownRow item={others} barWidth={getBarWidth(others, maxTimeSpent)} barClassName="bg-(--viz-others)" isOthers formatTime={formatTime} />
                )}
            </ul>
            {others && (
                <div className="mt-2 flex justify-center">
                    <Button className="breakdown-toggle cursor-pointer" layout="plain" size="xs" onClick={toggleShowAll}>
                        {showAll ? 'Show less' : `Show all ${pluralize(items.length, dimension.unit)}`}
                    </Button>
                </div>
            )}
        </section>
    );
}

export default BreakdownPanel;
