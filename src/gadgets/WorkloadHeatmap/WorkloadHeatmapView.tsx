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
    onConfigure?: () => void;
}

const clearedFilters: Partial<WorkloadHeatmapSettings> = { projects: [], issueTypes: [], includeSubtasks: true };

const notConfiguredMessage = 'Provide the JQL to select the issues to be included in the heatmap.';
const noGroupsMessage =
    'None of the selected user groups have members. Add members to the groups under Settings → User groups or choose different groups.';
const noIssuesMessage = 'No unresolved issues assigned to the selected people were found.';

export default function WorkloadHeatmapView({ settings, state, onSettingsChange, onConfigure }: WorkloadHeatmapViewProps) {
    const { model, rangeWarning, error, isConfigured } = state;

    const renderBody = () => {
        if (!isConfigured) {
            return (
                <WorkloadHeatmapInfo
                    title="Configure the heatmap"
                    message={notConfiguredMessage}
                    actionLabel={onConfigure ? 'Configure' : undefined}
                    onAction={onConfigure}
                />
            );
        }
        if (error) {
            return <WorkloadHeatmapInfo icon="fa-exclamation-triangle" title="Failed to load data" message={error} />;
        }
        if (!model) {
            return null;
        }
        if (!model.groups.length) {
            return (
                <WorkloadHeatmapInfo
                    icon="fa-users"
                    title="Nobody to show"
                    message={settings.scopeMode === 'jql' ? noIssuesMessage : noGroupsMessage}
                    actionLabel={onConfigure ? 'Configure' : undefined}
                    onAction={onConfigure}
                />
            );
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
                <div className="shrink-0 border-b border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    {rangeWarning}
                </div>
            )}
            {renderBody()}
        </div>
    );
}
