import React, { useCallback } from 'react';
import { getUserName } from '../../../common/utils';
import { connect } from '../datastore';
import { addWorklog, convertSecs } from '../actions';
import { toggleUserExpanded } from './actions';
import TicketRow from './TicketRow';
import Indicator from '../../../components/worklog-indicator';

function getImageUrl(user) { return user.imageUrl || user.avatarUrls['48x48'] || user.avatarUrls['32x32']; }

function UserRow({
    isSprint, groupIndex, boardId, user, user: u, colSpan, additionalCols, userDisplayFormat, sprintsList, costView, expanded, uid,
    timeExportFormat, convertSecs, addWorklog, toggleUserExpanded
}) {
    const detailedDisp = userDisplayFormat !== '1';

    const toggleDisplay = useCallback(e => {
        if (!e.nativeEvent.srcElement.classList.contains('add-wl')) {
            toggleUserExpanded(boardId, groupIndex, uid);
        }
    }, [boardId, groupIndex, uid, toggleUserExpanded]);

    const addNewWorklog = useCallback((ticketNo, day) => {
        const { date, prop } = day;
        addWorklog(user, ticketNo, date, user.total?.[prop]);
    }, [user, addWorklog]);

    return (<>
        <tr className="pointer auto-wrap" onClick={toggleDisplay} data-current-user={u.isCurrentUser ? '1' : '0'} data-row-id="user">
            <td className="data-left" colSpan={colSpan}>
                <div className={detailedDisp ? "user-info" : "user-info-min"} style={{ paddingLeft: 0 }}>
                    <i className={`float-start drill-down fa ${expanded ? 'fa-chevron-circle-down' : 'fa-chevron-circle-right'}`}
                        title="Click to toggle ticket details" />
                    {detailedDisp && <img src={getImageUrl(u)} height={40} width={40} className="float-start" alt={u.displayName} />}
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

        {expanded && <UserTickets isSprint={isSprint} groupIndex={groupIndex} boardId={boardId} uid={uid} user={u} costView={costView}
            sprintsList={sprintsList} addNewWorklog={addNewWorklog} convertSecs={convertSecs}
            timeExportFormat={timeExportFormat} additionalCols={additionalCols} />}
    </>);
}

export default connect(UserRow,
    (state, { boardId, groupIndex, user }) => {
        const { userDisplayFormat, timeframeType, userExpnState, expandUsers } = state;
        const isSprint = timeframeType === '1';
        const uid = getUserName(user);
        const expandKey = `${boardId}_${groupIndex}_${uid}`;
        const isUserExpanded = userExpnState[expandKey] ?? expandUsers;
        const result = { isSprint, userDisplayFormat, uid, expanded: !!isUserExpanded };

        if (isSprint) {
            result.sprintsList = state[`sprintsList_${boardId}`];
        }

        return result;
    },
    { addWorklog, convertSecs, toggleUserExpanded }
);


const UserDatesDisplay = connect(function ({
    costView, dates, user: u,
    timeExportFormat, addNewWorklog, convertSecs, maxHours, rIndicator, disableAddingWL
}) {
    if (costView) {
        return (<>{dates.map((day, i) => <td key={i} className={`${u.logClass[day.prop]} day-wl-block`}
            data-test-id={day.prop} exportType="float">{u.totalCost[day.prop]}</td>)}
            <td data-test-id="total" exportType="float">{u.grandTotalCost}</td></>);
    } else {
        return (<>{dates.map((day, i) => <td key={i} className={`${u.logClass[day.prop]} day-wl-block`} exportType={timeExportFormat} data-test-id={day.prop}>
            {u.isCurrentUser && disableAddingWL !== true && <span className="fa fa-clock add-wl" title="Click to add worklog" onClick={() => addNewWorklog(null, day)} />}
            {convertSecs(u.total[day.prop])}
            {rIndicator === '1' && <Indicator value={u.total[day.prop]} maxHours={maxHours} />}
        </td>)}
            <td exportType={timeExportFormat} data-test-id="total">{convertSecs(u.grandTotal)}</td></>);
    }
}, (state, { sprintId, groupIndex, uid }) => {
    const { timeframeType,
        [timeframeType === '1' ? `groupReport_${sprintId}` : 'groupReport']:
        { dates, groupedData: group }, maxHours, rIndicator, disableAddingWL
    } = state;

    return {
        dates, group, maxHours, rIndicator, disableAddingWL,
        user: group[groupIndex].usersMap[uid] || { logClass: {}, total: {}, totalCost: {} }
    };
});

function UserTickets({ user, isSprint, groupIndex, sprintsList, uid, timeExportFormat, addNewWorklog, convertSecs, costView, additionalCols }) {
    return user.tickets.map((t, i) => <TicketRow key={i} isSprint={isSprint} groupIndex={groupIndex} issue={t} user={user} uid={uid}
        addNewWorklog={addNewWorklog} sprintsList={sprintsList} timeExportFormat={timeExportFormat} convertSecs={convertSecs}
        costView={costView} additionalCols={additionalCols} />);
}