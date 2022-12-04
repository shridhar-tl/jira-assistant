import React, { useState, useCallback } from 'react';
import { getUserName } from '../../../common/utils';
import { connect } from '../datastore';
import { addWorklog, convertSecs } from '../actions';
import TicketRow from './TicketRow';

function UserRow({
    isSprint, groupIndex, boardId, user, user: u, colSpan, userDisplayFormat, sprintsList, costView,
    timeExportFormat, convertSecs, addWorklog
}) {
    const [expanded, setExpanded] = useState(false);
    const toggleDisplay = useCallback(() => setExpanded(e => !e), [setExpanded]);

    const addNewWorklog = useCallback((ticketNo, day) => {
        const { date, prop } = day;
        addWorklog(user, ticketNo, date, user.total?.[prop]);
    }, [user, addWorklog]);

    const detailedDisp = userDisplayFormat !== '1';
    const uid = getUserName(u);

    return (<>
        <tr className="pointer auto-wrap" onClick={toggleDisplay} data-current-user={u.isCurrentUser ? '1' : '0'} data-row-id="user">
            <td className="data-left" colSpan={colSpan}>
                <div className={detailedDisp ? "user-info" : "user-info-min"} style={{ paddingLeft: 0 }}>
                    <i className={`pull-left drill-down fa ${expanded ? 'fa-chevron-circle-down' : 'fa-chevron-circle-right'}`}
                        title="Click to toggle ticket details" />
                    {detailedDisp && <img src={u.imageUrl} height={40} width={40} className="pull-left" alt={u.displayName} />}
                    <span className="name">{u.displayName}</span>
                    {detailedDisp && <span className="email">({u.emailAddress || u.name}{u.timeZone && <span>, time zone: {u.timeZone}</span>})</span>}
                </div>
            </td>

            {isSprint && sprintsList.map(({ id }) => <UserDatesDisplay key={id} sprintId={id} uid={uid}
                boardId={boardId} convertSecs={convertSecs} groupIndex={groupIndex} costView={costView}
                timeExportFormat={timeExportFormat} addNewWorklog={addNewWorklog} />)}
            {!isSprint && <UserDatesDisplay uid={uid} convertSecs={convertSecs} groupIndex={groupIndex}
                costView={costView} timeExportFormat={timeExportFormat} addNewWorklog={addNewWorklog} />}

            {isSprint && costView && <td exportType="float">{u.allSprintTotalCost}</td>}
            {isSprint && !costView && <td exportType={timeExportFormat}>{convertSecs(u.allSprintTotalHours)}</td>}
        </tr>

        {expanded && <UserTickets isSprint={isSprint} groupIndex={groupIndex} boardId={boardId} uid={uid} user={u}
            sprintsList={sprintsList} addNewWorklog={addNewWorklog} convertSecs={convertSecs} timeExportFormat={timeExportFormat} />}
    </>);
}

export default connect(UserRow,
    (state, { boardId }) => {
        const { userDisplayFormat, costView, timeframeType } = state;
        const isSprint = timeframeType === '1';
        const result = { costView, isSprint, userDisplayFormat };

        if (isSprint) {
            result.sprintsList = state[`sprintsList_${boardId}`];
        }

        return result;
    },
    { addWorklog, convertSecs }
);


const UserDatesDisplay = connect(function ({
    costView, dates, user: u,
    timeExportFormat, addNewWorklog, convertSecs
}) {
    if (costView) {
        return (<>{dates.map((day, i) => <td key={i} className={`${u.logClass[day.prop]} day-wl-block`}
            data-test-id={day.prop} exportType="float">{u.totalCost[day.prop]}</td>)}
            <td data-test-id="total" exportType="float">{u.grandTotalCost}</td></>);
    } else {
        return (<>{dates.map((day, i) => <td key={i} className={`${u.logClass[day.prop]} day-wl-block`} exportType={timeExportFormat} data-test-id={day.prop}>
            {u.isCurrentUser && <span className="fa fa-clock-o add-wl" title="Click to add worklog" onClick={() => addNewWorklog(null, day)} />}
            {convertSecs(u.total[day.prop])}</td>)}
            <td exportType={timeExportFormat} data-test-id="total">{convertSecs(u.grandTotal)}</td></>);
    }
}, (state, { sprintId, groupIndex, uid }) => {
    const { costView, timeframeType,
        [timeframeType === '1' ? `groupReport_${sprintId}` : 'groupReport']:
        { dates, groupedData: group }
    } = state;

    return {
        costView, dates, group,
        user: group[groupIndex].usersMap[uid] || { logClass: {}, total: {}, totalCost: {} }
    };
});

function UserTickets({ user, isSprint, groupIndex, sprintsList, uid, timeExportFormat, addNewWorklog, convertSecs }) {
    return user.tickets.map((t, i) => <TicketRow key={i} isSprint={isSprint} groupIndex={groupIndex} issue={t} user={user} uid={uid}
        addNewWorklog={addNewWorklog} sprintsList={sprintsList} timeExportFormat={timeExportFormat} convertSecs={convertSecs} />);
}
