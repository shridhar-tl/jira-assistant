import React from 'react';
import { connect } from '../datastore';
import { IssueDays as IssueDaysComponent, IssueInfo } from './shared';

function TicketRow({
    isSprint, groupIndex, issue: t, user: u, uid, sprintsList, costView,
    timeExportFormat, convertSecs, formatTime, addNewWorklog,
    fields: { hideEstimate }, additionalCols
}) {
    return (
        <tr className="auto-wrap" data-row-id="ticket" data-current-user={u.isCurrentUser ? '1' : '0'} data-test-id={t.ticketNo}>
            <IssueInfo issue={t} showParentSummary={false} hideEstimate={hideEstimate} convertSecs={convertSecs} />

            {additionalCols?.map(({ key, Component, props }) => <Component key={key} value={t.fields?.[key]} {...props} />)}

            {isSprint && sprintsList.map(({ id }) => <IssueDays key={id} convertSecs={convertSecs} groupIndex={groupIndex} costView={costView}
                sprintId={id} uid={uid} formatTime={formatTime} ticketNo={t.ticketNo} isSprint={isSprint} timeExportFormat={timeExportFormat}
                addNewWorklog={addNewWorklog} />)}
            {!isSprint && <IssueDays convertSecs={convertSecs} groupIndex={groupIndex} timeExportFormat={timeExportFormat}
                uid={uid} formatTime={formatTime} ticketNo={t.ticketNo} isSprint={isSprint} costView={costView}
                addNewWorklog={addNewWorklog} />}

            {isSprint && costView && <td>{t.allSprintTotalCost}</td>}
            {isSprint && !costView && <td>{convertSecs(t.allSprintTotalHours)}</td>}
        </tr>
    );
}

export default connect(TicketRow, ({ fields }) => ({ fields }), null,
    [
        'UserUtilsService',
        ({ $userutils: { formatTime } }) => ({ formatTime })
    ]
);

const IssueDays = connect(IssueDaysComponent, (state, { isSprint, sprintId, groupIndex, uid, ticketNo }) => {
    const { breakupMode, disableAddingWL,
        [isSprint ? `groupReport_${sprintId}` : 'groupReport']: {
            dates,
            groupedData: {
                [groupIndex]: {
                    usersMap: {
                        [uid]: user
                    }
                }
            } }
    } = state;

    return {
        breakupMode, dates, user, disableAddingWL,
        ticket: user?.ticketsMap?.[ticketNo] || { logs: {} }
    };
});
