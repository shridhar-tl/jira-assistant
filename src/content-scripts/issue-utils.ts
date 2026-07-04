import $ from '../common/jsquery';

import { icons, isCloud, Pages } from './constants';
import { executeJASvc, getIconHtml } from './utils';

interface Settings {
    timerKey?: string;
    timerStarted?: number;
    userId?: string;
    [key: string]: any;
}

export function addTimerControls(
    currentPage: string,
    controls: any,
    issueKey: string,
    settings: Settings,
    issueId: string,
    triggerFunc: (e: Event) => void,
) {
    const convert = currentPage !== Pages.Board || !isCloud;
    if (issueKey === settings.timerKey) {
        if (settings.timerStarted) {
            convertTooltip(convert, controls.append(getIconHtml(issueKey, issueId, 'PAUSE', icons.pause, currentPage)).click(triggerFunc));
        } else {
            convertTooltip(
                convert,
                controls.append(getIconHtml(issueKey, issueId, 'RESUME', icons.resume, currentPage)).click(triggerFunc),
            );
        }
        convertTooltip(convert, controls.append(getIconHtml(issueKey, issueId, 'STOP', icons.stop, currentPage)).click(triggerFunc));
    } else {
        convertTooltip(convert, controls.append(getIconHtml(issueKey, issueId, 'START', icons.start, currentPage)).click(triggerFunc));
    }
}

function convertTooltip(convert: boolean, el: any) {
    if (!convert) {
        return;
    }
    el = el.find('div.ja-icon[data-tooltip');
    if (el.length) {
        el.attr('title', el.attr('data-tooltip'));
    }
}

interface TriggerContext {
    settings: Settings;
    applyModifications: () => void;
    elSelector?: string;
}

export async function triggerWLTracking(this: TriggerContext, e: Event) {
    const { settings, applyModifications, elSelector } = this;
    e.preventDefault();
    e.stopPropagation();
    const issueEl = $(e.target as HTMLElement).closest(elSelector || 'span.ja-issue-el');
    const action = issueEl.attr('data-ja-action');

    if (action === 'START') {
        const issueKey = issueEl.attr('data-issue-key');
        const result: any = await executeJASvc('WorklogTimerService', 'startTimer', settings.userId, issueKey);
        if (result && result.isActive) {
            if (confirm(`Already timer is running for "${result?.entry?.key}".\n\nWould you like to stop it and start new timer?`)) {
                await executeJASvc('WorklogTimerService', 'startTimer', settings.userId, issueKey, null, true);
            }
        }
    } else {
        await executeJASvc('WorklogTimerService', action === 'STOP' ? 'stopTimer' : action === 'RESUME' ? 'resumeTimer' : 'pauseTimer');
    }

    applyModifications();
}
