import { create } from 'zustand';

import type { WorklogTimer } from '@/types';

import { inject } from '@services';

const ticketsJql = `
(resolution=unresolved or resolved > -3d)
 and (assignee=currentUser() or reporter=currentUser() or lastViewed > -3d)
 order by lastViewed desc`;

interface TimerState {
    key: string;
    lapse: number;
    description?: string;
    isRunning: boolean;
    hasError?: boolean;
}

interface Ticket {
    key: string;
    summary: string;
    issuetype: any;
    priority: any;
    url?: string;
}

interface WorklogState {
    timerEntry: WorklogTimer | null;
    curState: TimerState;
    ticketsList: Ticket[] | null;
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

    if (started && started >= curTime) {
        const { $message } = inject('MessageService');
        $message.error('System time has changed since timer has started. Please stop and restart the timer.', 'Time mismatch');
        return { key, lapse: 0, description, isRunning: false, hasError: true };
    }

    const totalMS = (started && started > 0 ? curTime - started : 0) + lapse;
    return { key, lapse: Math.round(totalMS / 1000), description, isRunning: started ? started > 0 : false };
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
            curState: getElapseState(entry || null) || ({} as TimerState),
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

            if (result?.isActive) {
                const confirmed = await new Promise((resolve) => {
                    if (
                        window.confirm(
                            `Already timer is running for "${result?.entry?.key}".\n\nWould you like to stop it and start new timer?`,
                        )
                    ) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });

                if (confirmed) {
                    const newResult = await $wltimer.startTimer(userId!, key, undefined, true);
                    set({
                        timerEntry: newResult,
                        curState: getElapseState(newResult) || ({} as TimerState),
                        needReload: true,
                    });
                }
            } else {
                set({
                    timerEntry: result,
                    curState: getElapseState(result) || ({} as TimerState),
                    needReload: false,
                });
            }
        } catch (err: any) {
            $message.error(err.message);
        }
    },

    resumeTimer: async () => {
        const { $wltimer } = inject('WorklogTimerService');
        const result = (await $wltimer.resumeTimer()) as WorklogTimer | false;
        const entry = result || null;

        set({
            timerEntry: entry,
            curState: getElapseState(entry) || ({} as TimerState),
            needReload: false,
        });
    },

    pauseTimer: async () => {
        const { $wltimer } = inject('WorklogTimerService');
        const result = (await $wltimer.pauseTimer()) as WorklogTimer | false;
        const entry = result || null;

        set({
            timerEntry: entry,
            curState: getElapseState(entry) || ({} as TimerState),
            needReload: false,
        });
    },

    stopTimer: async () => {
        const { $wltimer } = inject('WorklogTimerService');
        const result = (await $wltimer.stopTimer()) as WorklogTimer | undefined;
        const entry = result || null;

        set({
            timerEntry: entry,
            curState: getElapseState(entry) || ({} as TimerState),
            needReload: true,
        });
    },

    descChanged: async (desc: string) => {
        const { $wltimer } = inject('WorklogTimerService');
        const result = (await $wltimer.editTrackerInfo(undefined, undefined, desc)) as WorklogTimer | undefined;
        const entry = result || null;

        set({
            timerEntry: entry,
            curState: getElapseState(entry) || ({} as TimerState),
            needReload: false,
        });
    },

    loadTicketList: async (startAt = 0) => {
        if (get().ticketsList) return;

        const { $jira, $userutils } = inject('JiraService', 'UserUtilsService');

        const list = await $jira.searchTickets(ticketsJql, ['summary', 'issuetype', 'priority'], undefined, {
            maxResults: 15,
        });

        const getUrl = $userutils.getTicketUrl;

        const ticketsList = list.map((t: any) => {
            const { key, fields } = t;
            const { summary, issuetype, priority } = fields;
            return { key, summary, issuetype, priority, url: getUrl(key) };
        });

        set({ ticketsList });
    },
}));
