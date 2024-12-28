import React, { useState, useEffect } from 'react';
import InlineDescEdit from './InlineTextEditor';
import {
    getDispTime, startTimer, resumeTimer, pauseTimer, stopTimer, connect, confirmAndStartTimer
} from '../../components/WorklogContext';
import './TimerControl.scss';

const TimerControl = function ({ curIssueKey, curState, descChanged, confirmAndStartTimer }) {
    const isForCurKey = !curIssueKey || curState.key === curIssueKey;
    const { key, lapse, description, isRunning } = isForCurKey ? curState : {};
    const startNewTimer = (event) => confirmAndStartTimer(event, curState.key, curState.isRunning, curIssueKey);

    return (<div className="timer-control-container">
        <Timer lapse={lapse} issueKey={key} isRunning={isRunning} startNewTimer={startNewTimer} />
        {!curIssueKey && <div className="ticket">
            <span className="key">{key}</span>
        </div>}
        {isForCurKey && <div className="wl-comments">
            <InlineDescEdit value={description} className="text" altClassName="no-comment" onChange={descChanged}
                placeholder="<< click to add worklog comment >>" />
        </div>}
        {curIssueKey && !isForCurKey && <span className="foot-notes"><strong>Note:</strong> Use the timer about to start tracking the time you spend in {curIssueKey}.</span>}
        {curIssueKey && isForCurKey && <span className="foot-notes">
            <strong>Note:</strong> Once you stop the timer, worklog would be created and shown in pending upload gadget of Jira Assistant.
            You can review/edit and upload it to Jira as you wish.</span>}
        {curIssueKey && <><br /><br /><br /><br /></>}
    </div>);
};

export default connect(TimerControl, null, { confirmAndStartTimer });


const Timer = function ({ issueKey, lapse, isRunning, startNewTimer }) {
    return (<div className="timer-control">
        <TimeBlockContainer lapse={lapse} isRunning={isRunning} />
        <TimerControls isRunning={isRunning} issueKey={issueKey} startNewTimer={startNewTimer} />
    </div>);
};

const TimerControls = connect(function ({ issueKey, isRunning,
    startNewTimer, resumeTimer, pauseTimer, stopTimer, resetTimer }) {
    return (<div className="controls">
        {!isRunning && <span className="fa fa-play" onClick={!issueKey ? startNewTimer : resumeTimer}
            title={!issueKey ? "Start timer" : "Resume timer"} />}
        {isRunning && <span className="fa fa-pause" title="Pause timer" onClick={pauseTimer} />}
        {!!issueKey && <span className="fa fa-stop" title="Stop timer" onClick={stopTimer} />}
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