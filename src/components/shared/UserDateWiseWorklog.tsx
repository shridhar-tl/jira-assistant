import { useEffect, useState } from 'react';

import { inject } from '@services';

import { WorklogIndicator } from '@components';

import Link from '../../controls/Link';
import { formatTs, getRowStatus } from '../../services/utils-service';

import { Column, NoDataRow, ScrollableTable, TBody, THead } from './ScrollableTable';

interface TicketLogEntry {
    id: number;
    worklogId?: number;
    ticketNo: string;
    uploaded: string;
    comment: string;
}

interface DateWiseWorklogItem {
    dateLogged: string;
    totalHours: string;
    totalSecs: number;
    uploaded: string;
    pendingUpload: number;
    ticketList: TicketLogEntry[];
    rowClass: string;
}

interface UserDateWiseWorklogProps {
    lastUpdated?: Date;
    settings: Record<string, any>;
    showContext?: (e: React.MouseEvent, b: DateWiseWorklogItem) => void;
    editWorklog?: (id: number | string) => void;
    setLoader?: (loading: boolean) => void;
}

export type { DateWiseWorklogItem };

function UserDateWiseWorklog({ lastUpdated, settings, showContext, editWorklog, setLoader }: UserDateWiseWorklogProps) {
    const [worklogs, setWorklogs] = useState<DateWiseWorklogItem[] | false>(false);
    const { $worklog, $userutils, $session } = inject('WorklogService', 'UserUtilsService', 'SessionService');
    const maxHours = ($session.CurrentUser?.maxHours || 8) * 60 * 60;

    useEffect(() => {
        (async () => {
            try {
                const selDate = settings.dateRange;
                if (!selDate) {
                    setWorklogs([]);
                    return;
                }

                if (!selDate.fromDate) {
                    setWorklogs([]);
                    return;
                }

                setLoader?.(true);
                selDate.dateWise = true;
                const result = await $worklog.getWorklogs(selDate);
                result.forEach((b: any) => {
                    b.rowClass = getRowStatus(b);
                });
                setWorklogs(result);
            } finally {
                setLoader?.(false);
            }
        })();
    }, [lastUpdated]); // eslint-disable-line react-hooks/exhaustive-deps

    if (worklogs === false) {
        return <div className="flex items-center justify-center p-8 text-secondary">Loading...</div>;
    }

    const getWorklogUrl = (ticketNo: string, worklogId: number | string) => $userutils.getWorklogUrl(ticketNo, worklogId);

    return (
        <ScrollableTable dataset={worklogs} exportSheetName="Datewise worklog">
            <THead>
                <tr>
                    <Column sortBy="dateLogged" style={{ width: '100px' }}>
                        Logged Date
                    </Column>
                    <Column sortBy="totalHours">Total Hours</Column>
                    <Column sortBy="uploaded">Uploaded</Column>
                    <Column sortBy="pendingUpload">Pending Upload</Column>
                    <Column>Ticket List</Column>
                </tr>
            </THead>
            <TBody className="no-log-bg-hl">
                {(b: DateWiseWorklogItem) => (
                    <tr key={b.dateLogged} onContextMenu={showContext ? (e) => showContext(e, b) : undefined} className={b.rowClass}>
                        <td>{$userutils.formatDate(b.dateLogged)}</td>
                        <td className="log-indi-cntr">
                            {formatTs(b.totalHours)}
                            {b.totalSecs > 0 && <WorklogIndicator value={b.totalSecs} maxHours={maxHours} />}
                        </td>
                        <td>{formatTs(b.uploaded)}</td>
                        <td>{formatTs(b.pendingUpload)}</td>
                        <td style={{ overflow: 'visible', maxWidth: 'none' }}>
                            <ul className="flex flex-row gap-1.5 py-0.5">
                                {b.ticketList.map((ld, x) => (
                                    <li key={x} className="list-none shrink-0">
                                        {ld.worklogId ? (
                                            <Link
                                                style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors shadow-sm hover:brightness-110"
                                                href={getWorklogUrl(ld.ticketNo, ld.worklogId)}
                                                title={ld.comment || ld.ticketNo}
                                            >
                                                <span className="fa fa-check-circle" />
                                                <span>{ld.ticketNo}</span>
                                                <span style={{ opacity: 0.85 }} className="font-normal">
                                                    {ld.uploaded}
                                                </span>
                                            </Link>
                                        ) : (
                                            <span
                                                style={{ backgroundColor: '#64748b', color: '#ffffff' }}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors shadow-sm hover:brightness-110"
                                                onClick={editWorklog ? () => editWorklog(ld.id) : undefined}
                                                title={ld.comment || ld.ticketNo}
                                            >
                                                <span className="fa fa-clock" />
                                                <span>{ld.ticketNo}</span>
                                                <span style={{ opacity: 0.85 }} className="font-normal">
                                                    {ld.uploaded}
                                                </span>
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </td>
                    </tr>
                )}
            </TBody>
            <NoDataRow span={5}>No worklog exists for selected date range!</NoDataRow>
        </ScrollableTable>
    );
}

export default UserDateWiseWorklog;
