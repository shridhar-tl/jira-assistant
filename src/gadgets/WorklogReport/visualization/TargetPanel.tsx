import { useCallback, useMemo, useState } from 'react';

import classNames from 'classnames';

import { Button, ProgressBar } from '@components';

import { pluralize } from './breakdown-utils';
import { getTargetProgress } from './insight-utils';
import type { DailyTarget, GroupTarget, TargetStatus, UserTargetProgress } from './types';
import VizPanel from './VizPanel';

const visibleUserCount = 8;

const statusVariants: Record<TargetStatus, 'warning' | 'success' | 'danger'> = {
    under: 'warning',
    on: 'success',
    over: 'danger',
};

const statusLabels: Record<TargetStatus, string> = {
    under: 'Behind',
    on: 'On target',
    over: 'Over',
};

const statusTextClasses: Record<TargetStatus, string> = {
    under: 'text-amber-600 dark:text-amber-400',
    on: 'text-emerald-600 dark:text-emerald-400',
    over: 'text-rose-600 dark:text-rose-400',
};

const statusOrder: TargetStatus[] = ['under', 'on', 'over'];

interface TargetPanelProps {
    target: GroupTarget;
    daily: DailyTarget;
    formatTime: (secs: number) => string;
}

function getDailyText({ minSecsPerDay, maxSecsPerDay }: DailyTarget, formatTime: (secs: number) => string): string {
    return minSecsPerDay === maxSecsPerDay ? formatTime(minSecsPerDay) : `${formatTime(minSecsPerDay)} - ${formatTime(maxSecsPerDay)}`;
}

function TargetRow({ user, formatTime }: { user: UserTargetProgress; formatTime: (secs: number) => string }) {
    const { displayName, logged, expectedMin, percentage, status } = user;
    return (
        <li className="target-row flex flex-col gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-(--bg-hover)" data-status={status}>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="target-user min-w-0 truncate text-(--text-primary)">{displayName}</span>
                <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                    <span className="target-logged font-semibold text-(--text-primary)">{formatTime(logged)}</span>
                    <span className="text-xs text-(--text-secondary)">/ {formatTime(expectedMin)}</span>
                    <span className={classNames('target-percent w-11 text-right text-xs font-medium', statusTextClasses[status])}>{percentage}%</span>
                </span>
            </div>
            <ProgressBar value={Math.min(logged, expectedMin)} max={expectedMin} size="xs" layout="rounded" variant={statusVariants[status]} ariaLabel={`${displayName}: ${percentage}% of expected`} />
        </li>
    );
}

function TargetPanel({ target, daily, formatTime }: TargetPanelProps) {
    const [showAll, setShowAll] = useState(false);
    const toggleShowAll = useCallback(() => setShowAll((v) => !v), []);

    const users = useMemo(() => getTargetProgress(target, daily), [target, daily]);
    const counts = useMemo(() => statusOrder.map((status) => ({ status, count: users.filter((u) => u.status === status).length })), [users]);

    const rows = showAll ? users : users.slice(0, visibleUserCount);
    const toggle = users.length > visibleUserCount && (
        <Button className="target-toggle cursor-pointer" layout="plain" size="xs" onClick={toggleShowAll}>
            {showAll ? 'Show less' : `Show all ${pluralize(users.length, 'user')}`}
        </Button>
    );

    return (
        <VizPanel className="target-panel" title="Logged vs expected" meta={pluralize(target.workingDays, 'working day')} accentClass="bg-(--viz-target)" footer={toggle}>
            <p className="target-caption m-0 mb-2 px-2 text-xs text-(--text-secondary)">
                {getDailyText(daily, formatTime)} a day for {pluralize(target.workingDays, 'working day')} up to today
            </p>
            <div className="mb-2 flex flex-wrap gap-1.5 px-2">
                {counts.map(({ status, count }) => (
                    <span
                        key={status}
                        className={classNames('target-count rounded-full bg-(--bg-primary) px-2 py-0.5 text-xs font-medium', statusTextClasses[status])}
                        data-status={status}
                    >
                        {statusLabels[status]}: {count}
                    </span>
                ))}
            </div>
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                {rows.map((user) => (
                    <TargetRow key={user.name} user={user} formatTime={formatTime} />
                ))}
            </ul>
        </VizPanel>
    );
}

export default TargetPanel;
