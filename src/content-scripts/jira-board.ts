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

interface BoardCard {
    issueKey: string;
    issueId: string;
    controlsParent: Element;
}

interface CloudCardStrategy {
    cardSelector: string;
    parseCard: (card: Element) => BoardCard | null;
}

const controlsClass = 'ja-board-tmr-ctl';
const controlsHtml = `<span class="${controlsClass}"></span>`;
const issueKeyRegex = /\/browse\/([A-Z][A-Z0-9_]*-\d+)/i;
const cardIssueIdRegex = /issue\/(\d+)$/;
const reapplyDelay = 300;
const legacyControlsSelector = '> div > div > div > div:last-child:not(:first-child) > div:first-child:last-child > div:first-child';

const cloudCardStrategies: CloudCardStrategy[] = [
    {
        cardSelector: '[data-testid="board.content.cell.card"]',
        parseCard: (card) => {
            const issueLink = card.querySelector('a[href*="/browse/"]');
            const issueKey = issueKeyRegex.exec(issueLink?.getAttribute('href') || '')?.[1];
            if (!issueKey) {
                return null;
            }

            const keyLink = Array.from(card.querySelectorAll('a')).find((a) => a.textContent?.trim() === issueKey);
            const controlsParent = keyLink?.parentElement?.parentElement;
            if (!controlsParent) {
                return null;
            }

            const cardId = card.closest('[data-board-card-id]')?.getAttribute('data-board-card-id') || '';
            const issueId = cardIssueIdRegex.exec(cardId)?.[1] || '';

            return { issueKey, issueId, controlsParent };
        },
    },
    {
        cardSelector: '[data-testid="platform-board-kit.ui.card.card"], [data-test-id="platform-board-kit.ui.card.card"]',
        parseCard: (card) => {
            const issueKeyAttr = card.getAttribute('id');
            const issueIdAttr = card.getAttribute('data-rbd-draggable-id');
            if (!issueKeyAttr?.startsWith('card-') || !issueIdAttr?.startsWith('ISSUE::')) {
                return null;
            }

            const controlsParent = $(card).find(legacyControlsSelector).get(0);
            if (!controlsParent) {
                return null;
            }

            return { issueKey: issueKeyAttr.substring(5), issueId: issueIdAttr.substring(7), controlsParent };
        },
    },
];

const allCloudCardsSelector = cloudCardStrategies.map((s) => s.cardSelector).join(', ');

let boardObserver: MutationObserver | null = null;
let reapplyTimer: ReturnType<typeof setTimeout> | null = null;
let attachControls: ((onlyMissing: boolean) => void) | null = null;

export async function applyBoardLogic(
    currentPage: string | undefined,
    settings: Settings,
    firstTime: boolean,
    applyModifications: () => void,
) {
    if (currentPage !== Pages.Board) {
        stopObservingBoard();
        return;
    }

    const triggerFunc = triggerWLTracking.bind({ settings, applyModifications });

    if (isCloud) {
        await handleForCloudJira(triggerFunc, firstTime, currentPage, settings);
    } else {
        await handleForPrivateJiraInstance(triggerFunc, firstTime, currentPage, settings);
    }
}

async function handleForCloudJira(triggerFunc: (e: Event) => void, firstTime: boolean, currentPage: string, settings: Settings) {
    if (firstTime) {
        await waitAndGet(allCloudCardsSelector);
    }

    attachControls = (onlyMissing: boolean) => {
        if (!onlyMissing) {
            $(`.${controlsClass}`).remove();
        }

        cloudCardStrategies.forEach(({ cardSelector, parseCard }) => {
            $(cardSelector).each((_, card) => {
                if (onlyMissing && card.querySelector(`.${controlsClass}`)) {
                    return;
                }

                const boardCard = parseCard(card);
                if (!boardCard) {
                    return;
                }

                const controls = $(boardCard.controlsParent).append(controlsHtml);
                addTimerControls(currentPage, controls, boardCard.issueKey, settings, boardCard.issueId, triggerFunc);
            });
        });
    };

    attachControls(false);
    observeBoard();
}

function observeBoard() {
    if (boardObserver) {
        return;
    }

    boardObserver = new MutationObserver(() => {
        if (reapplyTimer) {
            return;
        }

        reapplyTimer = setTimeout(() => {
            reapplyTimer = null;
            attachControls?.(true);
        }, reapplyDelay);
    });
    boardObserver.observe(document.body, { childList: true, subtree: true });
}

function stopObservingBoard() {
    boardObserver?.disconnect();
    boardObserver = null;
    if (reapplyTimer) {
        clearTimeout(reapplyTimer);
        reapplyTimer = null;
    }
    attachControls = null;
    $(`.${controlsClass}`).remove();
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
