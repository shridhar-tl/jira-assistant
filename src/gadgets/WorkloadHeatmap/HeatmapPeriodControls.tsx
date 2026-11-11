import { memo, useCallback } from 'react';

import PeriodNavigator from './PeriodNavigator';
import SprintSwitcher from './SprintSwitcher';
import type { WorkloadHeatmapSettings } from './types';
import type { WorkloadHeatmapState } from './useWorkloadHeatmap';

interface HeatmapPeriodControlsProps {
    settings: WorkloadHeatmapSettings;
    state: WorkloadHeatmapState;
    onSettingsChange: (changes: Partial<WorkloadHeatmapSettings>) => void;
}

function HeatmapPeriodControls({ settings, state, onSettingsChange }: HeatmapPeriodControlsProps) {
    const handleSprintChange = useCallback((sprintId: number | null) => onSettingsChange({ sprintId }), [onSettingsChange]);

    if (settings.rangeMode === 'sprint' && settings.board) {
        return (
            <SprintSwitcher boardId={settings.board.id} sprintId={settings.sprintId} range={state.range} onChange={handleSprintChange} />
        );
    }

    return <PeriodNavigator range={state.range} offset={state.offset} canNavigate={state.canNavigate} onOffsetChange={state.setOffset} />;
}

export default memo(HeatmapPeriodControls);
