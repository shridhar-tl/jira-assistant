import { useCallback, useMemo, useState } from 'react';

import { Button } from '@components';

import { accentClasses, buildBreakdown, foldBreakdown, getBarWidth, pluralize } from './breakdown-utils';
import BreakdownRow from './BreakdownRow';
import type { BreakdownDimension, VisualizationWorklog } from './types';
import VizPanel from './VizPanel';

const visibleItemCount = 6;
const multiValuedNote = 'An issue with several values counts towards each of them';

interface BreakdownPanelProps {
    dimension: BreakdownDimension;
    worklogs: VisualizationWorklog[];
    totalTimeSpent: number;
    formatTime: (secs: number) => string;
}

function BreakdownPanel({ dimension, worklogs, totalTimeSpent, formatTime }: BreakdownPanelProps) {
    const [showAll, setShowAll] = useState(false);
    const toggleShowAll = useCallback(() => setShowAll((v) => !v), []);

    const items = useMemo(() => buildBreakdown(worklogs, dimension, totalTimeSpent), [worklogs, dimension, totalTimeSpent]);
    const { visible, others } = useMemo(() => foldBreakdown(items, visibleItemCount, totalTimeSpent), [items, totalTimeSpent]);

    const rows = showAll ? items : visible;
    const maxTimeSpent = Math.max(items[0]?.timeSpent ?? 0, showAll ? 0 : (others?.timeSpent ?? 0));
    const accentClass = accentClasses[dimension.accent];

    const toggle = others && (
        <Button className="breakdown-toggle cursor-pointer" layout="plain" size="xs" onClick={toggleShowAll}>
            {showAll ? 'Show less' : `Show all ${pluralize(items.length, dimension.unit)}`}
        </Button>
    );

    return (
        <VizPanel className="breakdown-panel" title={dimension.title} meta={pluralize(items.length, dimension.unit)} accentClass={accentClass} footer={toggle}>
            {dimension.multiValued && <p className="m-0 mb-1 px-2 text-xs text-(--text-secondary)">{multiValuedNote}</p>}
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                {rows.map((item) => (
                    <BreakdownRow key={item.label} item={item} barWidth={getBarWidth(item.timeSpent, maxTimeSpent)} barClassName={accentClass} formatTime={formatTime} />
                ))}
                {!showAll && others && (
                    <BreakdownRow item={others} barWidth={getBarWidth(others.timeSpent, maxTimeSpent)} barClassName="bg-(--viz-others)" isOthers formatTime={formatTime} />
                )}
            </ul>
        </VizPanel>
    );
}

export default BreakdownPanel;
