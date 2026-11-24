import { useMemo } from 'react';

import classNames from 'classnames';

import { GadgetAlert } from '@/gadgets/shared';

import { AvatarGroup, BlockLoading, Button, Dropdown, EmptyState, ProgressBar } from '@components';

import { reloadPlanData } from '../../pi-actions';
import { buildDependencyEntries, buildTeamPairs, isAwaitingAnswer, type DependencyEntry } from '../../pi-dependency-model';
import type { PiData } from '../../pi-loader';
import type { ProgramModel } from '../../pi-model';
import { getElapsedPercent } from '../../pi-progress';
import { buildRiskEntries, type RiskEntry } from '../../pi-risk-model';
import { usePiStore } from '../../pi-store';
import { getObjectiveStatuses, getPlanHighlights, getTeamProgress, type HighlightView, type ObjectiveStatus, type TeamProgress } from '../../pi-summary-model';
import type { PiArt, PiDocument, PiSummary } from '../../pi-types';
import { lowerTerm, type TermSet } from '../../terminology';
import usePlanIssues from '../../usePlanIssues';
import HealthBadge from '../common/HealthBadge';
import TeamMatrix from '../dependencies/TeamMatrix';
import HighlightsPanel from '../summary/HighlightsPanel';

import ArtPlanTimeline from './ArtPlanTimeline';

interface ArtSummaryViewProps {
    art: PiArt | null;
    plans: PiSummary[];
    selectedPlanId: string | null;
    model: ProgramModel | null;
    terms: TermSet;
    onSelectPlan: (id: string) => void;
    onOpenPlan: (id: string, view?: HighlightView | 'summary') => void;
}

interface TeamHealth {
    progress: TeamProgress;
    needs: DependencyEntry[];
    asked: DependencyEntry[];
    risks: RiskEntry[];
    objectives: ObjectiveStatus[];
    confidence: number | null;
}

const blockedHealth = new Set<DependencyEntry['health']>(['late', 'atRisk', 'declined']);

function isOpen(entry: DependencyEntry): boolean {
    return entry.health !== 'delivered' && entry.health !== 'declined';
}

function getTeamHealth(doc: PiDocument, teams: TeamProgress[], dependencies: DependencyEntry[], risks: RiskEntry[], objectives: ObjectiveStatus[]): TeamHealth[] {
    return teams.map((progress) => {
        const votes = doc.votes.filter((v) => v.teamBoardId === progress.boardId);
        const latestDate = votes.reduce((max, v) => (v.date > max ? v.date : max), '');
        const latest = votes.filter((v) => v.date === latestDate);
        return {
            progress,
            needs: dependencies.filter((d) => d.isOwn && d.dependency.fromBoardId === progress.boardId && isOpen(d)),
            asked: dependencies.filter((d) => d.dependency.toTeam.boardId === progress.boardId && isOpen(d)),
            risks: risks.filter((r) => r.due !== 'closed' && ((r.isOwn && r.risk.teamBoardId === progress.boardId) || r.risk.targetTeam?.boardId === progress.boardId)),
            objectives: objectives.filter((o) => o.objective.teamBoardId === progress.boardId && o.objective.committed),
            confidence: latest.length ? Math.round((latest.reduce((s, v) => s + v.vote, 0) / latest.length) * 10) / 10 : null,
        };
    });
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: 'danger' | 'warning' | 'good' }) {
    return (
        <div className="flex flex-col">
            <span
                className={classNames('text-base font-semibold', {
                    'text-red-600 dark:text-red-400': tone === 'danger',
                    'text-amber-600 dark:text-amber-400': tone === 'warning',
                    'text-emerald-600 dark:text-emerald-400': tone === 'good',
                })}
            >
                {value}
            </span>
            <span className="text-[11px] text-(--text-tertiary)">{label}</span>
        </div>
    );
}

