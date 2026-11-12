import $, { type JSQuery } from '../common/jsquery';

import { icons } from './constants';
import { executeJASvc, getIconHtml } from './utils';

interface Settings {
    timerKey?: string;
    timerStarted?: number;
    userId?: string;
    [key: string]: any;
}

export function addTimerControls(
    currentPage: string,
    controls: JSQuery,
    issueKey: string,
    settings: Settings,
    issueId: string,
    triggerFunc: (e: Event) => void,
) {
    if (!controls.length) {
        return;
    }

    if (issueKey === settings.timerKey) {
        if (settings.timerStarted) {
            appendControl(controls, getIconHtml(issueKey, issueId, 'PAUSE', icons.pause, currentPage), triggerFunc);
        } else {
            appendControl(controls, getIconHtml(issueKey, issueId, 'RESUME', icons.resume, currentPage), triggerFunc);
        }
        appendControl(controls, getIconHtml(issueKey, issueId, 'STOP', icons.stop, currentPage), triggerFunc);
    } else {
        appendControl(controls, getIconHtml(issueKey, issueId, 'START', icons.start, currentPage), triggerFunc);
    }
}

function appendControl(controls: JSQuery, html: string, triggerFunc: (e: Event) => void) {
    const el = controls.append(html).click(triggerFunc);
    const icon = el.find('div.ja-icon[data-tooltip]');
    if (icon.length) {
        icon.attr('title', icon.attr('data-tooltip') as string);
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
