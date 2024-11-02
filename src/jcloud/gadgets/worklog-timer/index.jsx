import React, { useCallback, useEffect, useState } from 'react';
import TimerControl from '../../components/TimerControl';
import withInitParams from '../../../layouts/initialization';
import withAuthInfo from '../../../layouts/authorization/simple-auth';
import {
    getEntry, withWorklogContext, loadTracker, getElapseState, descChanged
} from '../../../components/WorklogContext';
import TicketsList from '../../components/IssueListTimer';
import './Styles.scss';

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


