import React, { useCallback } from 'react';

import Indicator from '../../../components/worklog-indicator';
import { addWorklog } from '../actions';
import { useWorklogStore, useWorklogDispatch } from '../datastore';

import TicketRow from './TicketRow';
import { useConvertSecs, useFormatTime } from './useReportUtils';

function getUserName(user: any, includeEmail?: boolean): string {
    if (!user) return '';
    const name = user.name || user.emailAddress || user.displayName || '';
    return includeEmail && user.emailAddress ? user.emailAddress : name;
}

function getImageUrl(user: any) {
    return user.imageUrl || user.avatarUrls?.['48x48'] || user.avatarUrls?.['32x32'];
}

interface UserRowProps {
    groupIndex: number;
    index: number;
    user: any;
    colSpan: number;
    additionalCols?: any[];
    boardId?: string;
    costView?: boolean;
    timeExportFormat?: string;
}

export default function UserRow({ groupIndex, user: u, colSpan, additionalCols, boardId, costView, timeExportFormat }: UserRowProps) {
    const state = useWorklogStore();
    const dispatch = useWorklogDispatch();
    const { userDisplayFormat, timeframeType, userExpnState, expandUsers } = state;

    const isSprint = timeframeType === '1';
    const sprintsList = isSprint ? state[`sprintsList_${boardId}`] : undefined;

    const uid = getUserName(u);
    const expandKey = `${boardId}_${groupIndex}_${uid}`;
    const expanded = userExpnState[expandKey] ?? expandUsers;

    const detailedDisp = userDisplayFormat !== '1';

    const convertSecs = useConvertSecs();
    const formatTime = useFormatTime();

    const toggleDisplay = useCallback(
        (e: any) => {
            if (!e.nativeEvent.target.classList.contains('add-wl')) {
                const newState = { ...userExpnState };
                newState[expandKey] = !expanded;
                dispatch({ userExpnState: newState });
            }
        },
        [expandKey, expanded, userExpnState, dispatch],
    );

    const addNewWorklog = useCallback(
        (ticketNo: string | null, day: any) => {
            const addWl = addWorklog(dispatch);
            addWl(u, ticketNo || '', day.date, u.total?.[day.prop] || 0);
        },
        [dispatch, u],
    );

    return (
        <>
            <tr className="pointer auto-wrap" onClick={toggleDisplay} data-current-user={u.isCurrentUser ? '1' : '0'} data-row-id="user">
                <td className="data-left" colSpan={colSpan}>
                    <div className={detailedDisp ? 'user-info' : 'user-info-min'} style={{ paddingLeft: 0 }}>
                        <i
                            className={`float-start drill-down fa ${expanded ? 'fa-chevron-circle-down' : 'fa-chevron-circle-right'}`}
                            title="Click to toggle ticket details"
                        />
                        {detailedDisp && <img src={getImageUrl(u)} height={40} width={40} className="float-start" alt={u.displayName} />}
                        <span className="name">{u.displayName}</span>
                        {detailedDisp && (
                            <span className="email">
                                ({u.emailAddress || u.name}
                                {u.timeZone && <span>, time zone: {u.timeZone}</span>})
                            </span>
                        )}
                    </div>
                </td>

                {isSprint &&
                    sprintsList?.map(({ id }: any) => (
                        <UserDatesDisplay
                            key={id}
                            sprintId={id}
                            uid={uid}
                            boardId={boardId}
                            groupIndex={groupIndex}
                            costView={costView}
                            timeExportFormat={timeExportFormat}
                            addNewWorklog={addNewWorklog}
                        />
                    ))}
                {!isSprint && (
                    <UserDatesDisplay
                        uid={uid}
                        groupIndex={groupIndex}
                        costView={costView}
                        timeExportFormat={timeExportFormat}
                        addNewWorklog={addNewWorklog}
                    />
                )}

                {isSprint && costView && <td data-export-type="float">{u.allSprintTotalCost}</td>}
                {isSprint && !costView && <td data-export-type={timeExportFormat}>{convertSecs(u.allSprintTotalHours)}</td>}
            </tr>

            {expanded && (
                <UserTickets
                    isSprint={isSprint}
                    groupIndex={groupIndex}
                    boardId={boardId}
                    uid={uid}
                    user={u}
                    costView={costView}
                    sprintsList={sprintsList}
                    addNewWorklog={addNewWorklog}
                    timeExportFormat={timeExportFormat}
                    additionalCols={additionalCols}
                    convertSecs={convertSecs}
                    formatTime={formatTime}
                />
            )}
        </>
    );
}

