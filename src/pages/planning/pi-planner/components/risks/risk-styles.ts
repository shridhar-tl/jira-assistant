import type { DueState } from '../../pi-progress';
import type { AcceptanceStatus, RoamStatus } from '../../pi-types';

export const roamOrder: RoamStatus[] = ['open', 'owned', 'accepted', 'mitigated', 'resolved'];

export const roamHeaderClassNames: Record<RoamStatus, string> = {
    open: 'border-t-red-500',
    owned: 'border-t-amber-500',
    accepted: 'border-t-slate-400',
    mitigated: 'border-t-sky-500',
    resolved: 'border-t-emerald-500',
};

export const dueBadgeClassNames: Record<DueState, string> = {
    none: '',
    ok: 'bg-(--bg-tertiary) text-(--text-secondary)',
    dueSoon: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    overdue: 'bg-red-600 text-white',
    closed: 'bg-(--bg-tertiary) text-(--text-tertiary)',
};

export const acceptanceClassNames: Record<AcceptanceStatus, string> = {
    pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    declined: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};
