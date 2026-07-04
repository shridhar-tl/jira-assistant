import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { inject } from '@services';

import { GadgetActionType } from '@constants';

import { Column, NoDataRow, ScrollableTable, TBody, THead } from '../components/shared/ScrollableTable';
import { Image } from '../controls';
import { TicketDisplay, type TicketDisplayHandle } from '../display-controls';

import { GadgetContainer, useBaseGadget, type BaseGadgetProps } from './BaseGadget';
import { GadgetTitle } from './constants';

interface TicketItem {
    ticketNo: string;
    ticketUrl?: string;
    issuetype: string;
    issuetypeIcon: string;
    summary: string;
    reporter: string;
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
}

interface TicketRowProps {
    ticket: TicketItem;
    onAddWorklog: (ticketNo: string) => void;
    onBookmark: () => void;
}

const TicketRow = memo(function TicketRow({ ticket: b, onAddWorklog, onBookmark }: TicketRowProps) {
    const ticketRef = useRef<TicketDisplayHandle>(null);
    const showContext = useCallback((e: React.MouseEvent) => ticketRef.current?.showContext(e), []);

    return (
        <tr onContextMenu={showContext} data-test-id={b.ticketNo}>
            <TicketDisplay ref={ticketRef} value={b.ticketNo} url={b.ticketUrl} onAddWorklog={onAddWorklog} onBookmark={onBookmark} />
            <td>
                <Image src={b.issuetypeIcon} />
                {b.issuetype}
            </td>
            <td>{b.summary}</td>
            <td>{b.reporter}</td>
            <td>
                <Image src={b.priorityIcon} />
                {b.priority}
            </td>
            <td>
                <Image src={b.statusIcon} />
                {b.status}
            </td>
            <td>
                {b.resolutionIcon && <Image src={b.resolutionIcon} />}
                {b.resolution}
            </td>
            <td>{b.created}</td>
            <td>{b.updated}</td>
        </tr>
    );
});

export default function MyOpenTickets(props: BaseGadgetProps) {
    const [ticketList, setTicketList] = useState<TicketItem[]>([]);

    const gadgetHook = useBaseGadget(props, {
        title: GadgetTitle.OpenTicket,
    });

    const { setIsLoading, performAction } = gadgetHook;

    const addWorklogOn = useCallback(
        (ticketNo: string) => {
            performAction(GadgetActionType.AddWorklog, { ticketNo });
        },
        [performAction],
    );

    const bookmarkAdded = useCallback(() => {
        performAction(GadgetActionType.TicketBookmarked);
    }, [performAction]);

    const refreshData = useCallback(
        (refresh?: boolean) => {
            setIsLoading(true);
            const { $jira, $userutils } = inject('JiraService', 'UserUtilsService');

            $jira
                .getOpenTickets(refresh)
                .then((result: any[]) => {
                    const tickets = result.map((t: any) => {
                        const fields = t.fields;
                        return {
                            ticketNo: t.key,
                            ticketUrl: $userutils.getTicketUrl(t.key),
                            issuetypeIcon: (fields.issuetype || {}).iconUrl,
                            issuetype: (fields.issuetype || {}).name,
                            summary: fields.summary,
                            reporter: (fields.reporter || {}).displayName,
                            priorityIcon: (fields.priority || {}).iconUrl,
                            priority: (fields.priority || {}).name,
                            statusIcon: (fields.status || {}).iconUrl,
                            status: (fields.status || {}).name,
                            resolutionIcon: (fields.resolution || {}).iconUrl,
                            resolution: (fields.resolution || {}).name,
                            createdSortable: fields.created,
                            updatedSortable: fields.updated,
                            created: $userutils.formatDateTime(fields.created),
                            updated: $userutils.formatDateTime(fields.updated),
                        };
                    });
                    setTicketList(tickets);
                })
                .finally(() => setIsLoading(false));
        },
        [setIsLoading],
    );

    useEffect(() => {
        refreshData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const hint = (
        <ul className="gadget-hint">
            <li>By default, unresolved ticket list assigned to you are shown in this gadget</li>
            <li>You can control the list of tickets to be shown, by editing "Open tickets JQL" in Advanced Settings</li>
            <li>Right click on any ticket to start time tracking or see more options</li>
        </ul>
    );

    return (
        <GadgetContainer
            {...props}
            gadgetHook={gadgetHook}
            refreshData={() => refreshData(true)}
            hint={hint}
        >
            <ScrollableTable dataset={ticketList} exportSheetName="My open tickets">
                <THead>
                    <tr>
                        <Column sortBy="ticketNo">Ticket No</Column>
                        <Column sortBy="issuetype">Type</Column>
                        <Column sortBy="summary">Summary</Column>
                        <Column sortBy="reporter">Reporter</Column>
                        <Column sortBy="priority">Priority</Column>
                        <Column sortBy="status">Status</Column>
                        <Column sortBy="resolution">Resolution</Column>
                        <Column sortBy="createdSortable">Created</Column>
                        <Column sortBy="updatedSortable">Updated</Column>
                    </tr>
                </THead>
                <TBody>
                    {(b: TicketItem) => <TicketRow key={b.ticketNo} ticket={b} onAddWorklog={addWorklogOn} onBookmark={bookmarkAdded} />}
                </TBody>
                <NoDataRow span={9}>No open tickets were assigned to you. Enjoy your day!</NoDataRow>
            </ScrollableTable>
        </GadgetContainer>
    );
}
