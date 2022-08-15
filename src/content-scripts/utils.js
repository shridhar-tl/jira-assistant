/* eslint-disable no-restricted-globals */
/* global chrome browser */
import $ from '../common/JSQuery';
import { processResponse } from '../common/proxy-helper';
import { Pages } from './constants';

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

export function getIconHtml(issueKey, issueId, jaAction, icon, curPage) {
    const css = curPage === Pages.Board ? 'ghx-field' : '';
    return `<span class="${css} ja-ctl-el ja-issue-el" data-issue-key="${issueKey}" data-ja-action="${jaAction}" data-issue-id="${issueId}" style="cursor:pointer">${icon}</span>`;
}

export function getPathName() {
    const curUrl = document.location.href;
    const uri = new URL(curUrl);
    return uri.pathname;
}

export function injectPollyfill() {
    const el = document.createElement('script');
    el.setAttribute('type', 'text/javascript');
    el.id = 'ja-script-node';
    el.src = chr.runtime.getURL('api-pollyfill.js');
    document.body.appendChild(el);
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