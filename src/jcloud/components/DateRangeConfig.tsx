import { useCallback, useState } from 'react';

import { view } from '@forge/bridge';

import { DateTimePicker } from '@/controls';

export interface DateRangeGadgetSettings {
    dateRange?: {
        fromDate: string | Date;
        toDate: string | Date;
        auto?: boolean;
    };
    [key: string]: unknown;
}

interface DateRangeConfigProps {
    settings: DateRangeGadgetSettings;
}

export default function DateRangeConfig({ settings }: DateRangeConfigProps) {
    const [fromDate, setFromDate] = useState<Date | undefined>(
        settings.dateRange?.fromDate ? new Date(settings.dateRange.fromDate) : undefined,
    );
    const [toDate, setToDate] = useState<Date | undefined>(settings.dateRange?.toDate ? new Date(settings.dateRange.toDate) : undefined);

    const handleFromChange = useCallback(
        (date: Date) => {
            setFromDate(date);
            if (toDate) {
                view.submit({ ...settings, dateRange: { fromDate: date, toDate } });
            }
        },
        [settings, toDate],
    );

    const handleToChange = useCallback(
        (date: Date) => {
            setToDate(date);
            if (fromDate) {
                view.submit({ ...settings, dateRange: { fromDate, toDate: date } });
            }
        },
        [settings, fromDate],
    );

    return (
        <div className="h-87.5 p-4">
            <div className="rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-(--text-primary)">
                    <span className="fa fa-calendar text-(--primary-color)" />
                    Worklog Date range
                </div>
                <p className="mb-3 text-xs text-(--text-secondary)">
                    Choose the period for which worklogs should be shown. The gadget is saved once both dates are selected.
                </p>
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex min-w-40 flex-1 flex-col gap-1">
                        <label className="text-xs font-medium text-(--text-secondary)">From</label>
                        <DateTimePicker value={fromDate} onChange={handleFromChange} />
                    </div>
                    <div className="flex min-w-40 flex-1 flex-col gap-1">
                        <label className="text-xs font-medium text-(--text-secondary)">To</label>
                        <DateTimePicker value={toDate} onChange={handleToChange} />
                    </div>
                </div>
            </div>
        </div>
    );
}
