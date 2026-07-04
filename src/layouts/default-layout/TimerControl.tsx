import { useState, useEffect, useCallback } from 'react';

import { AddWorklog } from '@dialogs';

import { Link } from '@/controls';
import { useWorklogStore } from '@/stores/worklog-store';

import { inject } from '@services';

export default function TimerControl() {
    const [showEditor, setShowEditor] = useState(false);
    const { getElapsedTimeInSecs, resumeTimer, pauseTimer, stopTimer } = useWorklogStore();
    const { $userutils } = inject('UserUtilsService');

    const curTime = getElapsedTimeInSecs();

    const trackerUpdated = useCallback(() => {
        setShowEditor(false);
    }, []);

    if (!curTime) return null;

    const ticketUrl = $userutils.getTicketUrl(curTime.key) || '';

    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
            <Link className="font-semibold text-blue-600 dark:text-blue-300 no-underline hover:underline" href={ticketUrl}>
                {curTime.key}
            </Link>
            <Lapse
                key={`${curTime.key}_${curTime.isRunning ? 'R' : 'S'}`}
                isRunning={curTime.isRunning}
                lapse={curTime.lapse}
                title={curTime.description}
            />
            {!curTime.isRunning && (
                <i
                    className="fa fa-play cursor-pointer text-green-600 hover:text-green-700"
                    title="Resume time tracking"
                    onClick={resumeTimer}
                />
            )}
            {curTime.isRunning && (
                <i
                    className="fa fa-pause cursor-pointer text-yellow-600 hover:text-yellow-700"
                    title="Pause time tracking"
                    onClick={pauseTimer}
                />
            )}
            <i
                className="fa fa-stop cursor-pointer text-red-600 hover:text-red-700"
                title="Stop time tracking and create worklog entry"
                onClick={stopTimer}
            />
            <i
                className="fa fa-edit cursor-pointer text-blue-600 hover:text-blue-700"
                title="Edit working comment"
                onClick={() => setShowEditor(true)}
            />
            {showEditor && <AddWorklog editTracker={true} onDone={trackerUpdated} onHide={() => setShowEditor(false)} />}
        </div>
    );
}

interface LapseProps {
    isRunning: boolean;
    lapse: number;
    title?: string;
}

function padNum(n: number, len: number): string {
    return String(n).padStart(len, '0');
}

function Lapse({ isRunning, lapse: initialLapse, title }: LapseProps) {
    const [lapse, setLapse] = useState(initialLapse);

    useEffect(() => {
        if (isRunning) {
            const token = setInterval(() => setLapse((l) => l + 1), 1000);
            return () => clearInterval(token);
        }
    }, [isRunning]);

    const hours = Math.floor(lapse / 3600);
    const mins = Math.floor((lapse % 3600) / 60);
    const secs = Math.floor(lapse % 60);

    let display: string;
    if (hours) {
        display = `${padNum(hours, 2)}:${padNum(mins, 2)}:${padNum(secs, 2)}`;
    } else if (mins) {
        display = `${padNum(mins, 2)}:${padNum(secs, 2)}`;
    } else {
        display = `${padNum(secs, 2)}s`;
    }

    return (
        <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-300" title={title}>
            {display}
        </span>
    );
}
