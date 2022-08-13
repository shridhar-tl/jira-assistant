/* global chrome browser */
import $ from './JSQuery';
import { processResponse } from './proxy-helper';

const chr = chrome || browser;

// https://fa2png.app/
const icons = {
    start: `<div data-tooltip="Jira Assist: Start time tracking">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18px" height="18px" fill="#00ff00">
    <path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path>
    </svg></div>`,
    pause: `<div data-tooltip="Jira Assist: Pause time tracking">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18px" height="18px" fill="#ffa500">
    <path d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"></path>
    </svg></div>`,
    stop: `<div data-tooltip="Jira Assist: Stop time tracking and generate worklog">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18px" height="18px" fill="#ff0000">
    <path d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48z"></path>
    </svg></div>`
};

const curUrl = document.location.href;
const uri = new URL(curUrl);
const curPathname = uri.pathname;
const curOrigin = document.location.origin;
const isCloud = curOrigin.endsWith('.atlassian.net');

let currentPage;

const regexSet = {
    cloudBoard: /^\/jira\/software\/c\/projects\/([A-Z0-9-]+)\/boards\/(\d+)/gi
};

const Pages = {
    Board: 'board',
    Issue: 'issue'
};

let settings = {};

if (isCloud) {
    if (regexSet.cloudBoard.test(curPathname)) {
        currentPage = Pages.Board;
    }
}

async function applyModifications() {
    settings = await executeJASvc('SELF', 'GET_CS_SETTINGS', origin);

    if (currentPage === Pages.Board) {
        $('.ghx-columns .ui-sortable div.js-issue').each((i, el) => {
            el = $(el);
            const issueKey = el.attr('data-issue-key');
            const issueId = el.attr('data-issue-id');
            const controls = el.find('.ghx-stat-fields .ghx-row:first-child');
            if (issueKey === settings.timerKey) {
                controls.append(getIconHtml(issueKey, issueId, 'PAUSE', icons.pause)).click(triggerWLTracking);
                controls.append(getIconHtml(issueKey, issueId, 'STOP', icons.stop)).click(triggerWLTracking);
            } else {
                controls.append(getIconHtml(issueKey, issueId, 'START', icons.start)).click(triggerWLTracking);
            }
        });
    }
}

applyModifications();

function getIconHtml(issueKey, issueId, jaAction, icon) {
    return `<span class="ghx-field ja-ctl-el ja-issue-el" data-issue-key="${issueKey}" data-ja-action="${jaAction}" data-issue-id="${issueId}" style="cursor:pointer">${icon}</span>`;
}

async function triggerWLTracking(e) {
    e.preventDefault();
    e.stopPropagation();
    const issueEl = $(e.target).closest('span.ja-issue-el');
    const action = issueEl.attr('data-ja-action');
    const issueKey = issueEl.attr('data-issue-key');
    console.log(action, issueKey);
    if (action === 'START') {
        await executeJASvc('WorklogTimerService', 'startTimer', settings.userId, issueKey);
    } else {
        await executeJASvc('WorklogTimerService', (action === 'STOP') ? 'stopTimer' : 'pauseTimer');
    }
    settings = await executeJASvc('SELF', 'GET_CS_SETTINGS', origin);
}

function executeJASvc(svcName, action, ...args) {
    return new Promise((resolve, reject) => {
        chr.runtime.sendMessage({ svcName, action, args }).then((res) => processResponse(res, {}, resolve, reject), reject);
    });
}