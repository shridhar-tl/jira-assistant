import $ from '../common/JSQuery';
import { icons, Pages } from "./constants";
import { executeJASvc, getIconHtml, waitAndGet } from "./utils";

export async function applyBoardLogic(currentPage, settings, firstTime, applyModifications) {
    if (currentPage === Pages.Board) {
        if (!firstTime) {
            $('.ghx-columns .ui-sortable div.js-issue .ja-issue-el').remove();
        }

        const triggerFunc = triggerWLTracking.bind({ settings, applyModifications });

        const selector = '.ghx-columns .ui-sortable div.js-issue';
        const issues = firstTime ? (await waitAndGet(selector)) : $(selector);
        issues.each((i, el) => {
            el = $(el);
            const issueKey = el.attr('data-issue-key');
            const issueId = el.attr('data-issue-id');
            const controls = el.find('.ghx-stat-fields .ghx-row:first-child');
            if (issueKey === settings.timerKey) {
                if (settings.timerStarted) {
                    controls.append(getIconHtml(issueKey, issueId, 'PAUSE', icons.pause)).click(triggerFunc);
                } else {
                    controls.append(getIconHtml(issueKey, issueId, 'RESUME', icons.resume)).click(triggerFunc);
                }
                controls.append(getIconHtml(issueKey, issueId, 'STOP', icons.stop)).click(triggerFunc);
            } else {
                controls.append(getIconHtml(issueKey, issueId, 'START', icons.start)).click(triggerFunc);
            }
        });
    }
}

export async function triggerWLTracking(e) {
    const { settings, applyModifications, elSelector } = this;
    e.preventDefault();
    e.stopPropagation();
    const issueEl = $(e.target).closest(elSelector || 'span.ja-issue-el');
    const action = issueEl.attr('data-ja-action');

    if (action === 'START') {
        const issueKey = issueEl.attr('data-issue-key');
        const result = await executeJASvc('WorklogTimerService', 'startTimer', settings.userId, issueKey);
        if (result && result.isActive) {
            // eslint-disable-next-line no-restricted-globals, no-alert
            if (confirm(`Already timer is running for "${result?.entry?.key}".\n\nWould you like to stop it and start new timer?`)) {
                await executeJASvc('WorklogTimerService', 'startTimer', settings.userId, issueKey, null, true);
            }
        }
    } else {
        await executeJASvc('WorklogTimerService', (action === 'STOP') ? 'stopTimer' : ((action === 'RESUME') ? 'resumeTimer' : 'pauseTimer'));
    }

    applyModifications();
}