import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useWorklogStore } from '@/stores/worklog-store';

import { inject } from '@services';

import { Button, Checkbox, showContextMenu } from '@components';

import { GadgetActionType } from '@constants';

import { Column, NoDataRow, ScrollableTable, TBody, THead } from '../components/shared/ScrollableTable';
import { Image } from '../controls';
import Link from '../controls/Link';
import AddBookmark from '../dialogs/AddBookmark';
import { Dialog } from '../dialogs/CommonDialog';
import { getRowStatus } from '../services/utils-service';

import { GadgetContainer, dashboardEventEmitter, useBaseGadget, type BaseGadgetProps } from './BaseGadget';
import { GadgetTitle } from './constants';

interface BookmarkItem {
    ticketNo: string;
    summary: string;
    assigneeName: string;
    reporterName: string;
    issuetype: string;
    issuetypeIcon: string;
    priority: string;
    priorityIcon: string;
    status: string;
    statusIcon: string;
    resolution: string;
    resolutionIcon: string;
    created: string;
    createdSortable: string;
    updated: string;
    updatedSortable: string;
    ticketUrl: string;
    selected: boolean;
    rowClass: string;
}

export default function MyBookmarks(props: BaseGadgetProps) {
    const [bookmarksList, setBookmarksList] = useState<BookmarkItem[]>([]);
    const [selAllChk, setSelAllChk] = useState(false);
    const [showAddPopup, setShowAddPopup] = useState(false);
    const selectedTicketRef = useRef<BookmarkItem | null>(null);

    const { getElapsedTimeInSecs, startTimer, pauseTimer, resumeTimer, stopTimer } = useWorklogStore();

    const gadgetHook = useBaseGadget(props, {
        title: GadgetTitle.Bookmarks,
    });

    const { setIsLoading, performAction } = gadgetHook;

    const refreshData = useCallback(() => {
        setIsLoading(true);
        setShowAddPopup(false);

        const { $bookmark, $userutils } = inject('BookmarkService', 'UserUtilsService');

        $bookmark.getBookmarks().then((result: any[]) => {
            result.forEach((b) => {
                b.ticketUrl = $userutils.getTicketUrl(b.ticketNo);
                b.selected = false;
                b.rowClass = getRowStatus(b);
            });

            setBookmarksList(result);
            setSelAllChk(false);
            setIsLoading(false);
        });
    }, [setIsLoading]);

    useEffect(() => {
        refreshData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const handler = (action: any) => {
            if (action?.type === GadgetActionType.TicketBookmarked) {
                refreshData();
            }
        };
        dashboardEventEmitter.on('change', handler);
        return () => {
            dashboardEventEmitter.removeListener('change', handler);
        };
    }, [refreshData]);

    const selectTicket = useCallback((ticket: BookmarkItem) => {
        setBookmarksList((prev) => prev.map((b) => (b.ticketNo === ticket.ticketNo ? { ...b, selected: !b.selected } : b)));
    }, []);

    const selectAll = useCallback((e: { value: boolean }) => {
        const checked = e.value;
        setSelAllChk(checked);
        setBookmarksList((prev) => prev.map((b) => ({ ...b, selected: checked })));
    }, []);

    const deleteBookmark = useCallback(
        (ticketNo?: string) => {
            let ids: string[];
            if (ticketNo) {
                ids = [ticketNo];
            } else {
                ids = bookmarksList.filter((b) => b.selected).map((b) => b.ticketNo);
            }

            const { $bookmark, $message } = inject('BookmarkService', 'MessageService');

            if (ids.length === 0) {
                $message.info('Select the bookmarks to be deleted!');
                return;
            }

            Dialog.confirmDelete('Are you sure to delete the selected bookmark(s)?', 'Confirm delete bookmark(s)').then(() => {
                setIsLoading(true);
                $bookmark.removeBookmark(ids).then((result: any[]) => {
                    setBookmarksList(result);
                    setIsLoading(false);
                });
            });
        },
        [bookmarksList, setIsLoading],
    );

    const addWorklogOn = useCallback(
        (ticketNo: string) => {
            performAction(GadgetActionType.AddWorklog, { ticketNo });
        },
        [performAction],
    );

    const contextMenu = useMemo(
        () => [
            {
                label: 'Select Bookmark',
                icon: 'fa fa-check-square',
                command: () => selectedTicketRef.current && selectTicket(selectedTicketRef.current),
            },
            {
                label: 'Add worklog',
                icon: 'fa fa-clock',
                command: () => selectedTicketRef.current && addWorklogOn(selectedTicketRef.current.ticketNo),
            },
            {
                label: 'Delete Bookmark',
                icon: 'fa fa-trash',
                command: () => selectedTicketRef.current && deleteBookmark(selectedTicketRef.current.ticketNo),
            },
        ],
        [selectTicket, addWorklogOn, deleteBookmark],
    );

    const showContext = useCallback(
        (e: React.MouseEvent, b: BookmarkItem) => {
            selectedTicketRef.current = b;

            const menus = [...contextMenu];

            const result = getElapsedTimeInSecs();
            const isCurTicket = result?.key === b.ticketNo;

            if (!isCurTicket) {
                menus.push({
                    label: 'Start timer',
                    icon: 'fa fa-play',
                    command: () => {
                        startTimer(b.ticketNo);
                    },
                });
            } else {
                if (result?.isRunning) {
                    menus.push({
                        label: 'Pause timer',
                        icon: 'fa fa-pause',
                        command: () => {
                            pauseTimer();
                        },
                    });
                } else {
                    menus.push({
                        label: 'Resume timer',
                        icon: 'fa fa-play',
                        command: () => {
                            resumeTimer();
                        },
                    });
                }
                menus.push({
                    label: 'Stop timer',
                    icon: 'fa fa-stop',
                    command: () => {
                        stopTimer();
                    },
                });
            }

            showContextMenu(e, menus);
        },
        [contextMenu, getElapsedTimeInSecs, startTimer, pauseTimer, resumeTimer, stopTimer],
    );

    const hideAddPopup = useCallback(
        (added?: boolean) => {
            if (added) {
                refreshData();
            } else {
                setShowAddPopup(false);
            }
        },
        [refreshData],
    );

    const customActions = useMemo(
        () => (
            <>
                <Button
                    layout="plain"
                    leftIcon={<i className="fa fa-plus" />}
                    onClick={() => setShowAddPopup(true)}
                    title="Add ticket to bookmarks"
                />
                <Button
                    layout="plain"
                    leftIcon={<i className="fa fa-trash" />}
                    onClick={() => deleteBookmark()}
                    title="Remove selected ticket(s) from bookmarks"
                />
            </>
        ),
        [deleteBookmark],
    );

    return (
        <GadgetContainer {...props} gadgetHook={gadgetHook} refreshData={refreshData} customActions={customActions}>
            <ScrollableTable dataset={bookmarksList} exportSheetName="My bookmarks">
                <THead>
                    <tr>
                        <Column className="w-10" noExport>
                            <Checkbox checked={selAllChk} onChange={selectAll} />
                        </Column>
                        <Column sortBy="ticketNo">Ticket No</Column>
                        <Column sortBy="issuetype">Type</Column>
                        <Column sortBy="summary">Summary</Column>
                        <Column sortBy="assigneeName">Assignee</Column>
                        <Column sortBy="reporterName">Reporter</Column>
                        <Column sortBy="priority">Priority</Column>
                        <Column sortBy="status">Status</Column>
                        <Column sortBy="resolution">Resolution</Column>
                        <Column sortBy="createdSortable">Created</Column>
                        <Column sortBy="updatedSortable">Updated</Column>
                    </tr>
                </THead>
                <TBody>
                    {(b: BookmarkItem) => (
                        <tr key={b.ticketNo} data-test-id={b.ticketNo} onContextMenu={(e) => showContext(e, b)} className={b.rowClass}>
                            <td>
                                {b.selected ? (
                                    <Checkbox checked onChange={() => selectTicket(b)} />
                                ) : (
                                    <i className="fa fa-ellipsis-v cursor-pointer" onClick={(e) => showContext(e, b)} />
                                )}
                            </td>
                            <td>
                                <Link href={b.ticketUrl} className="link strike">
                                    {b.ticketNo}
                                </Link>
                            </td>
                            <td>
                                {b.issuetypeIcon && <Image src={b.issuetypeIcon} />}
                                {b.issuetype}
                            </td>
                            <td>{b.summary}</td>
                            <td>{b.assigneeName}</td>
                            <td>{b.reporterName}</td>
                            <td>
                                {b.priorityIcon && <Image src={b.priorityIcon} />}
                                {b.priority}
                            </td>
                            <td>
                                {b.statusIcon && <Image src={b.statusIcon} />}
                                {b.status}
                            </td>
                            <td>
                                {b.resolutionIcon && <Image src={b.resolutionIcon} />}
                                {b.resolution}
                            </td>
                            <td>{b.created}</td>
                            <td>{b.updated}</td>
                        </tr>
                    )}
                </TBody>
                <NoDataRow span={11}>You have not yet bookmarked any tickets. Bookmark your frequently used tickets</NoDataRow>
            </ScrollableTable>
            {showAddPopup && <AddBookmark onHide={hideAddPopup} />}
        </GadgetContainer>
    );
}
