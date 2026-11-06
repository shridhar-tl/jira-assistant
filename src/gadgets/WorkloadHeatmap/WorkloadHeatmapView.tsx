import { Button } from '@components';

import { GadgetAlert } from '../shared';

import FilterSummary from './FilterSummary';
import HeatmapGrid from './HeatmapGrid';
import HeatmapLegend from './HeatmapLegend';
import HeatmapOverlay from './HeatmapOverlay';
import type { WorkloadHeatmapSettings } from './types';
import type { WorkloadHeatmapState } from './useWorkloadHeatmap';
import WorkloadHeatmapInfo from './WorkloadHeatmapInfo';

import './WorkloadHeatmap.css';

interface WorkloadHeatmapViewProps {
    settings: WorkloadHeatmapSettings;
    state: WorkloadHeatmapState;
    onSettingsChange: (changes: Partial<WorkloadHeatmapSettings>) => void;
}

const clearedFilters: Partial<WorkloadHeatmapSettings> = { projects: [], issueTypes: [], includeSubtasks: true };

const notConfiguredMessage = 'Provide the JQL to select the issues to be included in the heatmap.';
const noGroupsMessage =
    'None of the selected user groups have members. Add members to the groups under Settings → User groups or choose different groups.';
const noIssuesMessage = 'No unresolved issues assigned to the selected people were found.';

export default function WorkloadHeatmapView({ settings, state, onSettingsChange }: WorkloadHeatmapViewProps) {
    const { model, rangeWarning, error, isConfigured, reload } = state;

    const renderBody = () => {
        if (!isConfigured) {
            return <WorkloadHeatmapInfo note={notConfiguredMessage} />;
        }
        if (error) {
            return (
                <GadgetAlert action={<Button label="Retry" size="sm" layout="outlined" leftIcon={<i className="fa fa-refresh" />} onClick={reload} />}>
                    {error}
                </GadgetAlert>
            );
        }
        if (!model) {
            return null;
        }
        if (!model.groups.length) {
            return <WorkloadHeatmapInfo note={settings.scopeMode === 'jql' ? noIssuesMessage : noGroupsMessage} />;
        }
        return (
            <>
                <HeatmapOverlay>
                    <HeatmapGrid model={model} />
                </HeatmapOverlay>
                <div className="shrink-0 border-t border-(--border-primary) bg-(--bg-secondary) px-3 py-2">
                    <HeatmapLegend capacityPerDay={model.capacityPerDay} />
                </div>
            </>
        );
    };

    return (
        <div className="workload-heatmap flex h-full min-h-0 flex-col">
            {isConfigured && <FilterSummary settings={settings} onClear={() => onSettingsChange(clearedFilters)} />}
            {rangeWarning && (
                <GadgetAlert variant="warning" className="m-2 shrink-0">
                    {rangeWarning}
                </GadgetAlert>
            )}
            {renderBody()}
        </div>
    );
}
