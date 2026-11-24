import classNames from 'classnames';

import type { StatusCategory } from '../../../shared/types';

interface StatusPillProps {
    status: string;
    category: StatusCategory;
}

const categoryClassNames: Record<StatusCategory, string> = {
    new: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    indeterminate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

/** A Jira status coloured by its category, like Jira's own lozenges. */
export default function StatusPill({ status, category }: StatusPillProps) {
    return (
        <span className={classNames('inline-flex max-w-28 shrink-0 truncate rounded px-1.5 py-px text-[10px] font-semibold uppercase', categoryClassNames[category])} title={status}>
            {status}
        </span>
    );
}
