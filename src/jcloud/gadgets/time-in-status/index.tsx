import { lazy, Suspense, useCallback, useState } from 'react';

import { FullContext } from '@forge/bridge';

import { GadgetLoadingText } from '@/gadgets/shared';
import DateRangeSelector from '@/gadgets/TimeInStatus/DateRangeSelector';
import { normalizeSettings } from '@/gadgets/TimeInStatus/settings';
import TimeInStatusView from '@/gadgets/TimeInStatus/TimeInStatusView';
import type { StoredTimeInStatusSettings, TimeInStatusDateRange, TimeInStatusSettings } from '@/gadgets/TimeInStatus/types';
import useTimeInStatus from '@/gadgets/TimeInStatus/useTimeInStatus';
import { withInitParams } from '@/layouts/initialization/index.plugin';

import { BlockLoading, Loading, TooltipManager } from '@components';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';

const EditConfig = lazy(() => import('./EditConfig'));

interface TimeInStatusWidgetProps {
    jiraContext: FullContext;
}

function getStoredSettings(jiraContext: FullContext): TimeInStatusSettings {
    const extension = jiraContext?.extension;
    return normalizeSettings((extension?.config || extension?.gadgetConfiguration) as StoredTimeInStatusSettings | undefined);
}

function TimeInStatusWidget({ jiraContext }: TimeInStatusWidgetProps) {
    const isEdit = jiraContext?.extension?.entryPoint === 'edit';

    if (isEdit) {
        return (
            <Suspense fallback={<BlockLoading text="Loading..." />}>
                <EditConfig settings={getStoredSettings(jiraContext)} />
            </Suspense>
        );
    }

    return <TimeInStatusWidgetDisplay initialSettings={getStoredSettings(jiraContext)} />;
}

interface TimeInStatusWidgetDisplayProps {
    initialSettings: TimeInStatusSettings;
}

function TimeInStatusWidgetDisplay({ initialSettings }: TimeInStatusWidgetDisplayProps) {
    const [settings, setSettings] = useState(initialSettings);
    const state = useTimeInStatus(settings);

    const handleSettingsChange = useCallback((changes: Partial<TimeInStatusSettings>) => {
        setSettings((prev) => ({ ...prev, ...changes }));
    }, []);

    const handleDateRangeChange = useCallback((dateRange: TimeInStatusDateRange) => {
        setSettings((prev) => ({ ...prev, dateRange }));
    }, []);

    return (
        <div className="relative flex h-150 flex-col">
            <TooltipManager />
            {state.isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/20 backdrop-blur-[2px]">
                    <Loading size="lg" />
                    {state.loadingText && <GadgetLoadingText text={state.loadingText} />}
                </div>
            )}
            {state.isConfigured && (
                <div className="flex shrink-0 justify-end border-b border-(--border-primary) px-2 py-1">
                    <DateRangeSelector value={settings.dateRange} onChange={handleDateRangeChange} />
                </div>
            )}
            <div className="min-h-0 flex-1">
                <TimeInStatusView settings={settings} state={state} onSettingsChange={handleSettingsChange} bottleneckOnly />
            </div>
        </div>
    );
}

export default withInitParams(withSimpleAuth(TimeInStatusWidget));
