import { useMemo, type ReactNode } from 'react';

import classNames from 'classnames';

import { ProgressBar } from '@components';

import { getIssueHours, getIssuePoints } from '../../shared/capacity';
import { formatNumber } from '../../shared/format';
import { buildDependencyEntries } from '../pi-dependency-model';
import type { PiData } from '../pi-loader';
import { unplannedIterationId, type ProgramModel } from '../pi-model';
import { formatMeasure, getElapsedPercent, getPredictability } from '../pi-progress';
import { buildRiskEntries } from '../pi-risk-model';
import { usePiStore } from '../pi-store';
import { getBurnUp, getObjectiveStatuses, getPlanHighlights, getTeamProgress, type HighlightView } from '../pi-summary-model';
import type { PiDocument } from '../pi-types';
import { lowerTerm, type TermSet } from '../terminology';
import usePlanIssues from '../usePlanIssues';

import { roamOrder } from './risks/risk-styles';
import BurnUpChart from './summary/BurnUpChart';
import HighlightsPanel from './summary/HighlightsPanel';
import TeamProgressChart from './summary/TeamProgressChart';

interface PiSummaryViewProps {
    doc: PiDocument;
    data: PiData;
    model: ProgramModel;
    terms: TermSet;
    onNavigate: (view: HighlightView) => void;
}

interface TileProps {
    label: string;
    value: string;
    detail?: ReactNode;
    tone?: 'good' | 'warning' | 'danger';
    children?: ReactNode;
}

function Tile({ label, value, detail, tone, children }: TileProps) {
    return (
        <div className="flex flex-col gap-1 rounded-lg border border-(--border-primary) bg-(--bg-primary) p-3">
            <span className="text-xs text-(--text-secondary)">{label}</span>
            <span
                className={classNames('text-2xl font-semibold', {
                    'text-emerald-600 dark:text-emerald-400': tone === 'good',
                    'text-amber-600 dark:text-amber-400': tone === 'warning',
                    'text-red-600 dark:text-red-400': tone === 'danger',
                })}
            >
                {value}
            </span>
            {children}
            {detail && <span className="text-[11px] text-(--text-tertiary)">{detail}</span>}
        </div>
    );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
    return (
        <section className="flex min-w-0 flex-col gap-2 rounded-lg border border-(--border-primary) bg-(--bg-primary) p-3">
            <div className="flex flex-col">
                <h3 className="text-sm font-semibold">{title}</h3>
                {subtitle && <span className="text-xs text-(--text-tertiary)">{subtitle}</span>}
            </div>
            {children}
        </section>
    );
}

