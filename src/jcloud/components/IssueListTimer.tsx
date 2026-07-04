import { useEffect, useCallback } from 'react';

import Link from '@/controls/Link';
import { useWorklogStore } from '@/stores/worklog-store';

export default function IssueListTimer() {
    const { curState, ticketsList, loadTicketList, startTimer, resumeTimer, pauseTimer, stopTimer } = useWorklogStore();

    useEffect(() => {
        loadTicketList();
    }, [loadTicketList]);

    if (!ticketsList) {
        return <div className="p-4 text-center text-gray-500">Loading... Please wait...</div>;
    }

    const { key, isRunning } = curState || {};

    return (
        <div className="max-h-100 pr-3 overflow-y-auto">
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

    return (
        <div className="h-14 bg-linear-to-br from-purple-200 via-purple-300 to-purple-400 rounded-2xl py-1 px-1 pl-3 my-2 mx-auto flex items-center">
            <div className="block min-w-25 h-full">
                <div className="flex gap-1 items-center">
                    {ticket.issuetype?.iconUrl && (
                        <img src={ticket.issuetype.iconUrl} alt="" title={ticket.issuetype.name} className="h-6 w-6" />
                    )}
                    {ticket.priority?.iconUrl && (
                        <img src={ticket.priority.iconUrl} alt="" title={ticket.priority.name} className="h-6 w-6" />
                    )}
                </div>
                <div className="block">
                    <Link href={ticket.url || ''} className="font-semibold cursor-pointer text-sm">
                        {ticket.key}
                    </Link>
                </div>
            </div>
            <div className="h-full flex flex-col items-center px-2.5 py-0.5 overflow-hidden">
                {(!isCurrent || !isRunning) && (
                    <span
                        className="fa fa-play text-lg cursor-pointer mb-1 text-green-700 hover:text-green-600"
                        onClick={handleStart}
                        title={isCurrent ? 'Resume tracking' : 'Start tracking'}
                    />
                )}
                {isCurrent && isRunning && (
                    <span
                        className="fa fa-pause text-lg cursor-pointer mb-1 text-yellow-600 hover:text-yellow-500"
                        onClick={pauseTimer}
                        title="Pause timer"
                    />
                )}
                {isCurrent && (
                    <span
                        className="fa fa-stop text-lg cursor-pointer text-red-600 hover:text-red-500"
                        onClick={stopTimer}
                        title="Stop timer and create worklog"
                    />
                )}
            </div>
            <div className="h-full flex-1 p-0.5 overflow-hidden text-ellipsis text-sm">{ticket.summary}</div>
        </div>
    );
}
