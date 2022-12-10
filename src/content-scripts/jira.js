import { curOrigin, Pages, regexSet } from './constants';
import { applyBoardLogic } from './jira-board';
import { applyIssueLogic } from './jira-issue';
import { createTimerBox } from './timer-box';
import { executeJASvc, getPathName, injectCss, injectPollyfill, until } from './utils';
import './jira.scss';

console.log('Attached JA Functionalities');
let currentPage, applying, settings = {};

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
window.addEventListener('ja-locationchange', loadLocationInfo);
let lastApplied = null;
async function applyModifications(firstTime, noPull) {
    // This is to workaround issue caused by pushState and popState triggered by Jira
    if (applying) { return; }
    applying = true;

    if (!noPull) {
        settings = await executeJASvc('SELF', 'GET_CS_SETTINGS', curOrigin);
        console.log('JA: Settings received:-', settings);
    }

    if (firstTime) {
        await until(settings.attachDelay || 2000);
    }

    await applyBoardLogic(currentPage, settings, firstTime, applyModifications);
    applyIssueLogic(currentPage, settings, firstTime, applyModifications);
    createTimerBox(settings, applyModifications);

    applying = false;
    lastApplied = new Date().getTime();
}

window.addEventListener('focus', async function () {
    const newSett = await executeJASvc('SELF', 'GET_CS_SETTINGS', curOrigin);
    if (shouldUpdate(newSett)) {
        console.log('JA: About to apply changes');
        settings = newSett;
        applyModifications(false, true);
    }
});

function shouldUpdate(newSett) {
    return JSON.stringify(settings) !== JSON.stringify(newSett)
        || (lastApplied + (15 * 60 * 1000)) < new Date().getTime();
}