import { memo, useCallback } from 'react';

import { isSameSprintSelection, SprintSelector, type SprintSelectionMap } from '@components';

import { noSprintBoardsMessage } from './constants';
import DateRangeSelector from './DateRangeSelector';
import type { TimeInStatusDateRange, TimeInStatusSettings } from './types';

interface PeriodSelectorProps {
    settings: TimeInStatusSettings;
    onChange: (changes: Partial<TimeInStatusSettings>) => void;
}

function PeriodSelector({ settings, onChange }: PeriodSelectorProps) {
    const handleDateRangeChange = useCallback((dateRange: TimeInStatusDateRange) => onChange({ dateRange }), [onChange]);
    const currentSelection = settings.sprintSelection;
    const handleSprintChange = useCallback(
        (sprintSelection: SprintSelectionMap) => {
            if (!isSameSprintSelection(sprintSelection, currentSelection)) {
                onChange({ sprintSelection });
            }
        },
        [onChange, currentSelection],
    );

    if (settings.periodMode === 'sprint') {
        return (
            <SprintSelector
                boards={settings.sprintBoards}
                value={settings.sprintSelection}
                onChange={handleSprintChange}
                emptyMessage={noSprintBoardsMessage}
            />
        );
    }

    return <DateRangeSelector value={settings.dateRange} onChange={handleDateRangeChange} />;
}

export default memo(PeriodSelector);
