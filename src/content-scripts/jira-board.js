import $ from '../common/JSQuery';
import { isCloud, Pages } from "./constants";
import { addTimerControls, triggerWLTracking } from './issue-utils';
import { waitAndGet } from "./utils";

export async function applyBoardLogic(currentPage, settings, firstTime, applyModifications) {
    if (currentPage === Pages.Board) {
        $('.ghx-columns .ui-sortable div.js-issue .ja-issue-el').remove();

        const triggerFunc = triggerWLTracking.bind({ settings, applyModifications });

        const selector = '.ghx-columns .ui-sortable div.js-issue';
        const issues = firstTime ? (await waitAndGet(selector)) : $(selector);
        issues.each((i, el) => {
            el = $(el);
            const issueKey = el.attr('data-issue-key');
            const issueId = el.attr('data-issue-id');

            const controls = el.find(isCloud ? '.ghx-stat-fields .ghx-row:first-child' : '.ghx-card-footer');
            addTimerControls(currentPage, controls, issueKey, settings, issueId, triggerFunc);
        });
    }
}
