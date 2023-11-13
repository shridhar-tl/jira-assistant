import $ from '../common/JSQuery';
import { isCloud, Pages } from "./constants";
import { addTimerControls, triggerWLTracking } from './issue-utils';
import { waitAndGet } from "./utils";

export async function applyBoardLogic(currentPage, settings, firstTime, applyModifications) {
    if (currentPage === Pages.Board) {
        const triggerFunc = triggerWLTracking.bind({ settings, applyModifications });

        if (isCloud) {
            await handleForCloudJira(triggerFunc, firstTime, currentPage, settings);
        } else {
            await handleForPrivateJiraInstance(triggerFunc, firstTime, currentPage, settings);
        }
    }
}

async function handleForCloudJira(triggerFunc, firstTime, currentPage, settings) {
    $('#ak-main-content div[data-test-id="platform-board-kit.ui.card.card"] span.ghx-field.ja-issue-el').remove();
    const selector = '#ak-main-content div[data-test-id="platform-board-kit.ui.card.card"]';

    const issues = firstTime ? (await waitAndGet(selector)) : $(selector);
    issues.each((i, el) => {
        el = $(el);
        let issueKey = el.attr('id');
        if (!issueKey?.startsWith('card-')) {
            return;
        }
        issueKey = issueKey.substring(5);

        let issueId = el.attr('data-rbd-draggable-id');
        if (!issueId?.startsWith('ISSUE::')) {
            return;
        }
        issueId = issueId.substring(7);

        const controls = el.find('> div > div > div > div:last-child:not(:first-child) > div:first-child:last-child > div:first-child');
        addTimerControls(currentPage, controls, issueKey, settings, issueId, triggerFunc);
    });
}

async function handleForPrivateJiraInstance(triggerFunc, firstTime, currentPage, settings) {
    $('.ghx-columns div.js-issue .ja-issue-el').remove();

    const selector = '.ghx-columns div.js-issue';
    const issues = firstTime ? (await waitAndGet(selector)) : $(selector);
    issues.each((i, el) => {
        el = $(el);
        const issueKey = el.attr('data-issue-key');
        const issueId = el.attr('data-issue-id');

        const controls = el.find('.ghx-card-footer');
        addTimerControls(currentPage, controls, issueKey, settings, issueId, triggerFunc);
    });
}