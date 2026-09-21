import { useState, useEffect, useRef, useCallback } from 'react';

import classNames from 'classnames';

import { useWorklogStore, getDispTime } from '@/stores/worklog-store';

import InlineTextEditor from './InlineTextEditor';
import './TimerControl.css';

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
        <div className="w-full max-w-125 mx-auto px-3 sm:px-4 pt-4 pb-3">
            <Timer lapse={lapse} issueKey={key} isRunning={isRunning} startNewTimer={handleStartNew} />
            {(!!key || isForCurKey) && (
                <div className="mt-3 rounded-xl border border-(--border-primary) bg-(--bg-secondary) px-3 py-2.5">
                    {!curIssueKey && key && (
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="fa fa-ticket text-xs text-(--text-tertiary)" />
                            <span className="font-semibold text-sm tracking-wide text-(--text-primary) truncate">{key}</span>
                        </div>
                    )}
                    {isForCurKey && (
                        <InlineTextEditor
                            value={description}
                            className="block text-sm leading-snug text-(--text-primary) cursor-pointer hover:text-(--primary-color) transition-colors"
                            altClassName="block text-sm italic text-(--text-tertiary) cursor-pointer hover:text-(--primary-color) transition-colors"
                            onChange={descChanged}
                            placeholder="Click to add a worklog comment"
                        />
                    )}
                </div>
            )}
            {curIssueKey && (
                <p className="mt-3 flex gap-2 text-xs leading-relaxed text-(--text-secondary)">
                    <span className="fa fa-info-circle mt-0.5 shrink-0 text-(--text-tertiary)" />
                    <span>
                        {isForCurKey
                            ? 'Once you stop the timer, a worklog is created and shown in the pending upload gadget of Jira Assistant. You can review, edit and upload it to Jira as you wish.'
                            : `Use the timer above to start tracking the time you spend on ${curIssueKey}.`}
                    </span>
                </p>
            )}
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
    const isIdle = !issueKey;

    return (
        <div
            className={classNames('ja-timer-card', {
                'ja-timer-card--running': isRunning,
                'ja-timer-card--paused': !!issueKey && !isRunning,
                'ja-timer-card--idle': isIdle,
            })}
        >
            <StatusBadge issueKey={issueKey} isRunning={isRunning} />
            <TimeBlockContainer lapse={lapse || 0} isRunning={isRunning || false} />
            <TimerControls isRunning={isRunning} issueKey={issueKey} startNewTimer={startNewTimer} />
        </div>
    );
}

interface StatusBadgeProps {
    issueKey?: string;
    isRunning?: boolean;
}

function StatusBadge({ issueKey, isRunning }: StatusBadgeProps) {
    const label = !issueKey ? 'Not tracking' : isRunning ? 'Tracking' : 'Paused';

    return (
        <div className="ja-timer-status">
            <span className={classNames('ja-timer-status__dot', { 'ja-timer-status__dot--pulse': isRunning })} />
            {label}
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
        <div className="ja-timer-actions">
            {!isRunning && (
                <button
                    type="button"
                    className="ja-timer-btn ja-timer-btn--primary"
                    onClick={!issueKey ? startNewTimer : resumeTimer}
                    title={!issueKey ? 'Start timer' : 'Resume timer'}
                >
                    <span className="fa fa-play" />
                    <span>{!issueKey ? 'Start' : 'Resume'}</span>
                </button>
            )}
            {isRunning && (
                <button type="button" className="ja-timer-btn ja-timer-btn--warn" title="Pause timer" onClick={pauseTimer}>
                    <span className="fa fa-pause" />
                    <span>Pause</span>
                </button>
            )}
            {!!issueKey && (
                <button type="button" className="ja-timer-btn ja-timer-btn--danger" title="Stop timer" onClick={stopTimer}>
                    <span className="fa fa-stop" />
                    <span>Stop</span>
                </button>
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
        <div className="ja-timer-display">
            <TimeBlock time={h} text="Hours" />
            <span className={classNames('ja-timer-sep', { 'ja-timer-sep--blink': isRunning })}>:</span>
            <TimeBlock time={m} text="Minutes" />
            <span className={classNames('ja-timer-sep', { 'ja-timer-sep--blink': isRunning })}>:</span>
            <TimeBlock time={s} text="Seconds" />
        </div>
    );
}

interface TimeBlockProps {
    time: string;
    text: string;
}

function TimeBlock({ time, text }: TimeBlockProps) {
    return (
        <div className="ja-timer-unit">
            <span className="ja-timer-unit__value">{time}</span>
            <span className="ja-timer-unit__label">{text}</span>
        </div>
    );
}
