import classNames from 'classnames';

import { Button } from '@components';

import { GadgetAlert } from '@/gadgets/shared';

import { formatDateRange } from '../../shared/format';
import { parseDateKey } from '../../shared/segments';
import { removePlan } from '../pi-actions';
import { getPiStatus } from '../pi-model';
import PiPlannerInfo from './PiPlannerInfo';
import { usePiStore } from '../pi-store';
import type { TermSet } from '../terminology';

interface PiListViewProps {
    terms: TermSet;
    onOpen: (id: string) => void;
    onCreate: () => void;
}

const statusClassNames = {
    past: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    current: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    future: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export default function PiListView({ terms, onOpen, onCreate }: PiListViewProps) {
    const plans = usePiStore((s) => s.plans);
    const canEdit = usePiStore((s) => s.canEdit);
    const isLoading = usePiStore((s) => s.isListLoading);
    const error = usePiStore((s) => s.listError);

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4">
            <div className="flex items-center gap-2">
                <h2 className="me-auto text-lg font-semibold">{terms.plans}</h2>
                {canEdit && <Button label={`New ${terms.plan}`} leftIcon={<i className="fa fa-plus" />} onClick={onCreate} />}
            </div>
            {error && <GadgetAlert>{error}</GadgetAlert>}
            {!plans.length && !isLoading && !error && (
                <div className="rounded-lg border border-dashed border-(--border-primary) p-6 text-center text-sm text-(--text-secondary)">
                    No {terms.plans.toLowerCase()} yet. A {terms.plan.toLowerCase()} brings several teams (boards) together over a set of sprints.
                </div>
            )}
            {plans.map((plan) => {
                const status = getPiStatus(plan);
                return (
                    <div key={plan.id} className="flex items-center gap-3 rounded-lg border border-(--border-primary) bg-(--bg-primary) px-3 py-2">
                        <button type="button" className="flex min-w-0 flex-1 cursor-pointer flex-col text-left" onClick={() => onOpen(plan.id)}>
                            <span className="truncate font-semibold text-(--text-primary)">{plan.name}</span>
                            <span className="text-xs text-(--text-secondary)">
                                {formatDateRange(parseDateKey(plan.startDate), parseDateKey(plan.endDate))} · {plan.boardIds.length} {terms.teams.toLowerCase()}
                            </span>
                        </button>
                        <span className={classNames('rounded px-2 py-0.5 text-xs font-medium', statusClassNames[status])}>{status}</span>
                        {canEdit && (
                            <Button
                                size="sm"
                                layout="plain"
                                variant="danger"
                                leftIcon={<i className="fa fa-trash" />}
                                ariaLabel={`Delete ${plan.name}`}
                                confirmText={`Delete ${plan.name}? Objectives, risks and votes of the plan are deleted too.`}
                                onClick={() => removePlan(plan.id, plan.version)}
                            />
                        )}
                    </div>
                );
            })}
            {!plans.length && !isLoading && <PiPlannerInfo terms={terms} />}
        </div>
    );
}
