/* global chrome browser */
import $ from '../common/jsquery';
import { processResponse } from '../common/proxy-helper';

import { isCloud, Pages } from './constants';

const win: any = window;
const chr = win.chrome || win.browser;

export function executeJASvc(svcName: string, action: string, ...args: any[]) {
    return new Promise((resolve, reject) =>
        chr.runtime.sendMessage({ svcName, action, args }).then((res: any) => processResponse(res, {} as any, resolve, reject), reject),
    );
}

export async function until(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitAndGet(selector: string, timeout = 5000) {
    const items = $(selector);
    if (items.length > 0 || !(timeout > 0)) {
        return items;
    }

    await until(1000);
    return waitAndGet(selector, timeout - 1000);
}

export function getIconHtml(issueKey: string, issueId: string, jaAction: string, icon: string, curPage: string) {
    const css = curPage === Pages.Board ? (isCloud ? 'ghx-field' : 'margin-x-3') : '';
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

export function injectCss() {
    $(document.head).append(`<link rel="stylesheet" href="${chr.runtime.getURL('jira.css')}" media="all">`);
}

export function clearEnd(s: string, str: string) {
    while (endsWith(s, str)) {
        s = s.substring(0, s.length - str.length);
    }
    return s.toString();
}

function endsWith(s: string, str: string) {
    return s.toLowerCase().lastIndexOf(str.toLowerCase()) === s.length - str.length;
}

export function pad(num: number, size: number) {
    let s = String(num);
    while (s.length < (size || 2)) {
        s = `0${s}`;
    }
    return s;
}
