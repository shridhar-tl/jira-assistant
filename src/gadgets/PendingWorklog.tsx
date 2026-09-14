import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useWorklogStore } from '@/stores/worklog-store';

import { inject } from '@services';

import { Button, ChangeTracker, Checkbox, showContextMenu } from '@components';

import { GadgetActionType } from '@constants';

import { Column, NoDataRow, ScrollableTable, TBody, THead } from '../components/shared/ScrollableTable';
import Link from '../controls/Link';
import { Dialog } from '../dialogs/CommonDialog';
import { formatTs, getRowStatus } from '../services/utils-service';

import { GadgetContainer, dashboardEventEmitter, useBaseGadget, type BaseGadgetProps } from './BaseGadget';
import { GadgetTitle } from './constants';

interface PendingWorklogItem {
    id: number;
    ticketNo: string;
    ticketUrl: string;
    summary: string;
    assignee: string;
    dateStarted: string;
    displayDate: string;
    timeSpent: string;
    description: string;
    overrideTimeSpent?: string;
    selected: boolean;
    rowClass: string;
    copy?: boolean;
}

export default function PendingWorklog(props: BaseGadgetProps) {
    const [worklogs, setWorklogs] = useState<PendingWorklogItem[]>([]);
    const [selAllChk, setSelAllChk] = useState(true);
    const selectedItemRef = useRef<PendingWorklogItem | null>(null);

    const { timerEntry, needReload } = useWorklogStore();

    const gadgetHook = useBaseGadget(props, {
        title: GadgetTitle.PendingWorklog,
    });

    const { setIsLoading, performAction, addWorklog } = gadgetHook;
    const { $worklog, $userutils, $message } = inject('WorklogService', 'UserUtilsService', 'MessageService');

    const refreshData = useCallback(() => {
        setIsLoading(true);

        return $worklog.getPendingWorklogs().then((result: any[]) => {
            setSelAllChk((selAllChk) => {
                result.forEach((w) => {
                    w.ticketUrl = $userutils.getTicketUrl(w.ticketNo);
                    w.rowClass = getRowStatus(w);
                    w.displayDate = $userutils.formatDateTime(w.dateStarted);
                    w.selected = selAllChk;
                    w.timeSpent = formatTs(w.overrideTimeSpent || w.timeSpent);
                });
                return selAllChk;
            });
            setWorklogs(result);
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        refreshData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const handler = (action: any) => {
            if (
                action?.type === GadgetActionType.AddWorklog ||
                action?.type === GadgetActionType.DeletedWorklog ||
                action?.type === GadgetActionType.WorklogModified
            ) {
                refreshData();
            }
        };
        dashboardEventEmitter.on('change', handler);
        return () => {
            dashboardEventEmitter.removeListener('change', handler);
        };
    }, [refreshData]);

    const selectRowItem = useCallback((item: PendingWorklogItem) => {
        setWorklogs((prev) => prev.map((w) => (w.id === item.id ? { ...w, selected: !w.selected } : w)));
    }, []);

    const selectAll = useCallback((e: { value: boolean }) => {
        const checked = e.value;
        setSelAllChk(checked);
        setWorklogs((prev) => prev.map((w) => ({ ...w, selected: checked })));
    }, []);

    const editWorklogObj = useCallback(
        (copy?: boolean) => {
            if (!selectedItemRef.current) return;
            const newObj = { ...selectedItemRef.current, copy };
            addWorklog(newObj);
        },
        [addWorklog],
    );

    const uploadWorklog = useCallback(
        async (items?: PendingWorklogItem[]) => {
            if (!items) {
                items = worklogs.filter((w) => w.selected);
            }
            const ids = items.map((w) => w.id);
            if (ids.length === 0) {
                $message.info('Select the worklogs to be uploaded!');
                return;
            }

            setIsLoading(true);
            try {
                const result = await $worklog.uploadWorklogs(ids);
                setWorklogs(result);
                performAction(GadgetActionType.WorklogModified);
            } catch (err: any) {
                if (err.message || err.response) {
                    $message.error(err.message || err.response);
                }
            } finally {
                refreshData();
            }
        },
        [worklogs, $worklog, $message, setIsLoading, performAction, refreshData],
    );

    const deleteWorklog = useCallback(
        (items?: PendingWorklogItem[]) => {
            if (!items) {
                items = worklogs.filter((w) => w.selected);
            }
            const ids = items.map((w) => w.id);
            if (ids.length === 0) {
                $message.info('Select the worklogs to be deleted!');
                return;
            }

            Dialog.confirmDelete('Are you sure to delete the selected worklog(s)?', 'Confirm delete worklog(s)').then(() => {
                setIsLoading(true);
                $worklog.deleteWorklogs(ids).then(() => {
                    refreshData();
                    performAction(GadgetActionType.DeletedWorklog);
                });
            });
        },
        [worklogs, $worklog, $message, setIsLoading, refreshData, performAction],
    );

    const showContext = useCallback(
        (e: React.MouseEvent, b: PendingWorklogItem) => {
            selectedItemRef.current = b;
            showContextMenu(e, [
                { label: 'Select worklog', icon: 'fa fa-check-square', command: () => selectRowItem(b) },
                { label: 'Edit worklog', icon: 'fa fa-edit', command: () => editWorklogObj() },
                { label: 'Copy worklog', icon: 'fa fa-copy', command: () => editWorklogObj(true) },
                { label: 'Upload worklog', icon: 'fa fa-upload', command: () => uploadWorklog([b]) },
                { label: 'Delete worklog', icon: 'fa fa-trash', command: () => deleteWorklog([b]) },
            ]);
        },
        [selectRowItem, editWorklogObj, uploadWorklog, deleteWorklog],
    );

    const customActions = useMemo(
        () => (
            <>
                <Button
                    layout="plain"
                    leftIcon={<i className="fa fa-upload" />}
                    onClick={() => uploadWorklog()}
                    title="Upload selected worklogs"
                    size="sm"
                />
                <Button
                    layout="plain"
                    leftIcon={<i className="fa fa-trash" />}
                    onClick={() => deleteWorklog()}
                    title="Delete selected worklogs"
                    size="sm"
                />
            </>
        ),
        [uploadWorklog, deleteWorklog],
    );

    const hint = (
        <ul className="gadget-hint">
            <li>List of worklog entries created and yet to be uploaded to Jira are shown here</li>
            <li>You can upload, edit or delete the entries from here or from worklog calendar</li>
        </ul>
    );

    return (
        <GadgetContainer {...props} gadgetHook={gadgetHook} refreshData={refreshData} customActions={customActions} hint={hint}>
            <ScrollableTable dataset={worklogs} exportSheetName="Pending worklogs">
                <THead>
                    <tr>
                        <Column className="w-10" noExport>
                            <Checkbox checked={selAllChk} onChange={selectAll} />
                        </Column>
                        <Column sortBy="ticketNo">Ticket No</Column>
                        <Column sortBy="summary">Summary</Column>
                        <Column sortBy="assignee">Assignee</Column>
                        <Column sortBy="dateStarted">Log Time</Column>
                        <Column sortBy="timeSpent">Time Spent</Column>
                        <Column>Description</Column>
                    </tr>
                </THead>
                <TBody>
                    {(b: PendingWorklogItem) => (
                        <tr key={b.id} onContextMenu={(e) => showContext(e, b)} className={b.rowClass} data-test-id={b.ticketNo}>
                            <td>
                                {b.selected ? (
                                    <Checkbox checked onChange={() => selectRowItem(b)} />
                                ) : (
                                    <i className="fa fa-ellipsis-v cursor-pointer" onClick={(e) => showContext(e, b)} />
                                )}
                            </td>
                            <td>
                                <Link href={b.ticketUrl} className="link strike">
                                    {b.ticketNo}
                                </Link>
                            </td>
                            <td>{b.summary}</td>
                            <td>{b.assignee}</td>
                            <td>{b.displayDate}</td>
                            <td>{b.timeSpent}</td>
                            <td>{b.description}</td>
                        </tr>
                    )}
                </TBody>
                <NoDataRow span={7}>No worklog pending to be uploaded!</NoDataRow>
            </ScrollableTable>
            <ChangeTracker key={timerEntry?.key} enabled={!gadgetHook.isLoading && needReload} onChange={refreshData} />
        </GadgetContainer>
    );
}
