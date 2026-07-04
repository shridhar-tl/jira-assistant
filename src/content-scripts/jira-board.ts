import $ from '../common/jsquery';

import { isCloud, Pages } from './constants';
import { addTimerControls, triggerWLTracking } from './issue-utils';
import { waitAndGet } from './utils';

interface Settings {
    timerKey?: string;
    timerStarted?: number;
    userId?: string;
    [key: string]: any;
}

export async function applyBoardLogic(currentPage: string, settings: Settings, firstTime: boolean, applyModifications: () => void) {
    if (currentPage === Pages.Board) {
        const triggerFunc = triggerWLTracking.bind({ settings, applyModifications });

        if (isCloud) {
            await handleForCloudJira(triggerFunc, firstTime, currentPage, settings);
        } else {
            await handleForPrivateJiraInstance(triggerFunc, firstTime, currentPage, settings);
        }
    }
}

async function handleForCloudJira(triggerFunc: (e: Event) => void, firstTime: boolean, currentPage: string, settings: Settings) {
    $('#ak-main-content div[data-test-id="platform-board-kit.ui.card.card"] span.ghx-field.ja-issue-el').remove();
    const selector = '#ak-main-content div[data-test-id="platform-board-kit.ui.card.card"]';

    const issues = firstTime ? await waitAndGet(selector) : $(selector);
    issues.each((i: number, el: Element) => {
        const $el = $(el);
        const issueKeyAttr = $el.attr('id');
        if (typeof issueKeyAttr !== 'string' || !issueKeyAttr.startsWith('card-')) {
            return;
        }
        const issueKey = issueKeyAttr.substring(5);

        const issueIdAttr = $el.attr('data-rbd-draggable-id');
        if (typeof issueIdAttr !== 'string' || !issueIdAttr.startsWith('ISSUE::')) {
            return;
        }
        const issueId = issueIdAttr.substring(7);

        const controls = $el.find('> div > div > div > div:last-child:not(:first-child) > div:first-child:last-child > div:first-child');
        addTimerControls(currentPage, controls, issueKey, settings, issueId, triggerFunc);
    });
}

async function handleForPrivateJiraInstance(triggerFunc: (e: Event) => void, firstTime: boolean, currentPage: string, settings: Settings) {
    $('.ghx-columns div.js-issue .ja-issue-el').remove();

    const selector = '.ghx-columns div.js-issue';
    const issues = firstTime ? await waitAndGet(selector) : $(selector);
    issues.each((i: number, el: Element) => {
        const $el = $(el);
        const issueKeyAttr = $el.attr('data-issue-key');
        const issueIdAttr = $el.attr('data-issue-id');
        const issueKey = typeof issueKeyAttr === 'string' ? issueKeyAttr : '';
        const issueId = typeof issueIdAttr === 'string' ? issueIdAttr : '';

        const controls = $el.find('.ghx-card-footer');
        addTimerControls(currentPage, controls, issueKey, settings, issueId, triggerFunc);
    });
}
