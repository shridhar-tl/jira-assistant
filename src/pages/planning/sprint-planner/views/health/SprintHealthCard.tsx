import { useState } from 'react';

import classNames from 'classnames';

import type { SprintCapacity } from '../../../shared/capacity';
import CapacityBar from '../../../shared/components/CapacityBar';
import { formatDateRange, getUnitLabel } from '../../../shared/format';
import type { SprintHealth } from '../../../shared/health';
import type { PlannerIssue, PlannerSprint } from '../../../shared/types';

interface SprintHealthCardProps {
    sprint: PlannerSprint;
    health: SprintHealth;
    capacity: SprintCapacity | null;
    unit: 'points' | 'hours';
    issueUrl: (key: string) => string;
}

interface Indicator {
    id: string;
    label: string;
    count: number;
    keys: string[];
    severity: 'warn' | 'error' | 'info';
}

function scoreClass(score: number): string {
    if (score >= 80) {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    }
    if (score >= 60) {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    }
    return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
}

const keysOf = (issues: PlannerIssue[]) => issues.map((i) => i.key);

/** Health indicators of one sprint (TR-1). Used in the health view and as the phone summary of the sprint board. */
export default function SprintHealthCard({ sprint, health, capacity, unit, issueUrl }: SprintHealthCardProps) {
    const [expanded, setExpanded] = useState<string | null>(null);

    const indicators: Indicator[] = [
        { id: 'unestimated', label: 'Not estimated', count: health.unestimated.length, keys: keysOf(health.unestimated), severity: 'warn' },
        { id: 'unassigned', label: 'Unassigned', count: health.unassigned.length, keys: keysOf(health.unassigned), severity: 'warn' },
        { id: 'blocked', label: 'Blocked by an open dependency', count: health.blocked.length, keys: keysOf(health.blocked), severity: 'error' },
        { id: 'due', label: 'Due after the sprint end', count: health.dueAfterEnd.length, keys: keysOf(health.dueAfterEnd), severity: 'warn' },
        {
            id: 'over',
            label: 'People over capacity',
            count: health.overCapacity.length,
            keys: health.overCapacity.map((m) => m.member.displayName),
            severity: 'error',
        },
        { id: 'carry', label: 'Carried over from earlier sprints', count: health.carryOver.length, keys: keysOf(health.carryOver), severity: 'info' },
    ];
    if (health.added) {
        indicators.push({ id: 'added', label: 'Added since the sprint started', count: health.added.length, keys: health.added, severity: 'info' });
    }
    if (health.removed) {
        indicators.push({ id: 'removed', label: 'Removed since the sprint started', count: health.removed.length, keys: health.removed, severity: 'info' });
    }

    const committed = capacity ? (unit === 'hours' ? capacity.committedHours : capacity.committedPoints) : 0;
    const available = capacity ? (unit === 'hours' ? capacity.capacityHours : capacity.capacityPoints) : 0;

    return (
        <div className="flex flex-col gap-2 rounded-lg border border-(--border-primary) bg-(--bg-primary) p-3 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-(--text-primary)">{sprint.name}</div>
                    <div className="text-xs text-(--text-secondary)">
                        {sprint.state} · {formatDateRange(capacity?.range?.start || sprint.startDate, capacity?.range?.end || sprint.endDate)} · {health.issueCount} issues
                    </div>
                </div>
                <span className={classNames('rounded-full px-2 py-0.5 text-sm font-bold', scoreClass(health.score))} title="Health score">
                    {health.score}
                </span>
            </div>
            {capacity && <CapacityBar committed={committed} capacity={available} level={capacity.level} unit={getUnitLabel(unit)} label="Commitment" />}
            <ul className="flex flex-col gap-0.5 text-sm">
                {indicators.map((indicator) => (
                    <li key={indicator.id}>
                        <button
                            type="button"
                            className={classNames('flex w-full items-center gap-2 rounded px-1 py-0.5 text-left', indicator.count ? 'cursor-pointer hover:bg-(--bg-hover)' : 'cursor-default text-(--text-tertiary)')}
                            onClick={() => indicator.count && setExpanded(expanded === indicator.id ? null : indicator.id)}
                            disabled={!indicator.count}
                        >
                            <i
                                className={classNames('fa w-4 text-center', {
                                    'fa-check text-emerald-500': !indicator.count,
                                    'fa-exclamation-circle text-red-500': indicator.count > 0 && indicator.severity === 'error',
                                    'fa-exclamation-triangle text-amber-500': indicator.count > 0 && indicator.severity === 'warn',
                                    'fa-info-circle text-sky-500': indicator.count > 0 && indicator.severity === 'info',
                                })}
                            />
                            <span className="flex-1">{indicator.label}</span>
                            <span className="font-semibold">{indicator.count}</span>
                        </button>
                        {expanded === indicator.id && (
                            <div className="ms-7 flex flex-wrap gap-1 py-1">
                                {indicator.keys.map((key) =>
                                    indicator.id === 'over' ? (
                                        <span key={key} className="rounded bg-(--bg-tertiary) px-1.5 text-xs">
                                            {key}
                                        </span>
                                    ) : (
                                        <a key={key} href={issueUrl(key)} target="_blank" rel="noreferrer" className="cursor-pointer rounded bg-(--bg-tertiary) px-1.5 text-xs hover:underline">
                                            {key}
                                        </a>
                                    ),
                                )}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
