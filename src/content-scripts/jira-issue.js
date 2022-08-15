import $ from "../common/JSQuery";
import { Pages, regexSet } from "./constants";
import { addTimerControls, triggerWLTracking } from "./issue-utils";
import { getPathName } from "./utils";

export function applyIssueLogic(currentPage, settings, firstTime, applyModifications) {
    if (currentPage === Pages.Issue) {
        const el = $('#jira-issue-header a[data-testid="issue.views.issue-base.foundation.breadcrumbs.current-issue.item"]').parent();
        if (!el.length) { return; }

        el.find('.ja-issue-tmr-ctl').remove();

        const curPathname = getPathName();
        const result = new RegExp(regexSet.issue).exec(curPathname);
        const issueKey = result[1];
        if (!issueKey) { return; }

        const container = el.append('<div class="ja-issue-tmr-ctl"></div>');

        const triggerFunc = triggerWLTracking.bind({ settings, applyModifications });
        addTimerControls(currentPage, container, issueKey, settings, null, triggerFunc);
    }
}