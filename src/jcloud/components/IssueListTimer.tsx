import { useEffect, useCallback } from 'react';

import classNames from 'classnames';

import Link from '@/controls/Link';
import { useWorklogStore } from '@/stores/worklog-store';

import GadgetMessage from './GadgetMessage';

const actionBtnClass =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)';

export default function IssueListTimer() {
    const { curState, ticketsList, loadTicketList, startTimer, resumeTimer, pauseTimer, stopTimer } = useWorklogStore();

    useEffect(() => {
        loadTicketList();
    }, [loadTicketList]);

    if (!ticketsList) {
        return <GadgetMessage icon="fa-spinner" spin text="Loading... Please wait..." />;
    }

    if (!ticketsList.length) {
        return <GadgetMessage icon="fa-inbox" text="No recent tickets assigned to, reported by or viewed by you" />;
    }

    const { key, isRunning } = curState || {};

    return (
        <div className="mt-3">
            <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary)">Recent tickets</span>
                <span className="rounded-full bg-(--bg-tertiary) px-2 py-0.5 text-[11px] font-semibold text-(--text-secondary)">
                    {ticketsList.length}
                </span>
            </div>
            <ul className="flex max-h-100 flex-col gap-1.5 overflow-y-auto pr-1">
                {ticketsList.map((t) => (
                    <TicketItem
                        key={t.key}
                        ticket={t}
                        isCurrent={t.key === key}
                        isRunning={isRunning}
                        startTimer={startTimer}
                        resumeTimer={resumeTimer}
                        pauseTimer={pauseTimer}
                        stopTimer={stopTimer}
                    />
                ))}
            </ul>
        </div>
    );
}

interface Ticket {
    key: string;
    summary: string;
    issuetype: { iconUrl?: string; name?: string };
    priority: { iconUrl?: string; name?: string };
    url?: string;
}

interface TicketItemProps {
    isCurrent: boolean;
    isRunning: boolean;
    ticket: Ticket;
    startTimer: (key: string, userId?: number, force?: boolean) => Promise<void>;
    resumeTimer: () => Promise<void>;
    pauseTimer: () => Promise<void>;
    stopTimer: () => Promise<void>;
}

function TicketItem({ isCurrent, isRunning, ticket, startTimer, resumeTimer, pauseTimer, stopTimer }: TicketItemProps) {
    const handleStart = useCallback(() => {
        if (isCurrent) {
            resumeTimer();
        } else {
            startTimer(ticket.key);
        }
    }, [isCurrent, ticket.key, resumeTimer, startTimer]);

    const isActive = isCurrent && isRunning;
    const isPaused = isCurrent && !isRunning;

    return (
        <li
            className={classNames(
                'group relative flex shrink-0 items-center gap-3 overflow-hidden rounded-lg border py-2 pr-2 pl-3 transition-colors',
                {
                    'border-(--border-primary) bg-(--bg-secondary) hover:border-(--border-secondary) hover:bg-(--bg-hover)': !isCurrent,
                    'border-emerald-500/40 bg-emerald-500/8': isActive,
                    'border-amber-500/40 bg-amber-500/8': isPaused,
                },
            )}
        >
            {isCurrent && (
                <span
                    className={classNames('absolute inset-y-0 left-0 w-1', {
                        'bg-emerald-500': isActive,
                        'bg-amber-500': isPaused,
                    })}
                />
            )}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    {ticket.issuetype?.iconUrl && (
                        <img src={ticket.issuetype.iconUrl} alt="" title={ticket.issuetype.name} className="h-4 w-4 shrink-0" />
                    )}
                    <Link href={ticket.url || ''} className="shrink-0 text-xs font-semibold cursor-pointer hover:underline">
                        {ticket.key}
                    </Link>
                    {ticket.priority?.iconUrl && (
                        <img src={ticket.priority.iconUrl} alt="" title={ticket.priority.name} className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {isCurrent && (
                        <span
                            className={classNames('ml-auto rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide', {
                                'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400': isActive,
                                'bg-amber-500/15 text-amber-700 dark:text-amber-400': isPaused,
                            })}
                        >
                            {isActive ? 'Tracking' : 'Paused'}
                        </span>
                    )}
                </div>
                <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-(--text-primary)" title={ticket.summary}>
                    {ticket.summary}
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
                {!isActive && (
                    <button
                        type="button"
                        className={classNames(
                            actionBtnClass,
                            'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500 hover:text-white dark:text-emerald-400',
                        )}
                        onClick={handleStart}
                        title={isCurrent ? 'Resume tracking' : 'Start tracking'}
                        aria-label={isCurrent ? 'Resume tracking' : 'Start tracking'}
                    >
                        <span className="fa fa-play" />
                    </button>
                )}
                {isActive && (
                    <button
                        type="button"
                        className={classNames(
                            actionBtnClass,
                            'border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500 hover:text-white dark:text-amber-400',
                        )}
                        onClick={pauseTimer}
                        title="Pause timer"
                        aria-label="Pause timer"
                    >
                        <span className="fa fa-pause" />
                    </button>
                )}
                {isCurrent && (
                    <button
                        type="button"
                        className={classNames(
                            actionBtnClass,
                            'border-red-500/40 bg-red-500/10 text-red-700 hover:bg-red-500 hover:text-white dark:text-red-400',
                        )}
                        onClick={stopTimer}
                        title="Stop timer and create worklog"
                        aria-label="Stop timer and create worklog"
                    >
                        <span className="fa fa-stop" />
                    </button>
                )}
            </div>
        </li>
    );
}