/** How the plan is going: time against work done, what goes well and what needs attention, burn-up, team progress, capacity, objectives and risks (PI-9). */
export default function PiSummaryView({ doc, data, model, terms, onNavigate }: PiSummaryViewProps) {
    const incoming = usePiStore((s) => s.incoming);
    const arts = usePiStore((s) => s.arts);
    const { issues, sprintEnds } = usePlanIssues(doc, data);

    const elapsed = getElapsedPercent(doc);
    const teams = useMemo(() => getTeamProgress(doc, data, model), [doc, data, model]);
    const burnUp = useMemo(() => getBurnUp(doc, data, model, sprintEnds), [doc, data, model, sprintEnds]);
    const objectives = useMemo(() => getObjectiveStatuses(doc, issues, sprintEnds), [doc, issues, sprintEnds]);
    const dependencies = useMemo(() => buildDependencyEntries(doc, incoming, arts, issues, sprintEnds), [doc, incoming, arts, issues, sprintEnds]);
    const risks = useMemo(() => buildRiskEntries(doc, incoming, terms.program), [doc, incoming, terms.program]);
    const linkConflicts = model.dependencies.filter((d) => d.conflict !== 'none' && !d.blockerDone).length;
    const highlights = useMemo(
        () => getPlanHighlights(doc, teams, objectives, dependencies, risks, linkConflicts, terms),
        [doc, teams, objectives, dependencies, risks, linkConflicts, terms],
    );

    const predictability = getPredictability(doc.objectives);
    const scope = burnUp.scope[0] || 0;
    const finished = [...burnUp.done].reverse().find((v): v is number => v !== null) ?? 0;
    const donePercent = scope > 0 ? Math.round((finished * 100) / scope) : 0;
    const committed = objectives.filter((o) => o.objective.committed);
    const onTrackObjectives = committed.filter((o) => o.health === 'achieved' || o.health === 'onTrack').length;
    const openDependencies = dependencies.filter((d) => d.health !== 'delivered' && d.health !== 'declined');
    const lateDependencies = dependencies.filter((d) => d.health === 'late' || d.health === 'declined').length;
    const openRisks = risks.filter((r) => r.due !== 'closed');
    const overdueRisks = risks.filter((r) => r.due === 'overdue').length;

    return (
        <div className="flex flex-col gap-4 p-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <Tile label="Time gone" value={`${elapsed}%`} detail={`${doc.startDate} to ${doc.endDate}`}>
                    <ProgressBar value={elapsed} size="sm" ariaLabel="Time gone" />
                </Tile>
                <Tile label="Work finished" value={`${donePercent}%`} tone={donePercent >= elapsed ? 'good' : donePercent < elapsed - 20 ? 'danger' : 'warning'} detail={`${formatMeasure(finished, burnUp.measure)} of ${formatMeasure(scope, burnUp.measure)}`}>
                    <ProgressBar value={donePercent} size="sm" variant={donePercent >= elapsed ? 'success' : 'warning'} ariaLabel="Work finished" />
                </Tile>
                <Tile
                    label={`${terms.objectives} on track`}
                    value={committed.length ? `${onTrackObjectives}/${committed.length}` : '–'}
                    tone={committed.length ? (onTrackObjectives === committed.length ? 'good' : 'warning') : undefined}
                    detail="Committed, by linked work"
                />
                <Tile label="Predictability" value={predictability === null ? '–' : `${predictability}%`} tone={predictability === null ? undefined : predictability >= 80 ? 'good' : 'warning'} detail={`${terms.actualValue} against ${lowerTerm(terms.plannedValue)}`} />
                <Tile label="Open dependencies" value={String(openDependencies.length)} tone={lateDependencies ? 'danger' : undefined} detail={lateDependencies ? `${lateDependencies} late or declined` : `${linkConflicts} issue link conflicts`} />
                <Tile label={`Open ${lowerTerm(terms.risks)}`} value={String(openRisks.length)} tone={overdueRisks ? 'danger' : undefined} detail={overdueRisks ? `${overdueRisks} overdue` : 'None overdue'} />
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <HighlightsPanel title="Needs attention" tone="attention" items={highlights.attention} emptyText="Nothing needs attention right now." onNavigate={onNavigate} />
                <HighlightsPanel title="Going well" tone="good" items={highlights.good} emptyText="Nothing to call out yet." onNavigate={onNavigate} />
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <Card title="Burn-up" subtitle={`Finished work against the work planned to be finished by the end of each ${lowerTerm(terms.iteration)}`}>
                    {doc.iterations.length ? <BurnUpChart burnUp={burnUp} /> : <span className="text-xs text-(--text-tertiary)">No {lowerTerm(terms.iteration)}s yet.</span>}
                </Card>
                <Card title={`Progress by ${lowerTerm(terms.team)}`} subtitle={`Share of each ${lowerTerm(terms.team)}'s scope. ${elapsed}% of the time has passed.`}>
                    {teams.some((t) => t.total > 0) ? (
                        <TeamProgressChart teams={teams} elapsedPercent={elapsed} />
                    ) : (
                        <span className="text-xs text-(--text-tertiary)">No estimated stories yet.</span>
                    )}
                </Card>
            </div>

            <Card title="Scope, capacity and progress">
                <div className="overflow-x-auto">
                    <table className="exportable w-full min-w-[640px] border-collapse text-sm" data-export-sheet-name="Scope and progress">
                        <thead>
                            <tr className="bg-(--bg-secondary) text-left text-xs text-(--text-secondary)">
                                <th className="px-2 py-1.5">{terms.team}</th>
                                <th className="px-2 py-1.5">{terms.iteration}</th>
                                <th className="px-2 py-1.5 text-right">Stories</th>
                                <th className="px-2 py-1.5 text-right">Planned</th>
                                <th className="px-2 py-1.5 text-right">Capacity</th>
                                <th className="px-2 py-1.5">Utilisation</th>
                                <th className="px-2 py-1.5 text-right">Done</th>
                            </tr>
                        </thead>
                        <tbody>
                            {model.rows.flatMap((row) =>
                                [...row.columns, { id: unplannedIterationId, name: 'Not in a sprint' }].map((column, index) => {
                                    const cells = row.cells[column.id] || [];
                                    const storyKeys = cells.flatMap((c) => c.storyKeys);
                                    const done = storyKeys
                                        .map((k) => data.stories[k])
                                        .filter((s) => s?.statusCategory === 'done')
                                        .reduce((sum, s) => sum + (row.unit === 'hours' ? getIssueHours(s) : getIssuePoints(s, 'points')), 0);
                                    const planned = cells.reduce((sum, c) => sum + c.estimate, 0);
                                    const load = row.loads[column.id];
                                    const unit = row.unit === 'hours' ? 'h' : 'pts';
                                    const utilisation = load && load.capacity > 0 ? Math.round((planned * 100) / load.capacity) : null;
                                    return (
                                        <tr key={`${row.team.boardId}-${column.id}`} className={classNames('border-t border-(--border-secondary)', { 'border-t-(--border-primary)': index === 0 })}>
                                            <td className="px-2 py-1 font-medium">{index === 0 ? row.team.name : ''}</td>
                                            <td className="px-2 py-1">{column.name}</td>
                                            <td className="px-2 py-1 text-right">{storyKeys.length}</td>
                                            <td className="px-2 py-1 text-right">
                                                {formatNumber(planned)} {unit}
                                            </td>
                                            <td className="px-2 py-1 text-right">{load ? `${formatNumber(load.capacity)} ${unit}` : '–'}</td>
                                            <td className="px-2 py-1">
                                                {utilisation === null ? (
                                                    '–'
                                                ) : (
                                                    <div className="flex min-w-28 items-center gap-2">
                                                        <ProgressBar
                                                            value={Math.min(100, utilisation)}
                                                            size="sm"
                                                            variant={utilisation > 100 ? 'danger' : utilisation >= 85 ? 'warning' : 'success'}
                                                            ariaLabel={`Utilisation ${utilisation}%`}
                                                            className="flex-1"
                                                        />
                                                        <span className={classNames('w-10 text-right text-xs', { 'font-semibold text-red-600 dark:text-red-400': utilisation > 100 })}>{utilisation}%</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-2 py-1 text-right">{planned > 0 ? `${Math.round((done * 100) / planned)}%` : '–'}</td>
                                        </tr>
                                    );
                                }),
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <Card title={terms.objectives}>
                    <div className="overflow-x-auto">
                        <table className="exportable w-full border-collapse text-sm" data-export-sheet-name={`${terms.objectives} summary`}>
                            <thead>
                                <tr className="text-left text-xs text-(--text-secondary)">
                                    <th className="px-2 py-1">{terms.team}</th>
                                    <th className="px-2 py-1 text-right">{terms.committed}</th>
                                    <th className="px-2 py-1 text-right">On track</th>
                                    <th className="px-2 py-1 text-right">At risk</th>
                                    <th className="px-2 py-1 text-right">{terms.plannedValue}</th>
                                    <th className="px-2 py-1 text-right">{terms.actualValue}</th>
                                    <th className="px-2 py-1 text-right">Predictability</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[{ id: null as number | null, name: terms.program }, ...doc.teams.map((t) => ({ id: t.boardId as number | null, name: t.name }))].map((g) => {
                                    const list = objectives.filter((o) => o.objective.teamBoardId === g.id);
                                    const committedList = list.filter((o) => o.objective.committed);
                                    const value = getPredictability(list.map((o) => o.objective));
                                    const atRisk = list.filter((o) => o.health === 'atRisk' || o.health === 'missed').length;
                                    return (
                                        <tr key={g.name} className="border-t border-(--border-secondary)">
                                            <td className="px-2 py-1">{g.name}</td>
                                            <td className="px-2 py-1 text-right">{committedList.length}</td>
                                            <td className="px-2 py-1 text-right">{list.filter((o) => o.health === 'achieved' || o.health === 'onTrack').length}</td>
                                            <td className={classNames('px-2 py-1 text-right', { 'font-semibold text-amber-700 dark:text-amber-300': atRisk > 0 })}>{atRisk}</td>
                                            <td className="px-2 py-1 text-right">{formatNumber(committedList.reduce((s, o) => s + (o.objective.plannedValue || 0), 0))}</td>
                                            <td className="px-2 py-1 text-right">{formatNumber(committedList.reduce((s, o) => s + (o.objective.actualValue || 0), 0))}</td>
                                            <td className="px-2 py-1 text-right">{value === null ? '–' : `${value}%`}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card title={terms.risks}>
                    <div className="flex flex-col gap-1.5">
                        {roamOrder.map((status) => {
                            const count = risks.filter((r) => r.risk.roam === status).length;
                            return (
                                <div key={status} className="flex items-center gap-2 text-sm">
                                    <span className="w-24 shrink-0">{terms.roam[status]}</span>
                                    <ProgressBar value={risks.length ? (count * 100) / risks.length : 0} size="sm" variant={status === 'open' ? 'danger' : status === 'owned' ? 'warning' : 'success'} className="flex-1" ariaLabel={terms.roam[status]} />
                                    <span className="w-6 text-right font-semibold">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                    <table className="exportable hidden" data-export-sheet-name={`${terms.risks} summary`}>
                        <tbody>
                            {roamOrder.map((status) => (
                                <tr key={status}>
                                    <td>{terms.roam[status]}</td>
                                    <td>{risks.filter((r) => r.risk.roam === status).length}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </div>
    );
}
