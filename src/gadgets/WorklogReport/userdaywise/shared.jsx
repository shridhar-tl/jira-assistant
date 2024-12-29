import { Image, Link } from '../../../controls';
import { connect } from "../datastore";
import TicketEstimate from '../TicketEstimate';

export const WeeksList = connect(function ({ weeks }) {
    return weeks.map((day, i) => <th key={i} className="week-head" colSpan={day.days}>{day.display}</th>);
}, (state, { sprint }) => {
    const { [sprint ? `groupReport_${sprint.id}` : 'groupReport']: { weeks } } = state;
    return { weeks };
});

export const DatesList = connect(function ({ dates }) {
    return dates.map((day, i) => <th key={i} data-test-id={day.prop} className={`day-head${day.isHoliday ? ' holiday' : ''}`}>{day.dateNum}<br /><span className="day-name">{day.day}</span></th>);
}, (state, { sprintId }) => {
    const { [sprintId ? `groupReport_${sprintId}` : 'groupReport']: { dates } } = state;
    return { dates };
});

export function IssueDays({ costView, dates, timeExportFormat,
    breakupMode, ticket: t, user: u, disableAddingWL,
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
                dates.map((day, j) => <IssueLog key={j} timeExportFormat={timeExportFormat} disableAddingWL={disableAddingWL}
                    breakupMode={breakupMode} addNewWorklog={addNewWorklog} convertSecs={convertSecs} user={u}
                    getComments={getComments} formatTime={formatTime} day={day} issue={t} />)
            }
            <td exportType={timeExportFormat} data-test-id="total">{convertSecs(t.totalHours)}</td>
        </>);
    }
}

export function IssueInfo({ issue: t, showParentSummary, hideEstimate, convertSecs }) {
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
        {!hideEstimate && !!(oe || re) && <TicketEstimate est={oe} rem={re} logged={logged} variance={variance} />}
    </td>);
}

function IssueLog({
    issue: t, user: u = {}, day, timeExportFormat, breakupMode, disableAddingWL,
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
        {u?.isCurrentUser && disableAddingWL !== true && <span className="fa fa-clock add-wl" title="Click to add worklog"
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