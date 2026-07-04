import { useCallback, useEffect, useState } from 'react';

import { FullContext, view } from '@forge/bridge';
import { format } from 'date-fns';

import { DateTimePicker } from '@/controls';
import { withInitParams } from '@/layouts/initialization/index.plugin';
import type { Worklog } from '@/types';

import { inject } from '@services';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';
import { getRandomColor, prepareDateRange } from '../../utils';

interface GadgetSettings {
    dateRange?: {
        fromDate: string | Date;
        toDate: string | Date;
        auto?: boolean;
    };
    [key: string]: unknown;
}

interface WorklogBarChartProps {
    jiraContext: FullContext;
}

function WorklogBarChartGadget({ jiraContext }: WorklogBarChartProps) {
    const settings = jiraContext?.extension?.gadgetConfiguration || {};
    const isEdit = jiraContext?.extension?.entryPoint === 'edit';

    if (isEdit) {
        return <EditMode settings={settings} />;
    }

    return (
        <div className="h-100">
            <ChartDisplay settings={settings} />
        </div>
    );
}

interface EditModeProps {
    settings: GadgetSettings;
}

function EditMode({ settings }: EditModeProps) {
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
            <label className="block font-semibold mb-2">Worklog Date range</label>
            <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">From</label>
                    <DateTimePicker value={fromDate} onChange={handleFromChange} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">To</label>
                    <DateTimePicker value={toDate} onChange={handleToChange} />
                </div>
            </div>
        </div>
    );
}

interface ChartDisplayProps {
    settings: GadgetSettings;
}

interface DayData {
    date: string;
    totalSeconds: number;
    color: string;
}

function ChartDisplay({ settings }: ChartDisplayProps) {
    const [dayData, setDayData] = useState<DayData[]>([]);
    const [loading, setLoading] = useState(true);
    const [maxSeconds, setMaxSeconds] = useState(0);

    const { $worklog } = inject('WorklogService');

    useEffect(() => {
        (async () => {
            try {
                let fromDate: Date;
                let toDate: Date;

                if (settings.dateRange) {
                    const range = prepareDateRange(settings.dateRange as { fromDate: string | Date; toDate: string | Date });
                    fromDate = range.fromDate;
                    toDate = range.toDate;
                } else {
                    toDate = new Date();
                    fromDate = new Date();
                    fromDate.setDate(fromDate.getDate() - 30);
                }

                const worklogs: Worklog[] = (await $worklog.getWorklogs({ fromDate, toDate })) || [];

                const grouped = worklogs.reduce(
                    (acc, wl) => {
                        const date = format(new Date(wl.dateStarted!), 'yyyy-MM-dd');
                        acc[date] = (acc[date] || 0) + (wl.totalSecs || 0);
                        return acc;
                    },
                    {} as Record<string, number>,
                );

                const data = Object.entries(grouped)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, totalSeconds]) => ({
                        date,
                        totalSeconds,
                        color: getRandomColor(),
                    }));

                const max = Math.max(...data.map((d) => d.totalSeconds), 1);
                setMaxSeconds(max);
                setDayData(data);
            } catch (error) {
                console.error('Error loading chart data:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-full text-gray-500">Loading chart data...</div>;
    }

    if (dayData.length === 0) {
        return <div className="text-center p-4 text-gray-500">No worklogs found for the selected date range</div>;
    }

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex-1 flex items-end gap-1 overflow-x-auto pb-8">
                {dayData.map(({ date, totalSeconds, color }) => {
                    const heightPercent = (totalSeconds / maxSeconds) * 100;
                    const hours = Math.floor(totalSeconds / 3600);
                    const mins = Math.floor((totalSeconds % 3600) / 60);

                    return (
                        <div key={date} className="flex flex-col items-center flex-1 min-w-6">
                            <div className="text-xs mb-1 font-semibold">
                                {hours}h{mins > 0 ? `${mins}m` : ''}
                            </div>
                            <div
                                className="w-full rounded-t transition-all"
                                style={{ height: `${Math.max(heightPercent, 2)}%`, backgroundColor: color, minHeight: '4px' }}
                                title={`${date}: ${hours}h ${mins}m`}
                            />
                            <div className="text-xs mt-1 rotate-45 origin-top-left whitespace-nowrap">
                                {format(new Date(date), 'MMM dd')}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default withInitParams(withSimpleAuth(WorklogBarChartGadget));
