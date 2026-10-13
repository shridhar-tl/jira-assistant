import $ from '../common/jsquery';

import { isCloud, Pages, regexSet } from './constants';
import { addTimerControls, triggerWLTracking } from './issue-utils';
import { getPathName } from './utils';

interface Settings {
    timerKey?: string;
    timerStarted?: number;
    userId?: string;
    [key: string]: any;
}

export function applyIssueLogic(currentPage: string, settings: Settings, firstTime: boolean, applyModifications: () => void) {
    if (currentPage !== Pages.Issue) {
        return;
    }

    let el;
    if (isCloud) {
        el = $('#jira-issue-header a[data-testid="issue.views.issue-base.foundation.breadcrumbs.current-issue.item"]').parent();
    } else {
        // Jira DC/Server: the command bar toolbar is an AUI toolbar2. Older Jira nested two <div>
        // levels here, so the original selector drilled `> div:first-child > div:first-child`.
        // Since Jira DC 10 the first child of `.aui-toolbar2-inner` is a <ul> (not a <div>), so that
        // selector matches nothing and the timer control is never injected (upstream issue #425).
        // Keep the original selector as the primary path (unchanged behaviour on pre-10 Jira) and
        // fall back to the stable `.aui-toolbar2-inner` container when it finds nothing (DC 10+).
        el = $('div.issue-header-content .command-bar .ops-menus > div:first-child > div:first-child');
        if (!el.length) {
            el = $('div.issue-header-content .command-bar .ops-menus .aui-toolbar2-inner');
        }
    }

    if (!el.length) {
        return;
    }

    el.find('.ja-issue-tmr-ctl').remove();

    const curPathname = getPathName();
    const result = new RegExp(regexSet.issue).exec(curPathname);
    if (!result) {
        return;
    }
    const issueKey = result[1];
    if (!issueKey) {
        return;
    }

    const container = el.append(`<div class="ja-issue-tmr-ctl ${isCloud ? 'ja-cloudv' : 'ja-dcv'}"></div>`);

    const triggerFunc = triggerWLTracking.bind({ settings, applyModifications });
    addTimerControls(currentPage, container, issueKey, settings, '', triggerFunc);
}
