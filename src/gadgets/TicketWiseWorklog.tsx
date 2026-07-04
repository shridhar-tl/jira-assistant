import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { subDays } from 'date-fns';

import { inject } from '@services';

import { showContextMenu } from '@components';

import { GadgetActionType } from '@constants';

import { Column, NoDataRow, ScrollableTable, TBody, THead } from '../components/shared/ScrollableTable';
import DateRangePicker from '../controls/DateRangePicker';
import Link from '../controls/Link';
import { DateDisplay } from '../display-controls';
import { formatTs, getRowStatus } from '../services/utils-service';

import { GadgetContainer, useBaseGadget, type BaseGadgetProps } from './BaseGadget';
import { GadgetTitle } from './constants';

interface WorklogEntry {
    id: number;
    worklogId?: number;
    dateLogged: string;
    uploaded: string;
    comments: string;
}

interface TicketWorklogItem {
    ticketNo: string;
    ticketUrl: string;
    summary: string;
    totalHours: string;
    uploaded: string;
    pendingUpload: string;
    parentKey: string;
    parentSumm: string;
    description: string;
    logData: WorklogEntry[];
    rowClass: string;
}

export default function TicketWiseWorklog(props: BaseGadgetProps) {
    const [worklogs, setWorklogs] = useState<TicketWorklogItem[]>([]);
    const selectedTicketRef = useRef<TicketWorklogItem | null>(null);

    const gadgetHook = useBaseGadget(props, {
        title: GadgetTitle.TicketWiseWorklog,
    });

    const { setIsLoading, addWorklog, editWorklog, performAction, settingsRef, saveSettings } = gadgetHook;
    const { $worklog, $userutils, $utils, $message } = inject('WorklogService', 'UserUtilsService', 'UtilsService', 'MessageService');

    const refreshData = useCallback(() => {
        const selDate = settingsRef.current.dateRange;
        if (!selDate || !selDate.fromDate) return;

        setIsLoading(true);
        selDate.dateWise = false;

        $worklog.getWorklogs(selDate).then((result: any[]) => {
            result.forEach((b) => {
                b.rowClass = getRowStatus(b);
                b.ticketUrl = $userutils.getTicketUrl(b.ticketNo);
                b.totalHours = formatTs(b.totalHours);
                b.uploaded = formatTs(b.uploaded);
                b.pendingUpload = formatTs(b.pendingUpload);
            });
            setWorklogs(result);
            setIsLoading(false);
        });
    }, [$worklog, $userutils, $utils, setIsLoading, settingsRef]);

    useEffect(() => {
        refreshData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const dateSelected = useCallback(
        (e: any) => {
            const date = e.value;
            settingsRef.current.dateRange = { fromDate: date[0], toDate: date[1], quickDate: e.range };
            if (date[1]) {
                refreshData();
                saveSettings();
            }
        },
        [settingsRef, refreshData, saveSettings],
    );

    const uploadWorklog = useCallback(async () => {
        if (!selectedTicketRef.current) return;
        const toUpload = selectedTicketRef.current.logData.filter((t) => !t.worklogId).map((t) => t.id);
        if (!toUpload.length) return;

        setIsLoading(true);
        try {
            await $worklog.uploadWorklogs(toUpload);
            refreshData();
            performAction(GadgetActionType.WorklogModified);
        } catch (err: any) {
            if (err.message) {
                $message.error(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, [$worklog, $message, setIsLoading, refreshData, performAction]);

    const addNewWorklog = useCallback(() => {
        if (!selectedTicketRef.current) return;
        const { ticketNo } = selectedTicketRef.current;
        const startTime = subDays(new Date(), 0);
        startTime.setHours(startTime.getHours() - 1);
        addWorklog({ ticketNo, startTime, timeSpent: '01:00', allowOverride: true });
    }, [addWorklog]);

    const showContext = useCallback(
        (e: React.MouseEvent, b: TicketWorklogItem) => {
            selectedTicketRef.current = b;
            showContextMenu(e, [
                { label: 'Upload worklog', icon: 'fa fa-clock', command: uploadWorklog },
                { label: 'Add worklog', icon: 'fa fa-bookmark', command: addNewWorklog },
            ]);
        },
        [uploadWorklog, addNewWorklog],
    );

    const dateRange = settingsRef.current.dateRange;

    const customActions = useMemo(
        () => <DateRangePicker value={dateRange} onChange={dateSelected} styles={{ marginRight: '35px' }} />,
        [dateRange, dateSelected],
    );

    return (
        <GadgetContainer
            {...props}
            gadgetHook={gadgetHook}
            refreshData={refreshData}
            customActions={customActions}
        >
            <ScrollableTable dataset={worklogs} exportSheetName="Ticketwise worklog">
                <THead>
                    <tr>
                        <Column sortBy="ticketNo" style={{ width: '100px' }}>
                            Ticket No
                        </Column>
                        <Column sortBy="summary">Summary</Column>
                        <Column sortBy="totalHours">Total Hours</Column>
                        <Column sortBy="uploaded">Uploaded</Column>
                        <Column sortBy="pendingUpload">Pending Upload</Column>
                        <Column sortBy="parentKey">Parent Ticket</Column>
                        <Column>Dates Logged</Column>
                        <Column style={{ width: '400px' }}>Description</Column>
                    </tr>
                </THead>
                <TBody>
                    {(b: TicketWorklogItem) => (
                        <tr key={b.ticketNo} onContextMenu={(e) => showContext(e, b)} className={b.rowClass}>
                            <td>
                                <Link href={b.ticketUrl} className="link strike">
                                    {b.ticketNo}
                                </Link>
                            </td>
                            <td>{b.summary}</td>
                            <td>{b.totalHours}</td>
                            <td>{b.uploaded}</td>
                            <td>{b.pendingUpload}</td>
                            <td>{b.parentKey ? `${b.parentKey} - ${b.parentSumm}` : ''}</td>
                            <td>
                                <ul className="flex flex-wrap gap-1">
                                    {b.logData?.map((ld, x) => (
                                        <li key={x}>
                                            {ld.worklogId ? (
                                                <Link
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-(--bg-secondary) text-primary hover:opacity-80"
                                                    href={$userutils.getWorklogUrl(b.ticketNo, ld.worklogId)}
                                                    title={ld.comments}
                                                >
                                                    <span className="fa fa-clock" /> <DateDisplay tag="span" value={ld.dateLogged} />:{' '}
                                                    {ld.uploaded}
                                                </Link>
                                            ) : (
                                                <span
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-(--bg-secondary) text-primary cursor-pointer hover:opacity-80"
                                                    onClick={() => editWorklog(ld.id)}
                                                    title={ld.comments}
                                                >
                                                    <span className="fa fa-clock" /> <DateDisplay tag="span" value={ld.dateLogged} />:{' '}
                                                    {ld.uploaded}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </td>
                            <td>{b.description}</td>
                        </tr>
                    )}
                </TBody>
                <NoDataRow span={8}>No records exist</NoDataRow>
            </ScrollableTable>
        </GadgetContainer>
    );
}
