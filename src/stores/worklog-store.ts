import { create } from 'zustand';

import { Dialog } from '@/dialogs/CommonDialog';
import type { Issue, IssuePriority, IssueType, WorklogTimer } from '@/types';

import { inject } from '@services';

import { getErrorMessage } from '@utils';

const ticketsJql = `
(resolution=unresolved or resolved > -3d)
 and (assignee=currentUser() or reporter=currentUser() or lastViewed > -3d)
 order by lastViewed desc`;

const timeMismatchMessage = 'System time has changed since timer has started. Please stop and restart the timer.';

function confirmReplaceTimer(runningKey: string): Promise<boolean> {
    return new Promise((resolve) => {
        Dialog.yesNo(
            `Already timer is running for "${runningKey}". Would you like to stop it and start new timer?`,
            'Timer already running',
        ).then(
            () => resolve(true),
            () => resolve(false),
        );
    });
}

interface TimerState {
    key: string;
    lapse: number;
    description?: string;
    isRunning: boolean;
    hasError?: boolean;
}

export interface TimerTicket {
    key: string;
    summary: string;
    issuetype?: IssueType;
    priority?: IssuePriority;
    url?: string;
}

interface WorklogState {
    timerEntry: WorklogTimer | null;
    curState: TimerState;
    ticketsList: TimerTicket[] | null;
    needReload: boolean;
    loadTracker: () => Promise<void>;
    getElapsedTimeInSecs: () => TimerState | null;
    startTimer: (key: string, userId?: number, force?: boolean) => Promise<void>;
    resumeTimer: () => Promise<void>;
    pauseTimer: () => Promise<void>;
    stopTimer: () => Promise<void>;
    descChanged: (desc: string) => Promise<void>;
    loadTicketList: (startAt?: number) => Promise<void>;
}

function getElapseState(timerEntry: WorklogTimer | null): TimerState | null {
    if (!timerEntry) return null;

    const { key, started, lapse = 0, description } = timerEntry;
    const curTime = new Date().getTime();

    if (started && started > curTime) {
        return { key, lapse: 0, description, isRunning: false, hasError: true };
    }

    const totalMS = (started && started > 0 ? curTime - started : 0) + lapse;
    return { key, lapse: Math.round(totalMS / 1000), description, isRunning: started ? started > 0 : false };
}

function toCurState(timerEntry: WorklogTimer | null): TimerState {
    const state = getElapseState(timerEntry);
    if (state?.hasError) {
        const { $message } = inject('MessageService');
        $message.error(timeMismatchMessage, 'Time mismatch');
    }
    return state || ({} as TimerState);
}

export function getDispTime(lapse: number) {
    const h = String(Math.floor(lapse / 3600)).padStart(2, '0');
    const m = String(Math.floor((lapse % 3600) / 60)).padStart(2, '0');
    const s = String(Math.floor(lapse % 60)).padStart(2, '0');
    return { lapse, h, m, s };
}

export const useWorklogStore = create<WorklogState>((set, get) => ({
    timerEntry: null,
    curState: {} as TimerState,
    ticketsList: null,
    needReload: false,

    loadTracker: async () => {
        const { $wltimer } = inject('WorklogTimerService');
        const oldKey = get().timerEntry?.key;
        const entry = (await $wltimer.getCurrentTimer()) as WorklogTimer | undefined;

        set({
            timerEntry: entry || null,
            curState: toCurState(entry || null),
            needReload: oldKey ? oldKey !== entry?.key : false,
        });
    },

    getElapsedTimeInSecs: () => {
        const timerEntry = get().timerEntry;
        return getElapseState(timerEntry);
    },

    startTimer: async (key: string, userId?: number, force = false) => {
        const { $wltimer, $session, $message } = inject('WorklogTimerService', 'SessionService', 'MessageService');

        if (!userId) {
            userId = $session.userId;
        }

        try {
            const result = await $wltimer.startTimer(userId!, key, undefined, force);

            if ('isActive' in result) {
                if (await confirmReplaceTimer(result.entry.key)) {
                    const newResult = await $wltimer.startTimer(userId!, key, undefined, true);
                    if ('isActive' in newResult) {
                        return;
                    }
                    set({
                        timerEntry: newResult,
                        curState: toCurState(newResult),
                        needReload: true,
                    });
                }
            } else {
                set({
                    timerEntry: result,
                    curState: toCurState(result),
                    needReload: false,
                });
            }
        } catch (err) {
            $message.error(getErrorMessage(err, 'Unable to start the timer'));
        }
    },

    resumeTimer: async () => {
        const { $wltimer } = inject('WorklogTimerService');
        const result = (await $wltimer.resumeTimer()) as WorklogTimer | false;
        const entry = result || null;

        set({
            timerEntry: entry,
            curState: toCurState(entry),
            needReload: false,
        });
    },

    pauseTimer: async () => {
        const { $wltimer } = inject('WorklogTimerService');
        const result = (await $wltimer.pauseTimer()) as WorklogTimer | false;
        const entry = result || null;

        set({
            timerEntry: entry,
            curState: toCurState(entry),
            needReload: false,
        });
    },

    stopTimer: async () => {
        const { $wltimer } = inject('WorklogTimerService');
        await $wltimer.stopTimer();

        set({
            timerEntry: null,
            curState: {} as TimerState,
            needReload: true,
        });
    },

    descChanged: async (desc: string) => {
        const { $wltimer } = inject('WorklogTimerService');
        const result = (await $wltimer.editTrackerInfo(undefined, undefined, desc)) as WorklogTimer | undefined;
        const entry = result || null;

        set({
            timerEntry: entry,
            curState: toCurState(entry),
            needReload: false,
        });
    },

    loadTicketList: async () => {
        if (get().ticketsList) return;

        const { $jira, $userutils } = inject('JiraService', 'UserUtilsService');

        const list = await $jira.searchTickets(ticketsJql, ['summary', 'issuetype', 'priority'], undefined, {
            maxResults: 15,
        });

        const getUrl = $userutils.getTicketUrl;

        const ticketsList = (list as Issue[]).map((t) => {
            const { key, fields } = t;
            const { summary, issuetype, priority } = fields;
            return { key, summary, issuetype, priority, url: getUrl(key) };
        });

        set({ ticketsList });
    },
}));
