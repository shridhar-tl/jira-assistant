import { getCapacityLevel } from '@/pages/planning/shared/capacity';
import CapacityBar from '@/pages/planning/shared/components/CapacityBar';

import { Button } from '@components';

import { GadgetAlert, HostText } from '../shared';

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
const noGroupsMessage = (
    <>
        None of the selected user groups have members.{' '}
        <HostText
            app="Add members to the groups under Settings → User groups or choose different groups."
            widget="Edit the widget and click Manage under Users and groups to add the groups and their members."
        />
    </>
);
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
                {settings.rangeMode === 'sprint' && model.total.capacity > 0 && (
                    <div className="shrink-0 border-b border-(--border-primary) px-3 py-2">
                        <CapacityBar
                            committed={model.total.seconds / 3600}
                            capacity={model.total.capacity / 3600}
                            level={getCapacityLevel(model.total.seconds, model.total.capacity)}
                            unit="h"
                            label="Remaining work in the sprint vs capacity of the team"
                        />
                    </div>
                )}
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
