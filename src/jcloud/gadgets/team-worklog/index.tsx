import { lazy, Suspense, useEffect, useState } from 'react';

import classNames from 'classnames';

import { withInitParams } from '@/layouts/initialization/index.plugin';
import type { Worklog } from '@/types';

import { inject } from '@services';

import { BlockLoading } from '@components';

import { getUserName } from '@utils';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';
import GadgetMessage from '../../components/GadgetMessage';
import { type DashboardItemProps, getDashboardHostType, getDashboardItemConfig, isDashboardItemEdit } from '../../dashboard-host';
import { prepareDateRange } from '../../utils';

import type { TeamWorklogSettings } from './EditConfig';

const EditConfig = lazy(() => import('./EditConfig'));

const tableHeaders = ['User', 'Ticket', 'Date', 'Time Spent', 'Comment'];
const headerCellClass = 'border-b border-(--border-primary) px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide';
const bodyCellClass = 'border-b border-(--border-primary) px-3 py-2';

function TeamWorklogGadget({ jiraContext }: DashboardItemProps) {
    const settings: TeamWorklogSettings = {
        ...getDashboardItemConfig<TeamWorklogSettings>(jiraContext),
        disableAddingWL: true,
    };

    if (isDashboardItemEdit(jiraContext)) {
        return (
            <Suspense fallback={<BlockLoading text="Loading..." />}>
                <EditConfig hostType={getDashboardHostType(jiraContext)} settings={settings} />
            </Suspense>
        );
    }

    return (
        <div className="h-160 max-h-175 widget:h-full widget:max-h-none">
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
        return <GadgetMessage icon="fa-exclamation-triangle" variant="error" title="Error" text={error} />;
    }

    if (loading) {
        return (
            <div className="p-8">
                <BlockLoading text="Loading report data..." />
            </div>
        );
    }

    if (worklogs.length === 0) {
        return <GadgetMessage icon="fa-users" text="No data returned matching your filter" />;
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
        <div className="max-h-150 overflow-auto p-2 widget:h-full widget:max-h-none widget:p-0">
            <div className="overflow-hidden rounded-xl border border-(--border-primary)">
                <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-1 bg-(--bg-tertiary) text-(--text-secondary)">
                        <tr>
                            {tableHeaders.map((header) => (
                                <th key={header} className={headerCellClass}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-(--text-primary)">
                        {Object.entries(groupedByUser).map(([userKey, { displayName, worklogs: logs }]) =>
                            logs.map((log, idx) => (
                                <tr key={`${userKey}-${log.id}-${idx}`} className="transition-colors hover:bg-(--bg-hover)">
                                    {idx === 0 && (
                                        <td
                                            className={classNames(bodyCellClass, 'bg-(--bg-secondary) font-semibold align-top')}
                                            rowSpan={logs.length}
                                        >
                                            {displayName}
                                        </td>
                                    )}
                                    <td className={classNames(bodyCellClass, 'font-medium text-(--primary-color)')}>{log.ticketNo}</td>
                                    <td className={classNames(bodyCellClass, 'whitespace-nowrap text-(--text-secondary)')}>
                                        {log.dateStarted ? new Date(log.dateStarted).toLocaleDateString() : ''}
                                    </td>
                                    <td className={classNames(bodyCellClass, 'whitespace-nowrap tabular-nums')}>{log.timeSpent}</td>
                                    <td
                                        className={classNames(bodyCellClass, 'max-w-60 truncate text-(--text-secondary)')}
                                        title={log.comment}
                                    >
                                        {log.comment}
                                    </td>
                                </tr>
                            )),
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default withInitParams(withSimpleAuth(TeamWorklogGadget));
