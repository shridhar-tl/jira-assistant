import React from "react";
import createStore from "../common/store";
import Dialog from "../dialogs";
import { inject } from "../services/injector-service";

const ticketsJQL = `
(resolution=unresolved or resolved > -3d)
 and (assignee=currentUser() or reporter=currentUser() or lastViewed > -3d)
 order by lastViewed desc`;

const defaultState = {};

const { withProvider: withWorklogContext, connect } = createStore(defaultState);

export { withWorklogContext, connect };

// #region Functions 
export function getEntry() {
    const { $wltimer } = inject('WorklogTimerService');
    return $wltimer.getCurrentTimer();
}

export function getDispTime(lapse) {
    const h = Math.floor(lapse / 3600).pad(2);
    const m = Math.floor((lapse % 3600) / 60).pad(2);
    const s = Math.floor(lapse % 60).pad(2);

    return { lapse, h, m, s };
}

export function getElapseState(timerEntry) {
    if (!timerEntry) { return null; }
    const { key, started, lapse, description } = timerEntry;
    const curTime = new Date().getTime();
    if (started >= curTime) {
        const { $message } = inject('MessageService');
        $message.error('System time has changed since timer has started. Please stop and restart the timer.', 'Time mismatch');
        return { key, lapse: 0, description, isRunning: false, hasError: true };
    }
    const totalMS = (started > 0 ? (curTime - started) : 0) + (lapse || 0);

    return { key, lapse: Math.round(totalMS / 1000), description, isRunning: started > 0 };
}

// #endregion

//#region Actions
export function loadTracker(setState, getState) {
    const setTimer = setUpdates(setState, getState);

    return async function () {
        const oldKey = getState('timerEntry')?.key;
        const entry = await getEntry();
        setTimer(entry, oldKey && oldKey !== entry?.key);
    };
}

function setUpdates(setState, getState) {
    return function (timerEntry, needReload = false) {
        setState(cur => ({
            ...cur,
            needReload,
            timerEntry,
            curState: getElapseState(timerEntry) || {}
        }));
    };
}

export function getElapsedTimeInSecs(setState, getState) {
    return function () {
        const timerEntry = getState('timerEntry');
        return getElapseState(timerEntry);
    };
}


export function startTimer(setState, getState) {
    const setTimer = setUpdates(setState, getState);

    return async function (key, userId, force) {
        if (!userId) {
            const { $session } = inject('SessionService');
            userId = $session.userId;
        }

        try {
            const { $wltimer } = inject('WorklogTimerService');
            let result = await $wltimer.startTimer(userId, key, null, force === true);
            if (result?.isActive) {
                Dialog.yesNo(<>Already timer is running for "{result?.entry?.key}".
                    <br /><br />
                    Would you like to stop it and start new timer?</>, 'Timer running').then(async () => {
                        result = await $wltimer.startTimer(userId, key, null, true);
                        setTimer(result, true);
                    });
            } else {
                setTimer(result);
            }
        }
        catch (err) {
            const { $message } = inject('MessageService');
            $message.error(err.message);
        }
    };
}

export function resumeTimer(setState, getState) {
    const setTimer = setUpdates(setState, getState);

    return async function () {
        const { $wltimer } = inject('WorklogTimerService');
        setTimer(await $wltimer.resumeTimer());
    };
}

export function pauseTimer(setState, getState) {
    const setTimer = setUpdates(setState, getState);

    return async function () {
        const { $wltimer } = inject('WorklogTimerService');
        setTimer(await $wltimer.pauseTimer());
    };
}

export function stopTimer(setState, getState) {
    const setTimer = setUpdates(setState, getState);

    return async function () {
        const { $wltimer } = inject('WorklogTimerService');
        setTimer(await $wltimer.stopTimer());
    };
}

export function descChanged(setState, getState) {
    const setTimer = setUpdates(setState, getState);

    return async function (desc) {
        const { $wltimer } = inject('WorklogTimerService');
        setTimer(await $wltimer.editTrackerInfo(null, null, desc));
    };
}

export function loadTicketList(setState, getState) {
    return async function (startAt = 0) {
        if (getState('ticketsList')) { return; }
        const { $jira, $userutils } = inject('JiraService', 'UserUtilsService');

        const list = await $jira.searchTickets(ticketsJQL,
            ['summary', 'issuetype', 'priority'], startAt, { maxResults: 15 });

        const getUrl = $userutils.getTicketUrl;

        const ticketsList = list.map((t) => {
            const { key, fields } = t;
            const { summary, issuetype, priority } = fields;
            return { key, summary, issuetype, priority, url: getUrl(key) };
        });

        setState({ ticketsList });
    };
}
//#endregion
