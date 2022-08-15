import $ from "../common/JSQuery";
import { icons } from "./constants";
import { triggerWLTracking } from "./issue-utils";
import { clearEnd, executeJASvc, pad } from "./utils";

let curTimer, settings, curLapse = 0;

export function createTimerBox(_settings, applyModifications) {
    settings = _settings;
    const { timerKey, timerStarted, showTimer } = settings;

    if (curTimer && (!timerKey || !timerStarted || !showTimer)) {
        clearInterval(curTimer);
        curTimer = null;
    }

    $('div.ja-timer-box').remove();

    if (showTimer && timerKey) {
        const { timerLapse } = settings;
        const curTime = new Date().getTime();
        curLapse = Math.round(((timerStarted > 0 ? (curTime - timerStarted) : 0) + (timerLapse || 0)) / 1000) + 1;

        const timerDiv = $(document.body).append(getDiv(settings, curLapse));
        if (!curTimer && timerStarted > 0) {
            curTimer = setInterval(updateTimer, 1000);
        }

        attachEvents(timerDiv, applyModifications);
    }
}

function attachEvents(timerDiv, applyModifications) {
    const func = triggerWLTracking.bind({ settings, applyModifications, elSelector: 'div.ja-icon' });
    const hideTimerFunc = hideTimer.bind({ settings, applyModifications, elSelector: 'div.ja-icon' });
    timerDiv.find('div.ja-icon-resume').click(func).attr('data-ja-action', 'RESUME');
    timerDiv.find('div.ja-icon-pause').click(func).attr('data-ja-action', 'PAUSE');
    timerDiv.find('div.ja-icon-stop').click(func).attr('data-ja-action', 'STOP');
    timerDiv.find('div.ja-icon-close').click(hideTimerFunc);
}

async function hideTimer() {
    await executeJASvc('SettingsService', 'set', 'TR_ShowTimer', false);
    settings.showTimer = false;
    createTimerBox(settings, this.applyModifications);
}

function updateTimer(noUpdate) {
    const keyEl = $('div.ja-timer-box a.ja-ticket-no');
    const { timerKey } = settings;
    keyEl.attr('href', getTicketUrl(timerKey));
    keyEl.html(timerKey);
    $('div.ja-timer-box span.ja-time-lapsed').html(getLapsed(noUpdate ? curLapse : ++curLapse));
}

function getTicketUrl(key) {
    return `${clearEnd(settings.jiraUrl, '/')}/browse/${key}`;
}

function getLapsed(lapse) {
    const hours = Math.floor(lapse / 3600);
    const mins = Math.floor((lapse % 3600) / 60);
    const secs = Math.floor(lapse % 60);
    let display;
    if (hours) {
        display = `${pad(hours, 2)}:${pad(mins, 2)}:${pad(secs, 2)}`;
    } else if (mins) {
        display = `${pad(mins, 2)}:${pad(secs, 2)}`;
    } else {
        display = `${pad(secs, 2)}s`;
    }

    return display;
}

function getDiv(settings, lapse) {
    const { timerKey, timerStarted } = settings;

    return `<div class="ja-timer-box">
<div class="ja-timer-ctl">
<a class="ja-ticket-no" href="${getTicketUrl(timerKey)}" target="_blank" rel="noreferrer noopener">${timerKey}</a>
<span class="ja-time-lapsed" style="margin-right: 12px;">${getLapsed(lapse)}</span>
${timerStarted > 0 ? icons.pause : icons.resume}
${icons.stop}
${icons.close}
<div>
</div>`;
}
