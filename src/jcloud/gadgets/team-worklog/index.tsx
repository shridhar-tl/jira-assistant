import { lazy, Suspense, useCallback, useEffect, useState } from 'react';

import { FullContext } from '@forge/bridge';

import { withInitParams } from '@/layouts/initialization/index.plugin';
import type { Worklog } from '@/types';

import { inject } from '@services';

import { BlockLoading } from '@components';

import { getUserName } from '@utils';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';
import { prepareDateRange } from '../../utils';

import type { TeamWorklogSettings } from './EditConfig';

const EditConfig = lazy(() => import('./EditConfig'));

interface TeamWorklogGadgetProps {
    jiraContext: FullContext;
}

function TeamWorklogGadget({ jiraContext }: TeamWorklogGadgetProps) {
    const gadgetConfig = jiraContext?.extension?.gadgetConfiguration || {};
    const initialSettings: TeamWorklogSettings = {
        ...gadgetConfig,
        disableAddingWL: true,
    };

    const [settings, setSettings] = useState<TeamWorklogSettings>(initialSettings);
    const isEdit = jiraContext?.extension?.entryPoint === 'edit';

    const handleSettingsChange = useCallback((newSettings: Partial<TeamWorklogSettings>) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
    }, []);

    if (isEdit) {
        return (
            <Suspense fallback={<BlockLoading text="Loading..." />}>
                <EditConfig settings={settings} onSettingsChange={handleSettingsChange} />
            </Suspense>
        );
    }

    return (
        <div className="h-160 max-h-175">
            <ReportDisplay settings={settings} />
        </div>
    );
}

interface ReportDisplayProps {
    settings: TeamWorklogSettings;
}

function ReportDisplay({ settings }: ReportDisplayProps) {
    const [worklogs, setWorklogs] = useState<Worklog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { $worklog } = inject('WorklogService');

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                let fromDate: Date;
                let toDate: Date;

                if (settings.dateRange?.fromDate && settings.dateRange?.toDate) {
                    const range = prepareDateRange(settings.dateRange);
                    fromDate = range.fromDate;
                    toDate = range.toDate;
                } else {
                    toDate = new Date();
                    fromDate = new Date();
                    fromDate.setDate(fromDate.getDate() - 14);
                }

                const result = await $worklog.getWorklogs({ fromDate, toDate });
                setWorklogs(result || []);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Unknown error occurred';
                setError(message);
                console.error('Error loading report data:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (error) {
        return (
            <div className="p-8">
                <strong>Error: </strong>
                {error}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8">
                <BlockLoading text="Loading report data..." />
            </div>
        );
    }

    if (worklogs.length === 0) {
        return <div className="p-8">No data returned matching your filter</div>;
    }

    const groupedByUser = worklogs.reduce(
        (acc, wl) => {
            const userKey = getUserName(wl.author || {}, true) || String(wl.createdBy) || 'Unknown';
            if (!acc[userKey]) {
                acc[userKey] = { displayName: wl.author?.displayName || userKey, worklogs: [] };
            }
            acc[userKey].worklogs.push(wl);
            return acc;
        },
        {} as Record<string, { displayName: string; worklogs: Worklog[] }>,
    );

    return (
        <div className="overflow-auto max-h-150">
            <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-white dark:bg-gray-800">
                    <tr>
                        <th className="text-left p-2 border-b border-gray-200 font-semibold">User</th>
                        <th className="text-left p-2 border-b border-gray-200 font-semibold">Ticket</th>
                        <th className="text-left p-2 border-b border-gray-200 font-semibold">Date</th>
                        <th className="text-left p-2 border-b border-gray-200 font-semibold">Time Spent</th>
                        <th className="text-left p-2 border-b border-gray-200 font-semibold">Comment</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(groupedByUser).map(([userKey, { displayName, worklogs: logs }]) =>
                        logs.map((log, idx) => (
                            <tr key={`${userKey}-${log.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                {idx === 0 && (
                                    <td className="p-2 border-b border-gray-100 font-semibold align-top" rowSpan={logs.length}>
                                        {displayName}
                                    </td>
                                )}
                                <td className="p-2 border-b border-gray-100">{log.ticketNo}</td>
                                <td className="p-2 border-b border-gray-100">
                                    {log.dateStarted ? new Date(log.dateStarted).toLocaleDateString() : ''}
                                </td>
                                <td className="p-2 border-b border-gray-100">{log.timeSpent}</td>
                                <td className="p-2 border-b border-gray-100 max-w-60 truncate">{log.comment}</td>
                            </tr>
                        )),
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default withInitParams(withSimpleAuth(TeamWorklogGadget));
