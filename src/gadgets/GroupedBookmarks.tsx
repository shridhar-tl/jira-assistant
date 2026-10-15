import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { useWorklogStore } from '@/stores/worklog-store';

import { inject } from '@services';

import { Button, Checkbox, Multiselect, showContextMenu } from '@components';

import { GadgetActionType } from '@constants';

import { Column, NoDataRow, ScrollableTable, TBody, THead } from '../components/shared/ScrollableTable';
import { Image } from '../controls';
import Link from '../controls/Link';
import AddBookmark from '../dialogs/AddBookmark';
import { Dialog } from '../dialogs/CommonDialog';
import { getRowStatus } from '../services/utils-service';

import { GadgetContainer, dashboardEventEmitter, useBaseGadget, type BaseGadgetProps } from './BaseGadget';
import { GadgetTitle } from './constants';
import { NoGroup, getActiveFilter, getGroupOptions, getVisibleRows, type SortState } from './grouped-bookmarks-utils';

interface BookmarkItem {
    ticketNo: string;
    group: string;
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
    rowClass: string;
}

/**
 * The shared table style gives every column at least 150px; the selection and group columns
 * only need their content, so they shrink to it and leave the room to the other columns
 */
const fitToContent: React.CSSProperties = { minWidth: 0, width: 1 };

interface GroupEditorProps {
    initial: string;
    listId: string;
    onDone: (value: string | null) => void;
}

/** Inline editor for one bookmark's group; Enter or leaving the field saves, Escape cancels */
function GroupEditor({ initial, listId, onDone }: GroupEditorProps) {
    const [value, setValue] = useState(initial);
    const finished = useRef(false);

    const finish = (result: string | null) => {
        if (!finished.current) {
            finished.current = true;
            onDone(result);
        }
    };

    return (
        <input
            autoFocus
            list={listId}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    finish(value);
                } else if (e.key === 'Escape') {
                    e.stopPropagation();
                    finish(null);
                }
            }}
            onBlur={() => finish(value)}
            placeholder="Group"
            aria-label="Bookmark group"
            className="w-full min-w-32 px-2 py-0.5 border border-(--border-color) rounded text-sm bg-(--bg-primary)"
        />
    );
}

