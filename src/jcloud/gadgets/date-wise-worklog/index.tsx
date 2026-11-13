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

function DayWiseWorklogGadget({ jiraContext }: DashboardItemProps) {
    const settings = getDashboardItemConfig<DateRangeGadgetSettings>(jiraContext);

    if (isDashboardItemEdit(jiraContext)) {
        return <DateRangeConfig hostType={getDashboardHostType(jiraContext)} settings={settings} />;
    }

    return (
        <div className="h-87.5 max-h-125 overflow-y-auto widget:h-full widget:max-h-none">
            <WorklogDisplay settings={settings} />
        </div>
    );
}

interface WorklogDisplayProps {
    settings: DateRangeGadgetSettings;
}

function WorklogDisplay({ settings }: WorklogDisplayProps) {
    const [worklogs, setWorklogs] = useState<Worklog[]>([]);
    const [loading, setLoading] = useState(true);

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
                    fromDate.setDate(fromDate.getDate() - 7);
                }

                const result = await $worklog.getWorklogs({ fromDate, toDate });
                setWorklogs(result || []);
            } catch (error) {
                console.error('Error loading worklogs:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return <GadgetMessage icon="fa-spinner" spin text="Loading worklogs..." />;
    }

    const groupedWorklogs = worklogs.reduce(
        (acc, worklog) => {
            const date = format(new Date(worklog.dateStarted!), 'yyyy-MM-dd');
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(worklog);
            return acc;
        },
        {} as Record<string, Worklog[]>,
    );

    if (worklogs.length === 0) {
        return <GadgetMessage icon="fa-calendar-times" text="No worklogs found for the selected date range" />;
    }

    return (
        <div className="space-y-3 p-3 widget:p-0">
            {Object.entries(groupedWorklogs).map(([date, logs]) => (
                <section key={date} className="overflow-hidden rounded-xl border border-(--border-primary) bg-(--bg-secondary)">
                    <header className="flex items-center justify-between gap-2 border-b border-(--border-primary) px-3 py-2">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-(--text-primary)">
                            <span className="fa fa-calendar-day text-xs text-(--primary-color)" />
                            {format(parseISO(date), 'EEE, dd MMM yyyy')}
                        </h3>
                        <span className="rounded-full bg-(--primary-light) px-2 py-0.5 text-xs font-semibold text-(--primary-color)">
                            {formatSeconds(logs.reduce((total, log) => total + (log.totalSecs || 0), 0))}
                        </span>
                    </header>
                    <ul className="divide-y divide-(--border-primary)">
                        {logs.map((log) => (
                            <li key={log.id} className="flex items-start gap-3 px-3 py-2">
                                <div className="min-w-0 flex-1">
                                    <div className="text-[13px] font-semibold text-(--text-primary)">{log.ticketNo}</div>
                                    {log.comment && (
                                        <div className="mt-0.5 line-clamp-2 text-xs text-(--text-secondary)" title={log.comment}>
                                            {log.comment}
                                        </div>
                                    )}
                                </div>
                                <span className="shrink-0 rounded-md bg-(--bg-tertiary) px-2 py-0.5 text-xs font-medium tabular-nums text-(--text-secondary)">
                                    {log.timeSpent}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

export default withInitParams(withSimpleAuth(DayWiseWorklogGadget));