interface UserDatesDisplayProps {
    sprintId?: number;
    uid: string;
    boardId?: string;
    groupIndex: number;
    costView?: boolean;
    timeExportFormat?: string;
    addNewWorklog: (ticketNo: string | null, day: any) => void;
}

function UserDatesDisplay({ sprintId, groupIndex, uid, costView, timeExportFormat, addNewWorklog }: UserDatesDisplayProps) {
    const state = useWorklogStore();
    const { timeframeType, rIndicator, disableAddingWL, maxHours } = state;

    const groupReportKey = timeframeType === '1' ? `groupReport_${sprintId}` : 'groupReport';
    const groupReport = state[groupReportKey];
    const { dates, groupedData } = groupReport || { dates: [], groupedData: [] };
    const group = groupedData[groupIndex];
    const u = group?.usersMap?.[uid] || { logClass: {}, total: {}, totalCost: {} };

    const convertSecs = useConvertSecs();

    if (costView) {
        return (
            <>
                {dates.map((day: any, i: number) => (
                    <td key={i} className={`${u.logClass?.[day.prop] || ''} day-wl-block`} data-test-id={day.prop} data-export-type="float">
                        {u.totalCost?.[day.prop]}
                    </td>
                ))}
                <td data-test-id="total" data-export-type="float">
                    {u.grandTotalCost}
                </td>
            </>
        );
    } else {
        return (
            <>
                {dates.map((day: any, i: number) => (
                    <td
                        key={i}
                        className={`${u.logClass?.[day.prop] || ''} day-wl-block`}
                        data-export-type={timeExportFormat}
                        data-test-id={day.prop}
                    >
                        {u.isCurrentUser && disableAddingWL !== true && (
                            <span className="fa fa-clock add-wl" title="Click to add worklog" onClick={() => addNewWorklog(null, day)} />
                        )}
                        {convertSecs(u.total?.[day.prop])}
                        {rIndicator === '1' && <Indicator value={u.total?.[day.prop]} maxHours={maxHours} />}
                    </td>
                ))}
                <td data-export-type={timeExportFormat} data-test-id="total">
                    {convertSecs(u.grandTotal)}
                </td>
            </>
        );
    }
}

interface UserTicketsProps {
    isSprint: boolean;
    groupIndex: number;
    boardId?: string;
    uid: string;
    user: any;
    costView?: boolean;
    sprintsList?: any[];
    addNewWorklog: (ticketNo: string, day: any) => void;
    timeExportFormat?: string;
    additionalCols?: any[];
    convertSecs: (val: number) => any;
    formatTime: (val: Date) => string;
}

function UserTickets({
    user,
    isSprint,
    groupIndex,
    sprintsList,
    uid,
    timeExportFormat,
    addNewWorklog,
    costView,
    additionalCols,
    convertSecs,
    formatTime,
}: UserTicketsProps) {
    return (
        <>
            {user.tickets?.map((t: any, i: number) => (
                <TicketRow
                    key={i}
                    isSprint={isSprint}
                    groupIndex={groupIndex}
                    issue={t}
                    user={user}
                    uid={uid}
                    addNewWorklog={addNewWorklog}
                    sprintsList={sprintsList}
                    timeExportFormat={timeExportFormat}
                    convertSecs={convertSecs}
                    costView={costView}
                    additionalCols={additionalCols}
                    formatTime={formatTime}
                />
            ))}
        </>
    );
}