export default function GroupedBookmarks(props: BaseGadgetProps) {
    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
    const [selected, setSelected] = useState<Set<string>>(() => new Set());
    const [editing, setEditing] = useState<string | null>(null);
    const [bulkGroup, setBulkGroup] = useState('');
    const [showAddPopup, setShowAddPopup] = useState(false);
    const groupsRef = useRef<Record<string, string>>({});
    const selectedTicketRef = useRef<BookmarkItem | null>(null);
    const listId = useId();

    const { getElapsedTimeInSecs, startTimer, pauseTimer, resumeTimer, stopTimer } = useWorklogStore();

    const gadgetHook = useBaseGadget(props, {
        title: GadgetTitle.GroupedBookmarks,
    });

    const { setIsLoading, performAction, settingsRef, saveSettings } = gadgetHook;

    // The filter and the sort order belong to this gadget and survive a reload
    const [groupFilter, setGroupFilter] = useState<string[]>(() => settingsRef.current.groupFilter || []);
    const [sort, setSort] = useState<SortState>(() => ({
        sortBy: settingsRef.current.sortBy || 'group',
        isDesc: !!settingsRef.current.isDesc,
    }));

    const toItems = useCallback((list: any[]): BookmarkItem[] => {
        const { $userutils } = inject('UserUtilsService');
        return list.map((b) => ({
            ...b,
            ticketUrl: $userutils.getTicketUrl(b.ticketNo) || '',
            rowClass: getRowStatus(b),
            group: groupsRef.current[b.ticketNo] || '',
        }));
    }, []);

    const refreshData = useCallback(() => {
        setIsLoading(true);
        setShowAddPopup(false);
        setEditing(null);

        const { $bookmark } = inject('BookmarkService');

        Promise.all([$bookmark.getBookmarks(), $bookmark.getBookmarkGroups()])
            .then(([list, groups]: [any[], Record<string, string>]) => {
                groupsRef.current = groups;
                setBookmarks(toItems(list));
                setSelected(new Set());
            })
            .finally(() => setIsLoading(false));
    }, [setIsLoading, toItems]);

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

    /** Sets (or, with an empty name, clears) the group of the given bookmarks */
    const applyGroup = useCallback(
        async (ticketNos: string[], name: string) => {
            const group = name.trim();
            const next = { ...groupsRef.current };
            ticketNos.forEach((t) => {
                if (group) {
                    next[t] = group;
                } else {
                    delete next[t];
                }
            });

            groupsRef.current = next;
            setBookmarks((prev) => prev.map((b) => (ticketNos.includes(b.ticketNo) ? { ...b, group } : b)));

            const { $bookmark, $message } = inject('BookmarkService', 'MessageService');
            try {
                await $bookmark.saveBookmarkGroups(next);
            } catch (err) {
                console.error('Unable to save bookmark groups', err);
                $message.error('Unable to save the bookmark group');
                refreshData();
            }
        },
        [refreshData],
    );

    const groupOptions = useMemo(() => getGroupOptions(bookmarks), [bookmarks]);
    const groupNames = useMemo(() => groupOptions.filter((o) => o.value !== NoGroup).map((o) => o.value), [groupOptions]);
    const activeFilter = useMemo(() => getActiveFilter(groupFilter, groupOptions), [groupFilter, groupOptions]);
    const visible = useMemo(() => getVisibleRows(bookmarks, activeFilter, sort), [bookmarks, activeFilter, sort]);

    const groupFilterChanged = useCallback(
        (values: string[]) => {
            setGroupFilter(values);
            // Rows that are filtered out must not stay selected, or delete / set group would reach them unseen
            setSelected(new Set());
            settingsRef.current.groupFilter = values;
            saveSettings();
        },
        [settingsRef, saveSettings],
    );

    const sortChanged = useCallback(
        (sortBy: string, isDesc: boolean) => {
            setSort({ sortBy, isDesc });
            settingsRef.current.sortBy = sortBy;
            settingsRef.current.isDesc = isDesc;
            saveSettings();
            return true;
        },
        [settingsRef, saveSettings],
    );

    const toggleSelected = useCallback((ticketNo: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(ticketNo)) {
                next.delete(ticketNo);
            } else {
                next.add(ticketNo);
            }
            return next;
        });
    }, []);

    const allVisibleSelected = visible.length > 0 && visible.every((b) => selected.has(b.ticketNo));

    const selectAllVisible = useCallback(
        (e: { value: boolean }) => {
            setSelected((prev) => {
                const next = new Set(prev);
                visible.forEach((b) => (e.value ? next.add(b.ticketNo) : next.delete(b.ticketNo)));
                return next;
            });
        },
        [visible],
    );

    const deleteBookmark = useCallback(
        (ticketNo?: string) => {
            const ids = ticketNo ? [ticketNo] : [...selected];
            const { $bookmark, $message } = inject('BookmarkService', 'MessageService');

            if (ids.length === 0) {
                $message.info('Select the bookmarks to be deleted!');
                return;
            }

            Dialog.confirmDelete('Are you sure to delete the selected bookmark(s)?', 'Confirm delete bookmark(s)').then(() => {
                setIsLoading(true);
                $bookmark
                    .removeBookmark(ids)
                    .then(async (result: any[]) => {
                        // A deleted bookmark takes its group with it
                        const next = { ...groupsRef.current };
                        ids.forEach((id) => delete next[id]);
                        groupsRef.current = next;
                        await $bookmark.saveBookmarkGroups(next);

                        setBookmarks(toItems(result));
                        setSelected(new Set());
                    })
                    .finally(() => setIsLoading(false));
            });
        },
        [selected, setIsLoading, toItems],
    );

    const addWorklogOn = useCallback(
        (ticketNo: string) => {
            performAction(GadgetActionType.AddWorklog, { ticketNo });
        },
        [performAction],
    );

    const showContext = useCallback(
        (e: React.MouseEvent, b: BookmarkItem) => {
            selectedTicketRef.current = b;

            const menus: any[] = [
                { label: 'Set group', icon: 'fa fa-tag', command: () => setEditing(b.ticketNo) },
                { label: 'Select Bookmark', icon: 'fa fa-check-square', command: () => toggleSelected(b.ticketNo) },
                { label: 'Add worklog', icon: 'fa fa-clock', command: () => addWorklogOn(b.ticketNo) },
                { label: 'Delete Bookmark', icon: 'fa fa-trash', command: () => deleteBookmark(b.ticketNo) },
            ];

            const timer = getElapsedTimeInSecs();
            if (timer?.key !== b.ticketNo) {
                menus.push({ label: 'Start timer', icon: 'fa fa-play', command: () => startTimer(b.ticketNo) });
            } else {
                if (timer.isRunning) {
                    menus.push({ label: 'Pause timer', icon: 'fa fa-pause', command: () => pauseTimer() });
                } else {
                    menus.push({ label: 'Resume timer', icon: 'fa fa-play', command: () => resumeTimer() });
                }
                menus.push({ label: 'Stop timer', icon: 'fa fa-stop', command: () => stopTimer() });
            }

            showContextMenu(e, menus);
        },
        [toggleSelected, addWorklogOn, deleteBookmark, getElapsedTimeInSecs, startTimer, pauseTimer, resumeTimer, stopTimer],
    );

    const applyBulkGroup = useCallback(() => {
        applyGroup([...selected], bulkGroup);
        setBulkGroup('');
    }, [applyGroup, selected, bulkGroup]);

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

    const hint = (
        <div className="max-w-xs text-xs">
            Click a bookmark&apos;s Group cell to give it a group of your choice — a project, a client, a theme — or select several
            bookmarks and set their group at once. Filter to the groups you need; the filter and the sort order are remembered for this
            gadget, and the groups are shared by every Grouped Bookmarks gadget.
        </div>
    );

    return (
        <GadgetContainer {...props} gadgetHook={gadgetHook} refreshData={refreshData} customActions={customActions} hint={hint}>
            <div className="flex flex-col h-full min-h-0">
                <datalist id={listId}>
                    {groupNames.map((g) => (
                        <option key={g} value={g} />
                    ))}
                </datalist>

                <div className="flex items-center gap-2 flex-wrap px-2 py-1.5 border-b border-(--border-color) shrink-0">
                    <span className="text-xs text-secondary">Groups</span>
                    <div className="flex-1 min-w-48 max-w-md">
                        <Multiselect
                            options={groupOptions}
                            value={activeFilter}
                            onChange={(e: any) => groupFilterChanged(e.value || [])}
                            placeholder="All groups"
                            emptyMessage="No groups yet"
                            searchable
                            showSelectAll
                        />
                    </div>

                    {selected.size > 0 && (
                        <div className="flex items-center gap-1.5 ml-auto">
                            <span className="text-xs text-secondary">{selected.size} selected</span>
                            <input
                                list={listId}
                                value={bulkGroup}
                                onChange={(e) => setBulkGroup(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyBulkGroup()}
                                placeholder="Group name"
                                aria-label="Group for the selected bookmarks"
                                className="w-40 px-2 py-1 border border-(--border-color) rounded text-sm bg-(--bg-primary)"
                            />
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={applyBulkGroup}
                                title={bulkGroup.trim() ? 'Put the selected bookmarks in this group' : 'Remove the selected bookmarks from their group'}
                            >
                                {bulkGroup.trim() ? 'Set group' : 'Clear group'}
                            </Button>
                        </div>
                    )}
                </div>

                <ScrollableTable dataset={visible} sortBy={sort.sortBy} isDesc={sort.isDesc} onSort={sortChanged} exportSheetName="Grouped bookmarks">
                    <THead>
                        <tr>
                            <Column style={fitToContent} noExport>
                                <Checkbox checked={allVisibleSelected} onChange={selectAllVisible} />
                            </Column>
                            <Column sortBy="group" style={fitToContent}>
                                Group
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
                                    {selected.has(b.ticketNo) ? (
                                        <Checkbox checked onChange={() => toggleSelected(b.ticketNo)} />
                                    ) : (
                                        <i className="fa fa-ellipsis-v cursor-pointer" onClick={(e) => showContext(e, b)} />
                                    )}
                                </td>
                                <td>
                                    {editing === b.ticketNo ? (
                                        <GroupEditor
                                            initial={b.group}
                                            listId={listId}
                                            onDone={(value) => {
                                                setEditing(null);
                                                if (value !== null && value.trim() !== b.group) {
                                                    applyGroup([b.ticketNo], value);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            className="group/cell text-left w-full min-h-5 cursor-pointer"
                                            onClick={() => setEditing(b.ticketNo)}
                                            title="Click to set the group"
                                            aria-label={b.group ? `Group: ${b.group}. Change` : 'Set group'}
                                        >
                                            {b.group ? (
                                                <span
                                                    className="inline-block max-w-56 truncate align-middle px-2 py-0.5 rounded bg-(--bg-secondary) text-sm"
                                                    title={b.group}
                                                >
                                                    {b.group}
                                                </span>
                                            ) : (
                                                // Drawn with ::after so the hint never ends up in an export as cell text
                                                <span className="text-xs text-secondary opacity-0 group-hover/cell:opacity-100 group-focus-visible/cell:opacity-100 after:content-['+_Set_group']" />
                                            )}
                                        </button>
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
                    <NoDataRow span={12}>
                        {bookmarks.length
                            ? 'No bookmarks in the selected groups.'
                            : 'You have not yet bookmarked any tickets. Bookmark your frequently used tickets'}
                    </NoDataRow>
                </ScrollableTable>
            </div>
            {showAddPopup && <AddBookmark onHide={hideAddPopup} />}
        </GadgetContainer>
    );
}
