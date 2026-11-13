import { useCallback } from 'react';

import { DateTimePicker } from '@/controls';

import type { DashboardHostType } from '../dashboard-host';
import useDashboardItemConfig from '../useDashboardItemConfig';

import GadgetMessage from './GadgetMessage';

export interface DateRangeGadgetSettings {
    dateRange?: {
        fromDate: string | Date;
        toDate: string | Date;
        auto?: boolean;
    };
    [key: string]: unknown;
}

interface DateRangeConfigProps {
    hostType: DashboardHostType;
    settings: DateRangeGadgetSettings;
}

const incompleteRangeMessage = 'Select both the From and To dates, or clear both to use the default period.';

function validateDateRange(settings: DateRangeGadgetSettings): string | null {
    const { fromDate, toDate } = settings.dateRange || {};
    return !fromDate !== !toDate ? incompleteRangeMessage : null;
}

function parseDate(value?: string | Date): Date | undefined {
    return value ? new Date(value) : undefined;
}

export default function DateRangeConfig({ hostType, settings: initialSettings }: DateRangeConfigProps) {
    const { settings, saveError, isWidget, update, submit } = useDashboardItemConfig({
        hostType,
        initialSettings,
        validate: validateDateRange,
    });

    const fromDate = parseDate(settings.dateRange?.fromDate);
    const endDate = parseDate(settings.dateRange?.toDate);

    const handleChange = useCallback(
        (from: Date | undefined, to: Date | undefined) => {
            update({ dateRange: from || to ? { fromDate: from?.toISOString() ?? '', toDate: to?.toISOString() ?? '' } : undefined });
            if (!isWidget && from && to) {
                submit();
            }
        },
        [update, submit, isWidget],
    );

    const handleFromChange = useCallback((date: Date) => handleChange(date, endDate), [handleChange, endDate]);
    const handleToChange = useCallback((date: Date) => handleChange(fromDate, date), [handleChange, fromDate]);

    return (
        <div className="h-87.5 p-4">
            {saveError && <GadgetMessage icon="fa-exclamation-triangle" variant="error" title="Unable to save" text={saveError} />}
            <div className="rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-(--text-primary)">
                    <span className="fa fa-calendar text-(--primary-color)" />
                    Worklog Date range
                </div>
                <p className="mb-3 text-xs text-(--text-secondary)">
                    {isWidget
                        ? 'Choose the period for which worklogs should be shown, then save the widget.'
                        : 'Choose the period for which worklogs should be shown. The gadget is saved once both dates are selected.'}
                </p>
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex min-w-40 flex-1 flex-col gap-1">
                        <label className="text-xs font-medium text-(--text-secondary)">From</label>
                        <DateTimePicker value={fromDate} onChange={handleFromChange} />
                    </div>
                    <div className="flex min-w-40 flex-1 flex-col gap-1">
                        <label className="text-xs font-medium text-(--text-secondary)">To</label>
                        <DateTimePicker value={endDate} onChange={handleToChange} />
                    </div>
                </div>
            </div>
        </div>
    );
}
