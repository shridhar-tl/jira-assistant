import { lazy, Suspense, useCallback, useState } from 'react';

import { FullContext } from '@forge/bridge';

import useWorkloadHeatmap from '@/gadgets/WorkloadHeatmap/useWorkloadHeatmap';
import HeatmapPeriodControls from '@/gadgets/WorkloadHeatmap/HeatmapPeriodControls';
import { normalizeSettings } from '@/gadgets/WorkloadHeatmap/settings';
import type { WorkloadHeatmapSettings } from '@/gadgets/WorkloadHeatmap/types';
import WorkloadHeatmapView from '@/gadgets/WorkloadHeatmap/WorkloadHeatmapView';
import { withInitParams } from '@/layouts/initialization/index.plugin';

import { BlockLoading, Loading, TooltipManager } from '@components';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';

const EditConfig = lazy(() => import('./EditConfig'));

interface WorkloadHeatmapWidgetProps {
    jiraContext: FullContext;
}

function getStoredSettings(jiraContext: FullContext): WorkloadHeatmapSettings {
    const extension = jiraContext?.extension;
    return normalizeSettings(extension?.config || extension?.gadgetConfiguration);
}

function WorkloadHeatmapWidget({ jiraContext }: WorkloadHeatmapWidgetProps) {
    const isEdit = jiraContext?.extension?.entryPoint === 'edit';

    if (isEdit) {
        return (
            <Suspense fallback={<BlockLoading text="Loading..." />}>
                <EditConfig settings={getStoredSettings(jiraContext)} />
            </Suspense>
        );
    }

    return <HeatmapWidgetDisplay initialSettings={getStoredSettings(jiraContext)} />;
}

interface HeatmapWidgetDisplayProps {
    initialSettings: WorkloadHeatmapSettings;
}

function HeatmapWidgetDisplay({ initialSettings }: HeatmapWidgetDisplayProps) {
    const [settings, setSettings] = useState(initialSettings);
    const state = useWorkloadHeatmap(settings);

    const handleSettingsChange = useCallback((changes: Partial<WorkloadHeatmapSettings>) => {
        setSettings((prev) => ({ ...prev, ...changes }));
    }, []);

    return (
        <div className="relative flex h-150 flex-col">
            <TooltipManager />
            {state.isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <Loading size="lg" />
                </div>
            )}
            {state.isConfigured && (
                <div className="flex shrink-0 justify-end border-b border-(--border-primary) px-2 py-1">
                    <HeatmapPeriodControls settings={settings} state={state} onSettingsChange={handleSettingsChange} />
                </div>
            )}
            <div className="min-h-0 flex-1">
                <WorkloadHeatmapView settings={settings} state={state} onSettingsChange={handleSettingsChange} />
            </div>
        </div>
    );
}

export default withInitParams(withSimpleAuth(WorkloadHeatmapWidget));
