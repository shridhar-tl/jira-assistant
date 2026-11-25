import { Link } from 'react-router';

import classNames from 'classnames';
import { formatDistanceToNow, parseISO } from 'date-fns';

import { GadgetAlert } from '@/gadgets/shared';

import { AvatarGroup, Button, EmptyState, ProgressBar } from '@components';

import { formatDateRange } from '../../shared/format';
import { parseDateKey } from '../../shared/segments';
import { removePlan } from '../pi-actions';
import { getPiStatus } from '../pi-model';
import { getElapsedPercent } from '../pi-progress';
import { usePiStore } from '../pi-store';
import type { PiSummary } from '../pi-types';
import { articleTerm, lowerTerm, type TermSet } from '../terminology';

import PersonChip from './common/PersonChip';
import PiPlannerInfo from './PiPlannerInfo';

interface PiListViewProps {
    plans: PiSummary[];
    terms: TermSet;
    teamNames: Map<number, string>;
    planUrl: (id: string) => string;
    onCreate: (() => void) | null;
}

const statusLabels = { past: 'Completed', current: 'In progress', future: 'Upcoming' };

const statusClassNames = {
    past: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    current: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    future: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const maxTeamAvatars = 5;

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatUpdated(value: string): string {
    return value ? `${formatDistanceToNow(parseISO(value))} ago` : '';
}

/** The plans of the chosen ART as cards: dates and how far they are, teams, and who created and last changed each plan. */
export default function PiListView({ plans, terms, teamNames, planUrl, onCreate }: PiListViewProps) {
    const canEdit = usePiStore((s) => s.canEdit);
    const isLoading = usePiStore((s) => s.isListLoading);
    const error = usePiStore((s) => s.listError);
    const hiddenPlans = usePiStore((s) => s.hiddenPlans);
    const hiddenArts = usePiStore((s) => s.hiddenArts);

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-4">
            <div className="flex items-center gap-2">
                <h2 className="me-auto text-lg font-semibold">{terms.plans}</h2>
                {canEdit && onCreate && <Button size="sm" label={`New ${lowerTerm(terms.plan)}`} leftIcon={<i className="fa fa-plus" />} onClick={onCreate} />}
            </div>
            {error && <GadgetAlert>{error}</GadgetAlert>}
            {(hiddenPlans > 0 || hiddenArts > 0) && (
                <GadgetAlert variant="warning" className="m-0">
                    {[hiddenPlans > 0 && `${hiddenPlans} ${lowerTerm(hiddenPlans === 1 ? terms.plan : terms.plans)}`, hiddenArts > 0 && `${hiddenArts} ${lowerTerm(hiddenArts === 1 ? terms.program : terms.programs)}`]
                        .filter(Boolean)
                        .join(' and ')}{' '}
                    {hiddenPlans + hiddenArts === 1 ? 'is' : 'are'} not shown because you do not have access to the boards of their teams.
                </GadgetAlert>
            )}
            {!plans.length && !isLoading && !error && (
                <EmptyState
                    title={`No ${lowerTerm(terms.plans)} yet`}
                    description={`${capitalize(articleTerm(terms.plan))} brings the teams together over a set of sprints.`}
                    size="sm"
                    action={canEdit && onCreate ? { label: `New ${lowerTerm(terms.plan)}`, onClick: onCreate } : undefined}
                />
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan) => {
                    const status = getPiStatus(plan);
                    const elapsed = getElapsedPercent(plan);
                    const teams = plan.boardIds.map((id) => plan.teams.find((t) => t.boardId === id)?.name || teamNames.get(id) || `Board ${id}`);
                    return (
                        <article
                            key={plan.id}
                            className="group flex flex-col gap-3 rounded-xl border border-(--border-primary) bg-(--bg-primary) p-4 shadow-sm transition-shadow hover:shadow-md"
                            data-plan-id={plan.id}
                        >
                            <div className="flex items-start gap-2">
                                <Link to={planUrl(plan.id)} className="flex min-w-0 flex-1 cursor-pointer flex-col text-left">
                                    <span className="truncate text-base font-semibold text-(--text-primary) group-hover:text-(--color-primary-600)">{plan.name}</span>
                                    <span className="text-xs text-(--text-secondary)">
                                        <i className="fa fa-calendar me-1" />
                                        {formatDateRange(parseDateKey(plan.startDate), parseDateKey(plan.endDate))}
                                    </span>
                                </Link>
                                <span className={classNames('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', statusClassNames[status])}>{statusLabels[status]}</span>
                                {canEdit && (
                                    <Button
                                        size="xs"
                                        layout="plain"
                                        variant="danger"
                                        leftIcon={<i className="fa fa-trash" />}
                                        ariaLabel={`Delete ${plan.name}`}
                                        confirmText={`Delete ${plan.name}? Objectives, risks, dependencies and votes of the plan are deleted too.`}
                                        onClick={() => removePlan(plan.id, plan.version)}
                                    />
                                )}
                            </div>
                            {status === 'current' && <ProgressBar value={elapsed} size="xs" variant="info" ariaLabel={`${elapsed}% of the time has passed`} />}
                            <div className="flex items-center gap-2">
                                <AvatarGroup items={teams.map((name) => ({ name }))} max={maxTeamAvatars} size="sm" shape="rounded" />
                                <span className="truncate text-xs text-(--text-secondary)" title={teams.join(', ')}>
                                    {teams.length} {lowerTerm(teams.length === 1 ? terms.team : terms.teams)}
                                </span>
                            </div>
                            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-(--border-secondary) pt-2">
                                <PersonChip user={plan.createdBy} prefix="Created by" />
                                {plan.updated && <span className="text-[11px] text-(--text-tertiary)" title={plan.updatedBy ? `Updated by ${plan.updatedBy.displayName}` : undefined}>Updated {formatUpdated(plan.updated)}</span>}
                            </div>
                        </article>
                    );
                })}
            </div>
            {!plans.length && !isLoading && <PiPlannerInfo terms={terms} />}
        </div>
    );
}
