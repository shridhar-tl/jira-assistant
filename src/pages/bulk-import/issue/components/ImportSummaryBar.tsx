import classNames from 'classnames';

import type { ImportStats } from '../types';

interface ImportSummaryBarProps {
    stats: ImportStats;
}

interface StatItem {
    key: keyof ImportStats;
    label: string;
    className: string;
    alwaysVisible?: boolean;
}

const statItems: StatItem[] = [
    { key: 'total', label: 'Rows', className: 'text-(--text-primary)', alwaysVisible: true },
    { key: 'selected', label: 'Selected', className: 'text-(--color-primary-600)', alwaysVisible: true },
    { key: 'toCreate', label: 'To create', className: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'toUpdate', label: 'To update', className: 'text-blue-600 dark:text-blue-400' },
    { key: 'toClone', label: 'To clone', className: 'text-violet-600 dark:text-violet-400' },
    { key: 'toDelete', label: 'To delete', className: 'text-red-600 dark:text-red-400' },
    { key: 'errors', label: 'With errors', className: 'text-red-600 dark:text-red-400' },
    { key: 'warnings', label: 'With warnings', className: 'text-amber-600 dark:text-amber-400' },
    { key: 'imported', label: 'Imported', className: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'failed', label: 'Failed', className: 'text-red-600 dark:text-red-400' },
];

function ImportSummaryBar({ stats }: ImportSummaryBarProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {statItems
                .filter((item) => item.alwaysVisible || stats[item.key] > 0)
                .map((item) => (
                    <div
                        key={item.key}
                        className="flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg bg-(--bg-primary) border border-(--border-primary)"
                    >
                        <span className={classNames('text-base font-semibold tabular-nums', item.className)}>{stats[item.key]}</span>
                        <span className="text-xs text-(--text-secondary)">{item.label}</span>
                    </div>
                ))}
        </div>
    );
}

export default ImportSummaryBar;
