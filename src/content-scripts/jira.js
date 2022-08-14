/* eslint-disable no-alert */
import $ from '../common/JSQuery';
import { icons, Pages, regexSet } from './constants';
import { executeJASvc, getIconHtml, until, waitAndGet } from './utils';

console.log('Attached JA Functionalities');

const curUrl = document.location.href;
const uri = new URL(curUrl);
const curPathname = uri.pathname;
const curOrigin = document.location.origin;
const isCloud = curOrigin.endsWith('.atlassian.net');

let currentPage;
let settings = {};

if (isCloud) {
    if (regexSet.cloudBoard.test(curPathname)) {
        currentPage = Pages.Board;
    }
}

async function applyModifications(firstTime, noPull) {
    if (firstTime) {
        console.log('JA: Current page code:-', currentPage);
    }

    if (!currentPage) { return; }
    if (!noPull) {
        settings = await executeJASvc('SELF', 'GET_CS_SETTINGS', origin);
        console.log('JA: Settings received:-', settings);
    }

    if (firstTime) {
        await until(settings.attachDelay || 2000);
    }

    if (currentPage === Pages.Board) {
        if (!firstTime) {
            $('.ghx-columns .ui-sortable div.js-issue .ja-issue-el').remove();
        }

        const selector = '.ghx-columns .ui-sortable div.js-issue';
        const issues = firstTime ? (await waitAndGet(selector)) : $(selector);
        issues.each((i, el) => {
            el = $(el);
            const issueKey = el.attr('data-issue-key');
            const issueId = el.attr('data-issue-id');
            const controls = el.find('.ghx-stat-fields .ghx-row:first-child');
            if (issueKey === settings.timerKey) {
                if (settings.timerStarted) {
                    controls.append(getIconHtml(issueKey, issueId, 'PAUSE', icons.pause)).click(triggerWLTracking);
                } else {
                    controls.append(getIconHtml(issueKey, issueId, 'RESUME', icons.resume)).click(triggerWLTracking);
                }
                controls.append(getIconHtml(issueKey, issueId, 'STOP', icons.stop)).click(triggerWLTracking);
            } else {
                controls.append(getIconHtml(issueKey, issueId, 'START', icons.start)).click(triggerWLTracking);
            }
        });
    }
}

applyModifications(true);

async function triggerWLTracking(e) {
    e.preventDefault();
    e.stopPropagation();
    const issueEl = $(e.target).closest('span.ja-issue-el');
    const action = issueEl.attr('data-ja-action');
    const issueKey = issueEl.attr('data-issue-key');

    if (action === 'START') {
        const result = await executeJASvc('WorklogTimerService', 'startTimer', settings.userId, issueKey);
        if (result && result.isActive) {
            // eslint-disable-next-line no-restricted-globals
            if (confirm(`Already timer is running for "${result?.entry?.key}".\n\nWould you like to stop it and start new timer?`)) {
                await executeJASvc('WorklogTimerService', 'startTimer', settings.userId, issueKey, null, true);
            }
        }
    } else {
        await executeJASvc('WorklogTimerService', (action === 'STOP') ? 'stopTimer' : ((action === 'RESUME') ? 'resumeTimer' : 'pauseTimer'));
    }

    applyModifications();
}


window.addEventListener('focus', async function () {
    const newSett = await executeJASvc('SELF', 'GET_CS_SETTINGS', origin);
    if (JSON.stringify(settings) !== JSON.stringify(newSett)) {
        console.log('JA: About to apply modifications');
        settings = newSett;
        applyModifications(false, true);
    }
});