function TeamCard({ health, elapsed, terms }: { health: TeamHealth; elapsed: number; terms: TermSet }) {
    const { progress, needs, asked, risks, objectives, confidence } = health;
    const blocked = needs.filter((d) => blockedHealth.has(d.health));
    const unanswered = asked.filter(isAwaitingAnswer);
    const overdue = risks.filter((r) => r.due === 'overdue');
    const objectivesOk = objectives.filter((o) => o.health === 'achieved' || o.health === 'onTrack').length;
    const pace = progress.total > 0 ? progress.percent - elapsed : 0;
    const variant = progress.total === 0 ? 'default' : pace >= 0 ? 'success' : pace >= -20 ? 'warning' : 'danger';

    return (
        <article className="flex flex-col gap-3 rounded-lg border border-(--border-primary) bg-(--bg-primary) p-3 shadow-sm" data-team-board={progress.boardId}>
            <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-semibold" title={progress.name}>
                    {progress.name}
                </span>
                {blocked.length > 0 ? <HealthBadge health="atRisk" /> : progress.total > 0 && pace >= 0 ? <HealthBadge health="onTrack" /> : null}
            </div>
            <div className="flex flex-col gap-0.5">
                <div className="relative">
                    <ProgressBar value={progress.percent} size="sm" variant={variant} ariaLabel={`${progress.name} progress`} />
                    {elapsed > 0 && elapsed < 100 && <span className="absolute -top-0.5 h-[calc(100%+4px)] w-0.5 rounded bg-(--text-secondary)" style={{ left: `${elapsed}%` }} title={`${elapsed}% of the time gone`} />}
                </div>
                <div className="flex justify-between text-[11px] text-(--text-secondary)">
                    <span>{progress.percent}% done</span>
                    <span>{progress.storyCount} stories</span>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <Metric label="Blocked by others" value={blocked.length} tone={blocked.length ? 'danger' : undefined} />
                <Metric label="Asked of us" value={unanswered.length ? `${asked.length} (${unanswered.length} new)` : asked.length} tone={unanswered.length ? 'warning' : undefined} />
                <Metric label={`Open ${lowerTerm(terms.risks)}`} value={overdue.length ? `${risks.length} (${overdue.length} late)` : risks.length} tone={overdue.length ? 'danger' : undefined} />
                <Metric label={`${terms.objectives} on track`} value={objectives.length ? `${objectivesOk}/${objectives.length}` : '–'} tone={objectives.length ? (objectivesOk === objectives.length ? 'good' : 'warning') : undefined} />
                <Metric label="Carried over" value={progress.carryOver.length} tone={progress.carryOver.length ? 'warning' : undefined} />
                <Metric label={terms.confidence} value={confidence === null ? '–' : `${confidence}/5`} tone={confidence === null ? undefined : confidence >= 3 ? 'good' : 'warning'} />
            </div>
            {blocked.length > 0 && (
                <ul className="flex flex-col gap-1 border-t border-(--border-secondary) pt-2 text-xs">
                    {blocked.slice(0, 3).map((d) => (
                        <li key={d.dependency.id} className="flex items-center gap-1.5">
                            <HealthBadge health={d.health} />
                            <span className="min-w-0 flex-1 truncate" title={d.dependency.title}>
                                {d.dependency.title}
                            </span>
                            <span className="shrink-0 text-(--text-tertiary)">{d.dependency.toTeam.name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}

function ArtPlanSummary({ doc, data, model, terms, onOpenPlan }: { doc: PiDocument; data: PiData; model: ProgramModel; terms: TermSet; onOpenPlan: ArtSummaryViewProps['onOpenPlan'] }) {
    const incoming = usePiStore((s) => s.incoming);
    const arts = usePiStore((s) => s.arts);
    const { issues, sprintEnds } = usePlanIssues(doc, data);
    const elapsed = getElapsedPercent(doc);
    const teams = useMemo(() => getTeamProgress(doc, data, model), [doc, data, model]);
    const dependencies = useMemo(() => buildDependencyEntries(doc, incoming, arts, issues, sprintEnds), [doc, incoming, arts, issues, sprintEnds]);
    const risks = useMemo(() => buildRiskEntries(doc, incoming, terms.program), [doc, incoming, terms.program]);
    const objectives = useMemo(() => getObjectiveStatuses(doc, issues, sprintEnds), [doc, issues, sprintEnds]);
    const linkConflicts = model.dependencies.filter((d) => d.conflict !== 'none' && !d.blockerDone).length;
    const highlights = useMemo(() => getPlanHighlights(doc, teams, objectives, dependencies, risks, linkConflicts, terms), [doc, teams, objectives, dependencies, risks, linkConflicts, terms]);
    const health = useMemo(() => getTeamHealth(doc, teams, dependencies, risks, objectives), [doc, teams, dependencies, risks, objectives]);
    const teamNames = useMemo(() => new Map(doc.teams.map((t) => [t.boardId, t.name])), [doc.teams]);
    const pairs = useMemo(
        () =>
            buildTeamPairs(dependencies, model.dependencies, (key) => {
                const boardId = model.storyTeam.get(key);
                return boardId ? teamNames.get(boardId) || null : null;
            }),
        [dependencies, model.dependencies, model.storyTeam, teamNames],
    );
    const crossArt = dependencies.filter((d) => d.crossArt && isOpen(d));

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {health.map((h) => (
                    <TeamCard key={h.progress.boardId} health={h} elapsed={elapsed} terms={terms} />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <HighlightsPanel title="Needs attention" tone="attention" items={highlights.attention} emptyText="Nothing needs attention right now." onNavigate={(view) => onOpenPlan(doc.id, view)} />
                <HighlightsPanel title="Going well" tone="good" items={highlights.good} emptyText="Nothing to call out yet." onNavigate={(view) => onOpenPlan(doc.id, view)} />
            </div>
            {crossArt.length > 0 && (
                <section className="flex flex-col gap-2 rounded-lg border border-(--border-primary) p-3">
                    <h3 className="text-sm font-semibold">Open cross-{terms.program === 'ART' ? 'ART' : lowerTerm(terms.program)} dependencies</h3>
                    <ul className="flex flex-col divide-y divide-(--border-secondary) text-sm">
                        {crossArt.map((d) => (
                            <li key={`${d.piId}-${d.dependency.id}`} className="flex flex-wrap items-center gap-2 py-1.5">
                                <HealthBadge health={d.health} />
                                <span className="min-w-0 flex-1 truncate">{d.dependency.title}</span>
                                <span className="text-xs text-(--text-secondary)">
                                    {d.fromTeamName}
                                    {d.fromArtName ? ` (${d.fromArtName})` : ''} → {d.dependency.toTeam.name}
                                    {d.toArtName ? ` (${d.toArtName})` : ''}
                                </span>
                                <span className="text-xs text-(--text-tertiary)">by {d.dependency.neededBy || '–'}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            <TeamMatrix pairs={pairs} selected={null} onSelect={() => onOpenPlan(doc.id, 'dependencies')} />
        </div>
    );
}

/** How an ART is doing: its plans on a time line and, for the plan in progress, each team's progress, blockers and risks. */
export default function ArtSummaryView({ art, plans, selectedPlanId, model, terms, onSelectPlan, onOpenPlan }: ArtSummaryViewProps) {
    const doc = usePiStore((s) => s.doc);
    const data = usePiStore((s) => s.data);
    const settings = usePiStore((s) => s.settings);
    const error = usePiStore((s) => s.error);
    const isReady = !!doc && doc.id === selectedPlanId && !!data && !!model && !!settings;

    if (!plans.length) {
        return (
            <EmptyState
                size="sm"
                title={`No ${lowerTerm(terms.plans)} yet`}
                description={`The summary shows how the ${lowerTerm(terms.teams)} of ${art ? art.name : `this ${lowerTerm(terms.program)}`} are doing once a ${lowerTerm(terms.plan)} exists.`}
            />
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 flex-1 flex-col">
                    <h2 className="text-lg font-semibold">{art ? art.name : `${terms.plans} without ${lowerTerm(terms.program)}`}</h2>
                    {art?.description && <span className="text-sm text-(--text-secondary)">{art.description}</span>}
                </div>
                {art && art.teams.length > 0 && <AvatarGroup items={art.teams.map((t) => ({ name: t.name }))} max={6} size="sm" />}
                <Dropdown
                    className="w-56 max-w-full"
                    options={[...plans].sort((a, b) => b.startDate.localeCompare(a.startDate)).map((p) => ({ label: p.name, value: p.id }))}
                    value={selectedPlanId ?? undefined}
                    ariaLabel={`${terms.plan} to summarise`}
                    onChange={(e) => onSelectPlan(e.value as string)}
                />
            </div>
            <ArtPlanTimeline plans={plans} selectedId={selectedPlanId} onSelect={onSelectPlan} />
            {error ? (
                <GadgetAlert action={<Button label="Retry" size="sm" layout="outlined" onClick={() => reloadPlanData()} />}>{error}</GadgetAlert>
            ) : isReady && doc && data && model ? (
                <ArtPlanSummary doc={doc} data={data} model={model} terms={terms} onOpenPlan={onOpenPlan} />
            ) : (
                <BlockLoading />
            )}
        </div>
    );
}
