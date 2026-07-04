import { curOrigin, Pages, regexSet } from './constants';
import { applyBoardLogic } from './jira-board';
import { applyIssueLogic } from './jira-issue';
import { createTimerBox } from './timer-box';
import { executeJASvc, getPathName, injectCss, injectPollyfill, until } from './utils';

const win: any = window;
const chr = win.chrome || win.browser;

console.log('Attached JA Functionalities');

interface Settings {
    attachDelay?: number;
    keepAlive?: boolean;
    timerKey?: string;
    timerStarted?: number;
    showTimer?: boolean;
    userId?: string;
    jiraUrl?: string;
    [key: string]: any;
}

let currentPage: string | undefined;
let applying = false;
let settings: Settings = {};

function loadLocationInfo() {
    const curPathname = getPathName();

    if (regexSet.board.test(curPathname)) {
        currentPage = Pages.Board;
    } else if (regexSet.issue.test(curPathname)) {
        currentPage = Pages.Issue;
    }

    console.log('JA: Current page code:-', currentPage);
    applyModifications(true);
}

injectPollyfill();
injectCss();
loadLocationInfo();
win.addEventListener('ja-locationchange', loadLocationInfo);

let lastApplied: number | null = null;

async function applyModifications(firstTime?: boolean, noPull?: boolean) {
    if (applying) {
        return;
    }
    applying = true;

    if (!noPull) {
        settings = (await executeJASvc('SELF', 'GET_CS_SETTINGS', curOrigin)) as Settings;
        console.log('JA: Settings received:-', settings);
    }

    if (firstTime) {
        await until(settings.attachDelay || 2000);
    }

    if (currentPage) {
        await applyBoardLogic(currentPage, settings, !!firstTime, applyModifications);
        applyIssueLogic(currentPage, settings, !!firstTime, applyModifications);
        createTimerBox(settings, applyModifications);
    }

    applying = false;
    lastApplied = new Date().getTime();
}

async function refreshSettings(noTrigger?: boolean) {
    const newSett = (await executeJASvc('SELF', 'GET_CS_SETTINGS', curOrigin)) as Settings;
    if (shouldUpdate(newSett)) {
        console.log('JA: About to apply changes');
        const trigger = noTrigger !== false && newSett.keepAlive && !clientPort && !settings?.keepAlive;
        settings = newSett;
        if (trigger) {
            connectAndKeepAlive(refreshSettings);
        }
        applyModifications(false, true);
    }
}

function shouldUpdate(newSett: Settings) {
    return JSON.stringify(settings) !== JSON.stringify(newSett) || (lastApplied && lastApplied + 15 * 60 * 1000 < new Date().getTime());
}

let clientPort: any = null;
let waitBeforeNextTry = 10000;
let retryCount = 0;

function connectAndKeepAlive(onChange?: (noTrigger: boolean) => void) {
    try {
        if (clientPort) {
            clientPort.disconnect();
            clientPort = null;
            waitBeforeNextTry = 10000;
        } else {
            retryCount++;
            if (retryCount <= 8) {
                waitBeforeNextTry = 10000;
            } else if (retryCount <= 15) {
                waitBeforeNextTry = 20000;
            } else if (retryCount > 15) {
                waitBeforeNextTry = 25000;
            }
        }

        if (typeof chr === 'undefined' || !chr.runtime) {
            return;
        }

        const port = chr.runtime.connect({ name: 'keep-alive' });
        port.postMessage('keep-alive');
        clientPort = port;
        port.onMessage.addListener(() => {
            if (onChange) {
                onChange(false);
            }
        });
        port.onDisconnect.addListener(() =>
            setTimeout(async () => {
                await refreshSettings(false);
                connectAndKeepAlive(onChange);
            }, waitBeforeNextTry),
        );
        retryCount = 0;
        console.log('JA: keep-alive connected');
    } catch (err) {
        console.warn('JA: Unable to keep alive', err);
    }
}

connectAndKeepAlive(refreshSettings);
win.addEventListener('focus', refreshSettings);
