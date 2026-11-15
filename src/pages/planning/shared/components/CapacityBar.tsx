import classNames from 'classnames';

import type { CapacityLevel } from '../capacity';
import { formatNumber } from '../format';

interface CapacityBarProps {
    committed: number;
    capacity: number;
    level: CapacityLevel;
    unit: string;
    label?: string;
    compact?: boolean;
    className?: string;
}

const levelClassNames: Record<CapacityLevel, string> = {
    none: 'bg-(--border-primary)',
    under: 'bg-emerald-500',
    near: 'bg-amber-500',
    over: 'bg-red-500',
};

const levelText: Record<CapacityLevel, string> = {
    none: 'No capacity',
    under: 'Under capacity',
    near: 'Near capacity',
    over: 'Over capacity',
};

/** Committed work against capacity, coloured by state (under / near / over). Reused by the sprint board, capacity view and widget. */
export default function CapacityBar({ committed, capacity, level, unit, label, compact, className }: CapacityBarProps) {
    const percent = capacity > 0 ? Math.round((committed * 100) / capacity) : null;
    const width = percent === null ? (committed > 0 ? 100 : 0) : Math.min(100, percent);
    const title = `${label ? `${label}: ` : ''}${formatNumber(committed)} of ${formatNumber(capacity)} ${unit} (${percent ?? '–'}%) · ${levelText[level]}`;

    return (
        <div className={classNames('min-w-0', className)} title={title} aria-label={title} role="meter" aria-valuenow={committed} aria-valuemin={0} aria-valuemax={capacity}>
            {!compact && (
                <div className="mb-0.5 flex items-center justify-between gap-2 text-[11px] text-(--text-secondary)">
                    <span className="truncate">{label}</span>
                    <span className={classNames('shrink-0 font-medium', { 'text-red-600 dark:text-red-400': level === 'over' })}>
                        {formatNumber(committed)} / {formatNumber(capacity)} {unit}
                    </span>
                </div>
            )}
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-(--bg-tertiary)">
                <div className={classNames('absolute inset-y-0 left-0 rounded-full', levelClassNames[level])} style={{ width: `${width}%` }} />
            </div>
        </div>
    );
}
