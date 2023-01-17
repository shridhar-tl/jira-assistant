import React from 'react';
import { Image, Link } from '../../../controls';
import { connect } from '../datastore';

function TicketRow({
    isSprint, groupIndex, issue: t, user: u, uid, sprintsList, costView,
    timeExportFormat, convertSecs, formatTime, addNewWorklog,
    fields: {
        hideEstimate, showProject, showParentSummary, showIssueType,
        showStatus, showEpic, showAssignee, showReporter
    }
}) {
    return (
        <tr className="auto-wrap" data-row-id="ticket" data-current-user={u.isCurrentUser ? '1' : '0'} data-test-id={t.ticketNo}>
            <IssueInfo issue={t} showParentSummary={showParentSummary} hideEstimate={hideEstimate} convertSecs={convertSecs} />

            {!!showProject && <td>{t.projectKey} - {t.projectName}</td>}
            {!!showParentSummary && <td>{t.parent && <Link href={t.parentUrl} className="link">{t.parent}</Link>} - {t.parentSummary}</td>}
            {!!showIssueType && <td><Image src={t.iconUrl} title={t.issueType} /> {t.issueType}</td>}
            {!!showStatus && <td>{t.statusName}</td>}
            {!!showEpic && <td>{t.epicDisplay && <Link href={t.epicUrl} className="link">{t.epicDisplay}</Link>}</td>}
            {!!showAssignee && <td>{t.assignee}</td>}
            {!!showReporter && <td>{t.reporter}</td>}

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

const IssueDays = connect(function ({ costView, dates, timeExportFormat,
    breakupMode, ticket: t, user: u,
    addNewWorklog, convertSecs, formatTime }) {
    const getComments = (arr, showCost) => {
        if (!arr || arr.length === 0) {
            return "";
        }

        return arr.map((a) => `${formatTime(a.logTime)} (${convertSecs(a.totalHours)})${(showCost ? (`, Cost: ${a.totalCost}`) : '')} - ${a.comment || '(no comment provided)'}`).join(';\n');
    };

    if (costView) {
        return (<>
            {dates.map((day, j) => <td key={j} className="day-wl-block" data-test-id={day.prop} exportType="float">
                <span title={getComments(t.logs[day.prop], costView)}>{getTotalCost(t.logs[day.prop])}</span>
            </td>)}
            <td data-test-id="total" exportType="float">{t.totalCost}</td>
        </>);
    } else {
        return (<>
            {
                dates.map((day, j) => <IssueLog key={j} timeExportFormat={timeExportFormat}
                    breakupMode={breakupMode} addNewWorklog={addNewWorklog} convertSecs={convertSecs} user={u}
                    getComments={getComments} formatTime={formatTime} day={day} issue={t} />)
            }
            <td exportType={timeExportFormat} data-test-id="total">{convertSecs(t.totalHours)}</td>
        </>);
    }
}, (state, { isSprint, groupIndex, sprintId, uid, ticketNo }) => {
    const { breakupMode,
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
        breakupMode, dates, user,
        ticket: user?.ticketsMap?.[ticketNo] || {}
    };
});

function IssueInfo({ issue: t, showParentSummary, hideEstimate, convertSecs }) {
    const oe = convertSecs(t.originalestimate);
    const re = convertSecs(t.remainingestimate);
    const logged = convertSecs(t.totalLogged) || 0;
    const variance = (t.estVariance > 0 ? "+" : "") + (convertSecs(t.estVariance) || (t.originalestimate > 0 ? 0 : "NA"));
    const estTitle = `Original Estimate: ${oe || 0}\nRemaining: ${re || 0}\nTotal Logged: ${logged}\nEstimate Variance: ${variance}`;

    return (<td className="data-left">
        <div className="wl-ticket-detail" title={t.summary}>
            <Image src={t.iconUrl} title={t.issueType} />
            {!showParentSummary && t.parent && <Link href={t.parentUrl} className="link">{t.parent} - </Link>}
            <Link href={t.url} className="link">{t.ticketNo}</Link> -
            <span>{t.summary}</span>
        </div>
        {!hideEstimate && !!(oe || re) && <span className="estimate" title={estTitle}>
            (est: {oe || 0} / rem: {re || 0} / log: {logged} / var: {variance})</span>}
    </td>);
}

function IssueLog({
    issue: t, user: u = {}, day, timeExportFormat, breakupMode,
    getComments, addNewWorklog, formatTime, convertSecs
}) {
    const { logs = {} } = t;
    const logTime = logs[day.prop];

    function getLogEntries(entries) {
        if (Array.isArray(entries) && entries.length > 0) {
            const seperator = entries.length > 1 ? ";" : "";
            return entries.map((d, i) => <span key={i} title={`${formatTime(d.logTime)} - ${d.comment}`}>{convertSecs(d.totalHours) + seperator}</span>);
        }
    }

    return (<td className={`day-wl-block${day.isHoliday ? (!logTime?.length ? ' col-holiday' : ' log-high') : ''}`} exportType={timeExportFormat} data-test-id={day.prop}>
        {u?.isCurrentUser && <span className="fa fa-clock-o add-wl" title="Click to add worklog"
            onClick={() => addNewWorklog(t.ticketNo, day)} />}
        {breakupMode !== '2' && <span title={getComments(logTime)}>{convertSecs(getTotalTime(logTime))}</span>}
        {breakupMode === '2' && <div> {getLogEntries(logTime)}</div>}
    </td>);
}

// #region Util functions
function getTotalTime(arr) {
    if (!arr || arr.length === 0) {
        return "";
    }
    return arr.sum((a) => a.totalHours);
}

function getTotalCost(arr) {
    if (!arr || arr.length === 0) {
        return "";
    }
    return arr.sum((a) => a.totalCost);
}

// #endregion