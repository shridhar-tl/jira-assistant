import { useEffect, useState } from 'react';

import { format, parseISO } from 'date-fns';

import { withInitParams } from '@/layouts/initialization/index.plugin';
import type { Worklog } from '@/types';

import { inject } from '@services';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';
import DateRangeConfig, { type DateRangeGadgetSettings } from '../../components/DateRangeConfig';
import GadgetMessage from '../../components/GadgetMessage';
import { type DashboardItemProps, getDashboardHostType, getDashboardItemConfig, isDashboardItemEdit } from '../../dashboard-host';
import { formatSeconds, prepareDateRange } from '../../utils';

function WorklogBarChartGadget({ jiraContext }: DashboardItemProps) {
    const settings = getDashboardItemConfig<DateRangeGadgetSettings>(jiraContext);

    if (isDashboardItemEdit(jiraContext)) {
        return <DateRangeConfig hostType={getDashboardHostType(jiraContext)} settings={settings} />;
    }

    return (
        <div className="h-100">
            <ChartDisplay settings={settings} />
        </div>
    );
}

interface ChartDisplayProps {
    settings: DateRangeGadgetSettings;
}

interface DayData {
    date: string;
    totalSeconds: number;
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
                    .map(([date, totalSeconds]) => ({ date, totalSeconds }));

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
        return <GadgetMessage icon="fa-spinner" spin text="Loading chart data..." />;
    }

    if (dayData.length === 0) {
        return <GadgetMessage icon="fa-chart-bar" text="No worklogs found for the selected date range" />;
    }

    const totalSeconds = dayData.reduce((total, d) => total + d.totalSeconds, 0);

    return (
        <div className="flex h-full flex-col p-3">
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-(--primary-light) px-2.5 py-0.5 text-xs font-semibold text-(--primary-color)">
                    Total: {formatSeconds(totalSeconds)}
                </span>
                <span className="rounded-full bg-(--bg-tertiary) px-2.5 py-0.5 text-xs font-medium text-(--text-secondary)">
                    {dayData.length} {dayData.length === 1 ? 'day' : 'days'}
                </span>
            </div>
            <div className="flex min-h-0 flex-1 gap-1.5 overflow-x-auto rounded-xl border border-(--border-primary) bg-(--bg-secondary) px-2 pt-2 pb-1">
                {dayData.map(({ date, totalSeconds: daySeconds }) => {
                    const heightPercent = (daySeconds / maxSeconds) * 100;
                    const dispTime = formatSeconds(daySeconds);
                    const day = parseISO(date);

                    return (
                        <div key={date} className="group flex h-full min-w-9 flex-1 flex-col items-center">
                            <div className="mb-1 text-[10px] font-semibold whitespace-nowrap tabular-nums text-(--text-secondary)">
                                {dispTime}
                            </div>
                            <div className="flex w-full flex-1 items-end justify-center border-b border-(--border-secondary)">
                                <div
                                    className="w-full max-w-8 rounded-t-md bg-blue-500 transition-colors group-hover:bg-blue-600 dark:bg-blue-400 dark:group-hover:bg-blue-300"
                                    style={{ height: `${Math.max(heightPercent, 2)}%`, minHeight: '4px' }}
                                    title={`${date}: ${dispTime}`}
                                />
                            </div>
                            <div className="mt-1 text-center text-[10px] leading-tight text-(--text-tertiary)">
                                <div className="font-semibold text-(--text-secondary)">{format(day, 'dd')}</div>
                                <div>{format(day, 'MMM')}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default withInitParams(withSimpleAuth(WorklogBarChartGadget));
