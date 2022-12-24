import React, { useEffect } from 'react';
import { ConfirmPopup } from 'primereact/confirmpopup';
import Link from '../../controls/Link';
import {
    resumeTimer, pauseTimer, stopTimer,
    connect, loadTicketList, confirmAndStartTimer
} from '../../components/WorklogContext';
import './IssueListTimer.scss';

const TicketsList = connect(function ({ curState, ticketsList, loadTicketList, confirmAndStartTimer, ...other }) {
    useEffect(() => {
        loadTicketList();
    }, [loadTicketList]);

    if (!ticketsList) {
        return "Loading... Please wait...";
    }
    const { key, isRunning } = curState || {};

    const startNew = (ticket, event) => confirmAndStartTimer(event, key, isRunning, ticket);

    return (<div className="tickets-List">
        {ticketsList.map(t => <TicketItem key={t.key} ticket={t}
            isCurrent={t.key === key} isRunning={isRunning} startTimer={startNew} {...other} />)}
        <ConfirmPopup />
    </div>);
}, ({ curState, ticketsList }) => ({ curState, ticketsList }),
    { loadTicketList, confirmAndStartTimer, resumeTimer, pauseTimer, stopTimer });

export default TicketsList;

function TicketItem({ isCurrent, isRunning, ticket, startTimer, pauseTimer, resumeTimer, stopTimer }) {
    return (<div className="item">
        <div className="block-1">
            <div className="icon">
                <span className={ticket.icon} />
                <img src={ticket.issuetype.iconUrl} alt="" title={ticket.issuetype.name} />
                <img src={ticket.priority.iconUrl} alt="" title={ticket.priority.name} />
            </div>
            <div className="key"><Link href={ticket.url} className="key">{ticket.key}</Link></div>
        </div>
        <div className="controls">
            {(!isCurrent || !isRunning) && <span className="fa fa-play" onClick={isCurrent ? resumeTimer : startTimer.bind(null, ticket.key)}
                title={isCurrent ? 'Resume tracking' : 'Start tracking'}
            />}
            {isCurrent && isRunning && <span className="fa fa-pause" onClick={pauseTimer} title="Pause timer" />}
            {isCurrent && <span className="fa fa-stop" onClick={stopTimer} title="Stop timer and create worklog" />}
        </div>
        <div className="desc">{ticket.summary}</div>
    </div>);
}