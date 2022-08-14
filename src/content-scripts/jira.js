import $ from '../common/JSQuery';
import { curOrigin, Pages, regexSet, styles } from './constants';
import { applyBoardLogic } from './jira-board';
import { createTimerBox } from './timer-box';
import { executeJASvc, prepareForLocationChange, until } from './utils';

console.log('Attached JA Functionalities');
let currentPage;
let settings = {};

function loadLocationInfo() {
    const curUrl = document.location.href;
    const uri = new URL(curUrl);
    const curPathname = uri.pathname;
    if (regexSet.board.test(curPathname)) {
        currentPage = Pages.Board;
    }
    console.log('JA: Current page code:-', currentPage);
    $(document.head).append(styles);
    applyModifications(true);
}

prepareForLocationChange();
loadLocationInfo();
window.addEventListener('locationchange', loadLocationInfo);

async function applyModifications(firstTime, noPull) {
    if (!noPull) {
        settings = await executeJASvc('SELF', 'GET_CS_SETTINGS', curOrigin);
        console.log('JA: Settings received:-', settings);
    }

    if (firstTime) {
        await until(settings.attachDelay || 2000);
    }

    applyBoardLogic(currentPage, settings, firstTime, applyModifications);
    createTimerBox(settings, applyModifications);
}

window.addEventListener('focus', async function () {
    const newSett = await executeJASvc('SELF', 'GET_CS_SETTINGS', curOrigin);
    if (JSON.stringify(settings) !== JSON.stringify(newSett)) {
        console.log('JA: About to apply modifications');
        settings = newSett;
        applyModifications(false, true);
    }
});