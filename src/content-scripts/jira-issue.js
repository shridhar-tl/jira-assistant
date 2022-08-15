import $ from "../common/JSQuery";
import { isCloud, Pages, regexSet } from "./constants";
import { addTimerControls, triggerWLTracking } from "./issue-utils";
import { getPathName } from "./utils";

export function applyIssueLogic(currentPage, settings, firstTime, applyModifications) {
    if (currentPage !== Pages.Issue) { return; }

    let el;
    if (isCloud) {
        el = $('#jira-issue-header a[data-testid="issue.views.issue-base.foundation.breadcrumbs.current-issue.item"]').parent();
    } else {
        el = $('div.issue-header-content .command-bar .ops-menus > div:first-child > div:first-child');
    }

    if (!el.length) { return; }

    el.find('.ja-issue-tmr-ctl').remove();

    const curPathname = getPathName();
    const result = new RegExp(regexSet.issue).exec(curPathname);
    const issueKey = result[1];
    if (!issueKey) { return; }

    const container = el.append(`<div class="ja-issue-tmr-ctl ${isCloud ? 'ja-cloudv' : 'ja-dcv'}"></div>`);

    const triggerFunc = triggerWLTracking.bind({ settings, applyModifications });
    addTimerControls(currentPage, container, issueKey, settings, null, triggerFunc);
}