/* global chrome browser */
import $ from '../common/JSQuery';
import { processResponse } from '../common/proxy-helper';

const chr = chrome || browser;

export function executeJASvc(svcName, action, ...args) {
    return new Promise((resolve, reject) => chr.runtime.sendMessage({ svcName, action, args })
        .then((res) => processResponse(res, {}, resolve, reject), reject));
}

export async function until(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitAndGet(selector, timeout = 5000) {
    const items = $(selector);
    if (items.length > 0 || !(timeout > 0)) {
        return items;
    }

    await until(1000);
    return waitAndGet(selector, timeout - 1000);
}

export function getIconHtml(issueKey, issueId, jaAction, icon) {
    return `<span class="ghx-field ja-ctl-el ja-issue-el" data-issue-key="${issueKey}" data-ja-action="${jaAction}" data-issue-id="${issueId}" style="cursor:pointer">${icon}</span>`;
}