/* eslint-disable no-restricted-globals */
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

export function prepareForLocationChange() {
    const pushState = history.pushState;
    const replaceState = history.replaceState;

    history.pushState = function () {
        pushState.apply(history, arguments);
        window.dispatchEvent(new Event('pushstate'));
        window.dispatchEvent(new Event('locationchange'));
    };

    history.replaceState = function () {
        replaceState.apply(history, arguments);
        window.dispatchEvent(new Event('replacestate'));
        window.dispatchEvent(new Event('locationchange'));
    };

    window.addEventListener('popstate', function () {
        window.dispatchEvent(new Event('locationchange'));
    });
}

export function clearEnd(s, str) {
    while (endsWith(s, str)) {
        s = s.substring(0, s.length - str.length);
    }
    return s.toString();
}

function endsWith(s, str) {
    return s.toLowerCase().lastIndexOf(str.toLowerCase()) === s.length - str.length;
}

export function pad(num, size) {
    let s = String(num);
    while (s.length < (size || 2)) { s = `0${s}`; }
    return s;
}