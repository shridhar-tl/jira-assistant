import React from 'react';
import { IssueDays, IssueInfo } from '../userdaywise/shared';

function TicketRow({
    isSprint, issue, user, uid, sprintsList, costView, dates,
    timeExportFormat, convertSecs, formatTime, addNewWorklog,
    fields: { hideEstimate }, additionalCols
}) {
    return (
        <tr className="auto-wrap" data-row-id="ticket" data-current-user={user.isCurrentUser ? '1' : '0'} data-test-id={issue.ticketNo}>
            <IssueInfo issue={issue} showParentSummary={false} hideEstimate={hideEstimate} convertSecs={convertSecs} />

            {additionalCols?.map(({ key, Component, props }) => <Component key={key} value={issue.fields?.[key]} {...props} />)}

            {isSprint && sprintsList.map(({ id }) => <IssueDays key={id} convertSecs={convertSecs} costView={costView} dates={dates}
                sprintId={id} uid={uid} formatTime={formatTime} ticketNo={issue.ticketNo} ticket={issue} user={user} isSprint={isSprint} timeExportFormat={timeExportFormat}
                addNewWorklog={addNewWorklog} />)}
            {!isSprint && <IssueDays convertSecs={convertSecs} timeExportFormat={timeExportFormat} dates={dates}
                uid={uid} formatTime={formatTime} ticketNo={issue.ticketNo} ticket={issue} user={user} isSprint={isSprint} costView={costView}
                addNewWorklog={addNewWorklog} />}

            {isSprint && costView && <td>{issue.allSprintTotalCost}</td>}
            {isSprint && !costView && <td>{convertSecs(issue.allSprintTotalHours)}</td>}
        </tr>
    );
}

export default TicketRow;
