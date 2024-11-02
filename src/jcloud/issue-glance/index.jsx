import React, { useEffect } from 'react';
import TimerControl from '../components/TimerControl';
import withInitParams from '../../layouts/initialization';
import withAuthInfo from '../../layouts/authorization/simple-auth';
import {
    getEntry, withWorklogContext, loadTracker, getElapseState, descChanged
} from '../../components/WorklogContext';
import { ConfirmPopup } from 'primereact/confirmpopup';

const initTimerData = async () => {
    const timerEntry = await getEntry();
    return { timerEntry, curState: getElapseState(timerEntry) || {} };
};

const WorklogTimer = withWorklogContext(function ({ jiraContext: { extension: { issue: { key } } },
    curState, descChanged, loadTracker }) {
    useEffect(() => {
        window.addEventListener('focus', loadTracker);

        return () => window.removeEventListener('focus', loadTracker);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return (<div className="wl-timer-gadget">
        <TimerControl curState={curState} descChanged={descChanged} curIssueKey={key} />
        <ConfirmPopup />
    </div>);
}, ({ curState }) => ({ curState }),
    { loadTracker, descChanged }, null,
    initTimerData);

export default withInitParams(withAuthInfo(WorklogTimer));


