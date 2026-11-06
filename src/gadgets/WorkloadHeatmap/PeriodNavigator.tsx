import { memo } from 'react';

import { Button } from '@components';

import type { HeatmapDateRange } from './types';

interface PeriodNavigatorProps {
    range: HeatmapDateRange | null;
    offset: number;
    canNavigate: boolean;
    onOffsetChange: (offset: number) => void;
}

function PeriodNavigator({ range, offset, canNavigate, onOffsetChange }: PeriodNavigatorProps) {
    if (!range) {
        return null;
    }

    const label = range.sprintName || range.label;

    return (
        <div className="flex items-center">
            {canNavigate && (
                <Button
                    layout="plain"
                    size="sm"
                    leftIcon={<i className="fa fa-chevron-left" />}
                    disabled={offset === 0}
                    onClick={() => onOffsetChange(offset - 1)}
                    title="Previous period"
                />
            )}
            {offset > 0 ? (
                <Button layout="plain" size="sm" label={label} onClick={() => onOffsetChange(0)} title="Go back to the current period" />
            ) : (
                <span
                    className="whitespace-nowrap px-1 text-xs font-medium text-(--text-secondary)"
                    title={range.sprintName ? range.label : undefined}
                >
                    {label}
                </span>
            )}
            {canNavigate && (
                <Button
                    layout="plain"
                    size="sm"
                    leftIcon={<i className="fa fa-chevron-right" />}
                    onClick={() => onOffsetChange(offset + 1)}
                    title="Next period"
                />
            )}
        </div>
    );
}

export default memo(PeriodNavigator);
