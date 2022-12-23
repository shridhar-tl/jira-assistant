import React, { useCallback, useEffect, useState } from 'react';
import withInitParams from '../../../layouts/initialization';
import withAuthInfo from '../../../layouts/authorization/simple-auth';
import {
    getEntry, getDispTime, withWorklogContext,
    loadTracker, getElapseState,
    startTimer, resumeTimer, pauseTimer, stopTimer,
    connect, descChanged, loadTicketList
} from '../../../components/WorklogContext';
import './Styles.scss';
import Link from '../../../controls/Link';
import { confirmPopup, ConfirmPopup } from 'primereact/confirmpopup';

const initTimerData = async () => {
    const timerEntry = await getEntry();
    return { timerEntry, curState: getElapseState(timerEntry) || {} };
};

const WorklogTimer = withWorklogContext(function ({ curState, descChanged, loadTracker }) {
    useEffect(() => {
        window.addEventListener('focus', loadTracker);

        return () => window.removeEventListener('focus', loadTracker);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const isTimerStarted = !!curState?.key;
    const [showTickets, setTicketsDisp] = useState(!isTimerStarted);
    const toggleTickets = useCallback(() => setTicketsDisp(t => !t), [setTicketsDisp]);

    return (<div className="wl-timer-gadget">
        {isTimerStarted && <TimerControl curState={curState} descChanged={descChanged} />}
        {isTimerStarted && <div className="load-more" onClick={toggleTickets}>
            <span className={showTickets ? "fa fa-caret-up" : "fa fa-caret-down"} />
            {showTickets ? 'Hide tickets list' : 'Load tickets list'}</div>}
        {(showTickets || !isTimerStarted) && <TicketsList />}
    </div>);
}, ({ curState }) => ({ curState }),
    { loadTracker, descChanged }, null,
    initTimerData);

export default withInitParams(withAuthInfo(WorklogTimer));

const TimerControl = function ({ curState, descChanged }) {
    const { key, lapse, description, isRunning } = curState;

    return (<div className="timer-control-container">
        <Timer lapse={lapse} issueKey={key} isRunning={isRunning} />
        <div className="ticket">
            <span className="key">{key}</span>
        </div>
        <div className="wl-comments">
            <InlineDescEdit value={description} className="text" altClassName="no-comment" onChange={descChanged}
                placeholder="<< click to add comment >>" />
        </div>
    </div>);
};

function InlineDescEdit({ value, placeholder, className, altClassName, onChange }) {
    const [isEdit, setEditMode] = useState(false);
    const [valueEdited, setValue] = useState(value || '');

    useEffect(() => { setValue(value || ''); }, [value, setValue]);

    if (isEdit) {
        const endEdit = () => {
            setEditMode(false);
            onChange(valueEdited);
        };

        const onValueChange = (e) => setValue(e.currentTarget.value);
        const keyDown = (e) => {
            if (e.keyCode === 13) {
                endEdit();
            }
        };

        return (<input type="text" ref={c => c?.focus()} value={valueEdited}
            onKeyDown={keyDown} onChange={onValueChange} onBlur={endEdit} />);
    } else if (value) {
        return (<span className={className} onClick={setEditMode}>{value}</span>);
    } else {
        return (<span className={altClassName} onClick={setEditMode}>{placeholder || '<< no value >>'}</span>);
    }
}

const Timer = function ({ issueKey, lapse, isRunning }) {
    return (<div className="timer-control">
        <TimeBlockContainer lapse={lapse} isRunning={isRunning} />
        <TimerControls isRunning={isRunning} issueKey={issueKey} />
    </div>);
};

const TimerControls = connect(function ({ issueKey, isRunning,
    startTimer, resumeTimer, pauseTimer, stopTimer, resetTimer }) {
    return (<div className="controls">
        {!isRunning && <span className="fa fa-play" onClick={!issueKey ? startTimer : resumeTimer}
            title={!issueKey ? "Start timer" : "Resume timer"} />}
        {isRunning && <span className="fa fa-pause" title="Pause timer" onClick={pauseTimer} />}
        <span className="fa fa-stop" title="Stop timer" onClick={stopTimer} />
        <span className="fa fa-undo" style={{ display: 'none' }} title="Reset timer" onClick={resetTimer} />
    </div>);
}, null, { startTimer, resumeTimer, pauseTimer, stopTimer });

function TimeBlockContainer({ lapse, isRunning }) {
    const [timer, setDisplay] = useState(getDispTime(lapse || 0));
    const [timerHandle, setHandle] = useState();

    useEffect(() => {
        if (isRunning) {
            if (timerHandle) { return; }

            const hdl = setInterval(() => setDisplay(timer => getDispTime(timer.lapse + 1)), 1000);
            setHandle(hdl);
        } else if (timerHandle) {
            clearInterval(timerHandle);
            setHandle(null);
        }
    }, [isRunning, setDisplay, setHandle]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setDisplay(getDispTime(lapse || 0));
    }, [lapse]);

    useEffect(() => () => { // Using double arrow function for unmount event
        if (timerHandle) {
            clearInterval(timerHandle);
            setHandle(null);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const { h, m, s } = timer;
    return (<div className="ctr-time-block">
        <TimeBlock time={h} text="HOURS" />
        <div className="seperator">:</div>
        <TimeBlock time={m} text="MINUTES" />
        <div className="seperator">:</div>
        <TimeBlock time={s} text="SECONDS" />
    </div>);
}

function TimeBlock({ time, text }) {
    return (<div className="time-block">
        <span className="num">{time}</span>
        <span className="txt">{text}</span>
    </div>);
}

const TicketsList = connect(function ({ curState, ticketsList, loadTicketList, startTimer, ...other }) {
    useEffect(() => {
        loadTicketList();
    }, [loadTicketList]);

    if (!ticketsList) {
        return "Loading... Please wait...";
    }
    const { key, isRunning } = curState || {};

    const startNew = (ticket, event) => {
        if (isRunning && key !== ticket) {
            confirmPopup({
                target: event.currentTarget,
                icon: 'fa fa-question',
                acceptLabel: 'Yes',
                acceptIcon: 'fa fa-check',
                rejectLabel: 'Cancel',
                rejectIcon: 'fa fa-times',
                message: (<>Already timer is running for "{key}".<br />Would you like to stop it and start new timer?</>),
                accept: () => startTimer(ticket, null, true)
            }).show();
        } else {
            startTimer(ticket);
        }
    };

    return (<div className="tickets-List">
        {ticketsList.map(t => <TicketItem key={t.key} ticket={t}
            isCurrent={t.key === key} isRunning={isRunning} startTimer={startNew} {...other} />)}
        <ConfirmPopup />
    </div>);
}, ({ curState, ticketsList }) => ({ curState, ticketsList }),
    { loadTicketList, startTimer, resumeTimer, pauseTimer, stopTimer });

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