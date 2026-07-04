import { useCallback, useEffect, useState } from 'react';

import { FullContext, view } from '@forge/bridge';
import { format } from 'date-fns';

import { DateTimePicker } from '@/controls';
import { withInitParams } from '@/layouts/initialization/index.plugin';
import type { Worklog } from '@/types';

import { inject } from '@services';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';
import { prepareDateRange } from '../../utils';

interface GadgetSettings {
    dateRange?: {
        fromDate: string | Date;
        toDate: string | Date;
        auto?: boolean;
    };
    [key: string]: unknown;
}

interface DayWiseWorklogGadgetProps {
    jiraContext: FullContext;
}

function DayWiseWorklogGadget({ jiraContext }: DayWiseWorklogGadgetProps) {
    const settings = jiraContext?.extension?.gadgetConfiguration || {};
    const isEdit = jiraContext?.extension?.entryPoint === 'edit';

    if (isEdit) {
        return <EditMode settings={settings} />;
    }

    return (
        <div className="h-87.5 max-h-125 overflow-y-auto">
            <WorklogDisplay settings={settings} />
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

interface WorklogDisplayProps {
    settings: GadgetSettings;
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
        return <div className="flex items-center justify-center h-full text-gray-500">Loading worklogs...</div>;
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
        return <div className="text-center p-4 text-gray-500">No worklogs found for the selected date range</div>;
    }

    return (
        <div className="p-4 space-y-4">
            {Object.entries(groupedWorklogs).map(([date, logs]) => (
                <div key={date}>
                    <h3 className="font-semibold text-gray-800 mb-2">{date}</h3>
                    <div className="space-y-2">
                        {logs.map((log) => (
                            <div key={log.id} className="pl-4 py-1 border-l-2 border-blue-500">
                                <div className="text-sm">
                                    <span className="font-semibold">{log.ticketNo}</span> - {log.timeSpent}
                                </div>
                                {log.comment && <div className="text-xs text-gray-500">{log.comment}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default withInitParams(withSimpleAuth(DayWiseWorklogGadget));
