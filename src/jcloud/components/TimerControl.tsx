import { useState, useEffect, useRef, useCallback } from 'react';

import { useWorklogStore, getDispTime } from '@/stores/worklog-store';

import InlineTextEditor from './InlineTextEditor';

interface TimerControlProps {
    curIssueKey?: string;
}

export default function TimerControl({ curIssueKey }: TimerControlProps) {
    const { curState, descChanged, startTimer } = useWorklogStore();
    const isForCurKey = !curIssueKey || curState.key === curIssueKey;
    const displayState = isForCurKey ? curState : { key: undefined, lapse: undefined, description: undefined, isRunning: false };
    const { key, lapse, description, isRunning } = displayState;

    const handleStartNew = useCallback(
        (event: React.MouseEvent) => {
            if (curIssueKey) {
                if (curState.key && curState.isRunning && curState.key !== curIssueKey) {
                    if (
                        window.confirm(
                            `Already timer is ${curState.isRunning ? 'running' : 'paused'} for "${curState.key}".\nWould you like to stop it and start new timer?`,
                        )
                    ) {
                        startTimer(curIssueKey, undefined, true);
                    }
                } else {
                    startTimer(curIssueKey);
                }
            }
        },
        [curIssueKey, curState.key, curState.isRunning, startTimer],
    );

    return (
        <div className="px-4">
            <Timer lapse={lapse} issueKey={key} isRunning={isRunning} startNewTimer={handleStartNew} />
            {!curIssueKey && key && (
                <div className="px-1 py-0.5 text-2xl whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer">
                    <span className="font-semibold mr-1">{key}</span>
                </div>
            )}
            {isForCurKey && (
                <div className="px-1 py-0.5">
                    <InlineTextEditor
                        value={description}
                        className="block text-xl cursor-pointer max-w-full whitespace-nowrap overflow-hidden text-ellipsis"
                        altClassName="italic cursor-pointer"
                        onChange={descChanged}
                        placeholder="<< click to add worklog comment >>"
                    />
                </div>
            )}
            {curIssueKey && !isForCurKey && (
                <span className="block px-6 text-base">
                    <strong>Note:</strong> Use the timer about to start tracking the time you spend in {curIssueKey}.
                </span>
            )}
            {curIssueKey && isForCurKey && (
                <span className="block px-6 text-base">
                    <strong>Note:</strong> Once you stop the timer, worklog would be created and shown in pending upload gadget of Jira
                    Assistant. You can review/edit and upload it to Jira as you wish.
                </span>
            )}
            {curIssueKey && <div className="h-16" />}
        </div>
    );
}

interface TimerProps {
    issueKey?: string;
    lapse?: number;
    isRunning?: boolean;
    startNewTimer: (event: React.MouseEvent) => void;
}

function Timer({ issueKey, lapse, isRunning, startNewTimer }: TimerProps) {
    return (
        <div className="block mx-auto my-4 w-91.25 h-42.5 px-4 rounded-4xl bg-blue-500 shadow-md shadow-blue-400 text-white">
            <TimeBlockContainer lapse={lapse || 0} isRunning={isRunning || false} />
            <TimerControls isRunning={isRunning} issueKey={issueKey} startNewTimer={startNewTimer} />
        </div>
    );
}

interface TimerControlsProps {
    issueKey?: string;
    isRunning?: boolean;
    startNewTimer: (event: React.MouseEvent) => void;
}

function TimerControls({ issueKey, isRunning, startNewTimer }: TimerControlsProps) {
    const { resumeTimer, pauseTimer, stopTimer } = useWorklogStore();

    return (
        <div className="flex justify-center mt-4">
            {!isRunning && (
                <span
                    className="fa fa-play inline-block text-4xl cursor-pointer mx-5 text-center text-green-300 hover:text-green-200"
                    onClick={!issueKey ? startNewTimer : resumeTimer}
                    title={!issueKey ? 'Start timer' : 'Resume timer'}
                />
            )}
            {isRunning && (
                <span
                    className="fa fa-pause inline-block text-4xl cursor-pointer mx-5 text-center text-yellow-300 hover:text-yellow-200"
                    title="Pause timer"
                    onClick={pauseTimer}
                />
            )}
            {!!issueKey && (
                <span
                    className="fa fa-stop inline-block text-4xl cursor-pointer mx-5 text-center text-red-300 hover:text-red-200"
                    title="Stop timer"
                    onClick={stopTimer}
                />
            )}
        </div>
    );
}

interface TimeBlockContainerProps {
    lapse: number;
    isRunning: boolean;
}

function TimeBlockContainer({ lapse, isRunning }: TimeBlockContainerProps) {
    const [timer, setDisplay] = useState(getDispTime(lapse));
    const timerHandleRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isRunning) {
            if (timerHandleRef.current) return;

            const hdl = setInterval(() => {
                setDisplay((prev) => getDispTime(prev.lapse + 1));
            }, 1000);
            timerHandleRef.current = hdl;
        } else if (timerHandleRef.current) {
            clearInterval(timerHandleRef.current);
            timerHandleRef.current = null;
        }
    }, [isRunning]);

    useEffect(() => {
        setDisplay(getDispTime(lapse));
    }, [lapse]);

    useEffect(() => {
        return () => {
            if (timerHandleRef.current) {
                clearInterval(timerHandleRef.current);
                timerHandleRef.current = null;
            }
        };
    }, []);

    const { h, m, s } = timer;

    return (
        <div className="block mx-auto w-auto">
            <TimeBlock time={h} text="HOURS" />
            <div className="inline-block align-top text-7xl leading-21 h-21 font-light -mt-2">:</div>
            <TimeBlock time={m} text="MINUTES" />
            <div className="inline-block align-top text-7xl leading-21 h-21 font-light -mt-2">:</div>
            <TimeBlock time={s} text="SECONDS" />
        </div>
    );
}

interface TimeBlockProps {
    time: string;
    text: string;
}

function TimeBlock({ time, text }: TimeBlockProps) {
    return (
        <div className="inline-block h-25 w-24.5">
            <span className="block text-7xl leading-21 h-21 font-semibold">{time}</span>
            <span className="block text-xs font-bold text-center pt-1">{text}</span>
        </div>
    );
}
