import { useCallback, useMemo } from 'react';

import DateRangePicker, { type DateSelectedCallbackArg } from '@/controls/DateRangePicker';

import type { DashboardHostType } from '../dashboard-host';
import useDashboardItemConfig from '../useDashboardItemConfig';
import { resolveStoredDateRange, type StoredDateRange } from '../utils';

import ConfigPanel from './ConfigPanel';
import ConfigSection from './ConfigSection';

export interface DateRangeGadgetSettings {
    dateRange?: StoredDateRange;
}

interface DateRangeConfigProps {
    hostType: DashboardHostType;
    settings: DateRangeGadgetSettings;
    defaultQuickDate: string;
}

export default function DateRangeConfig({ hostType, settings: initialSettings, defaultQuickDate }: DateRangeConfigProps) {
    const { settings, saveError, isWidget, update, submit } = useDashboardItemConfig({ hostType, initialSettings });

    const value = useMemo(() => resolveStoredDateRange(settings.dateRange, defaultQuickDate), [settings.dateRange, defaultQuickDate]);

    const handleChange = useCallback(
        ({ value: [fromDate, toDate], range }: DateSelectedCallbackArg) =>
            update({ dateRange: { fromDate: fromDate.toISOString(), toDate: toDate.toISOString(), quickDate: range } }),
        [update],
    );

    return (
        <ConfigPanel saveError={saveError} onSubmit={isWidget ? undefined : submit}>
            <ConfigSection
                icon="fa-calendar"
                title="Worklog date range"
                description="Pick a quick range such as Last 7 days to keep the period rolling, or choose fixed custom dates."
            >
                <DateRangePicker value={value} onChange={handleChange} className="w-full" />
            </ConfigSection>
        </ConfigPanel>
    );
}
