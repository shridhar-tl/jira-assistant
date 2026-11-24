import { useMemo, useState } from 'react';

import { inject } from '@services';

import { Button, EmptyState, SelectButton, TextInput } from '@components';

import DependencyTable from '../../shared/components/DependencyTable';
import Field from '../../shared/components/Field';
import type { Dependency } from '../../shared/dependencies';
import { deleteIssueLink, getJiraErrorMessage } from '../../shared/jira-api';
import { toDateKey } from '../../shared/segments';
import { addDependency, loadExternalIssues, reloadPlanData, type ExternalIssue } from '../pi-actions';
import { buildDependencyEntries, buildTeamPairs, isAwaitingAnswer, type DependencyEntry, type TeamPairCount } from '../pi-dependency-model';
import { removeTeamDependency } from '../pi-item-actions';
import type { PiData } from '../pi-loader';
import { applyExternalPlacements, getPlanSprintRanges, type ProgramModel } from '../pi-model';
import { dependencyHealthLabels, dependencyStatusLabels } from '../pi-progress';
import { usePiStore } from '../pi-store';
import type { PiDocument } from '../pi-types';
import { lowerTerm, type TermSet } from '../terminology';
import usePlanIssues from '../usePlanIssues';

import ViewToolbar from './common/ViewToolbar';
import DependencyCard from './dependencies/DependencyCard';
import DependencyResponseDialog from './dependencies/DependencyResponseDialog';
import TeamDependencyDialog, { type DependencyDraft } from './dependencies/TeamDependencyDialog';
import TeamMatrix from './dependencies/TeamMatrix';

interface PiDependenciesViewProps {
    doc: PiDocument;
    data: PiData;
    model: ProgramModel;
    terms: TermSet;
    canEdit: boolean;
}

type Relation = 'blockedBy' | 'blocks';
type Tab = 'teams' | 'links';
type Scope = 'all' | 'ours' | 'askedOfUs' | 'attention';

const relationItems = [
    { label: 'Is blocked by', value: 'blockedBy' },
    { label: 'Blocks', value: 'blocks' },
];
const keyPattern = /^[A-Z][A-Z0-9_]+-\d+$/;
const attentionHealth = new Set<DependencyEntry['health']>(['late', 'atRisk', 'declined']);

function normalizeKey(value: string): string {
    return value.trim().toUpperCase();
}

function needsAttention(entry: DependencyEntry): boolean {
    return attentionHealth.has(entry.health) || (entry.isProvidedHere && isAwaitingAnswer(entry));
}

function matchesScope(entry: DependencyEntry, scope: Scope): boolean {
    switch (scope) {
        case 'ours':
            return entry.isOwn;
        case 'askedOfUs':
            return entry.isProvidedHere;
        case 'attention':
            return needsAttention(entry);
        default:
            return true;
    }
}

export default function PiDependenciesView({ doc, data, model, terms, canEdit }: PiDependenciesViewProps) {
    const incoming = usePiStore((s) => s.incoming);
    const arts = usePiStore((s) => s.arts);
    const { issues, sprintEnds } = usePlanIssues(doc, data);
    const [tab, setTab] = useState<Tab>('teams');
    const [scope, setScope] = useState<Scope>('all');
    const [pair, setPair] = useState<TeamPairCount | null>(null);
    const [editing, setEditing] = useState<DependencyDraft | null | undefined>(undefined);
    const [responding, setResponding] = useState<DependencyEntry | null>(null);
    const [external, setExternal] = useState<Record<string, ExternalIssue>>({});
    const [isChecking, setIsChecking] = useState(false);
    const [issueKey, setIssueKey] = useState('');
    const [otherKey, setOtherKey] = useState('');
    const [relation, setRelation] = useState<Relation>('blockedBy');
    const [isSaving, setIsSaving] = useState(false);

    const entries = useMemo(() => buildDependencyEntries(doc, incoming, arts, issues, sprintEnds), [doc, incoming, arts, issues, sprintEnds]);

    const teamNames = useMemo(() => new Map(doc.teams.map((t) => [t.boardId, t.name])), [doc.teams]);
    const teamName = (boardId: number | null | undefined) => (boardId ? teamNames.get(boardId) || null : null);
    const teamOfKey = (key: string) => teamName(model.storyTeam.get(key));

    const outsideKeys = useMemo(
        () => [...new Set(model.dependencies.flatMap((d) => [d.blockerKey, d.dependantKey]).filter((key) => !data.stories[key] && !data.features[key]))],
        [model.dependencies, data.stories, data.features],
    );

    const dependencies = useMemo(
        () => (Object.keys(external).length ? applyExternalPlacements(model.dependencies, data, getPlanSprintRanges(doc, data), external) : model.dependencies),
        [model.dependencies, data, doc, external],
    );

    const pairs = useMemo(
        () =>
            buildTeamPairs(entries, model.dependencies, (key) => {
                const boardId = model.storyTeam.get(key);
                return boardId ? teamNames.get(boardId) || null : null;
            }),
        [entries, model.dependencies, model.storyTeam, teamNames],
    );

    const visible = entries.filter((e) => matchesScope(e, scope) && (!pair || pair.manual.includes(e)));
    const pairLinks = pair ? new Set(pair.links.map((l) => l.id)) : null;
    const visibleLinks = pairLinks ? dependencies.filter((d) => pairLinks.has(d.id)) : dependencies;

    const openCount = entries.filter((e) => e.health !== 'delivered' && e.health !== 'declined').length;
    const attentionCount = entries.filter(needsAttention).length;
    const crossArtCount = entries.filter((e) => e.crossArt).length;
    const toAnswer = entries.filter((e) => e.isProvidedHere && isAwaitingAnswer(e)).length;
    const scopeItems = [
        { label: `All (${entries.length})`, value: 'all' },
        { label: 'Raised by us', value: 'ours' },
        { label: 'Asked of us', value: 'askedOfUs' },
        { label: `Needs attention (${attentionCount})`, value: 'attention' },
    ];

    const sprintName = (sprintId: number | null) =>
        sprintId ? Object.values(data.teams).flatMap((t) => t.sprints).find((s) => s.id === sprintId)?.name || 'Sprint' : 'Not in a sprint';

    const locationOf = (key: string) => {
        const issue = data.stories[key] || data.features[key];
        if (issue) {
            return sprintName(issue.currentSprintId);
        }
        const info = external[key];
        if (!info) {
            return `Outside this ${lowerTerm(terms.plan)}`;
        }
        const sprint = info.sprint?.name || 'Not in a sprint';
        return info.planName ? `${sprint} · ${info.planName}` : `${sprint} · no ${lowerTerm(terms.plan)}`;
    };

    const checkOtherPlans = async () => {
        setIsChecking(true);
        try {
            setExternal(await loadExternalIssues(outsideKeys));
        } catch (err) {
            const { $message } = inject('MessageService');
            $message.error(getJiraErrorMessage(err), 'Unable to read the issues outside the plan');
        } finally {
            setIsChecking(false);
        }
    };

    const removeLink = async (dep: Dependency) => {
        try {
            await deleteIssueLink(dep.linkId);
            await reloadPlanData(false);
        } catch (err) {
            const { $message } = inject('MessageService');
            $message.error(getJiraErrorMessage(err), 'Unable to remove the dependency');
        }
    };

    const isTracked = (link: Dependency) => doc.dependencies.some((d) => d.dependantKeys.includes(link.dependantKey) && d.providerKeys.includes(link.blockerKey));

    const raiseFromLink = (link: Dependency) => {
        const fromBoardId = model.storyTeam.get(link.dependantKey) ?? null;
        const toBoardId = model.storyTeam.get(link.blockerKey) ?? null;
        const dependant = issues[link.dependantKey];
        const end = dependant?.currentSprintId ? sprintEnds.get(dependant.currentSprintId) : undefined;
        setEditing({
            id: '',
            title: issues[link.blockerKey]?.summary || external[link.blockerKey]?.summary || link.blockerKey,
            description: '',
            fromBoardId: fromBoardId || doc.teams[0]?.boardId || 0,
            toTeam: toBoardId ? { boardId: toBoardId, name: teamName(toBoardId) || '' } : null,
            neededBy: end ? toDateKey(end) : null,
            status: 'requested',
            committedDate: null,
            responseNote: '',
            dependantKeys: [link.dependantKey],
            providerKeys: [link.blockerKey],
            raisedBy: null,
            raisedAt: null,
            respondedBy: null,
            respondedAt: null,
        });
    };

    const first = normalizeKey(issueKey);
    const second = normalizeKey(otherKey);
    const canAdd = keyPattern.test(first) && keyPattern.test(second) && first !== second && !isSaving;

    const add = async () => {
        setIsSaving(true);
        const ok = relation === 'blockedBy' ? await addDependency(second, first) : await addDependency(first, second);
        setIsSaving(false);
        if (ok) {
            setIssueKey('');
            setOtherKey('');
        }
    };

    return (
        <div className="flex flex-col gap-4 p-3">
            <div className="flex flex-wrap items-center gap-2">
                <SelectButton
                    items={[
                        { label: `${terms.team} dependencies (${entries.length})`, value: 'teams' },
                        { label: `Issue links (${model.dependencies.length})`, value: 'links' },
                    ]}
                    value={tab}
                    onChange={(e) => setTab(e.value as Tab)}
                    ariaLabel="Dependency view"
                />
                {pair && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-(--bg-secondary) py-0.5 pe-1 ps-2.5 text-xs">
                        {pair.fromName} → {pair.toName}
                        <Button size="xs" layout="plain" leftIcon={<i className="fa fa-times" />} ariaLabel="Clear team filter" onClick={() => setPair(null)} />
                    </span>
                )}
            </div>

            <TeamMatrix pairs={pairs} selected={pair} onSelect={setPair} />

            {tab === 'teams' ? (
                <>
                    <ViewToolbar
                        actions={
                            <>
                                <SelectButton items={scopeItems} value={scope} onChange={(e) => setScope(e.value as Scope)} ariaLabel="Show dependencies" />
                                {canEdit && doc.teams.length > 0 && <Button size="sm" label="Raise dependency" leftIcon={<i className="fa fa-plus" />} onClick={() => setEditing(null)} />}
                            </>
                        }
                    >
                        <span>{openCount} open</span>
                        {attentionCount > 0 && <span className="font-semibold text-amber-700 dark:text-amber-300">{attentionCount} need attention</span>}
                        {toAnswer > 0 && <span className="font-semibold text-(--primary-color)">{toAnswer} waiting for our answer</span>}
                        {crossArtCount > 0 && <span>{crossArtCount} cross-{terms.program === 'ART' ? 'ART' : lowerTerm(terms.program)}</span>}
                    </ViewToolbar>
                    {visible.length ? (
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                            {visible.map((entry) => (
                                <DependencyCard
                                    key={`${entry.piId}-${entry.dependency.id}`}
                                    entry={entry}
                                    terms={terms}
                                    issues={issues}
                                    canEdit={canEdit}
                                    onEdit={(e) => setEditing(e.dependency)}
                                    onRemove={(e) => removeTeamDependency(e.dependency.id)}
                                    onRespond={setResponding}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            size="sm"
                            title={entries.length ? 'Nothing matches this filter' : 'No team dependencies yet'}
                            description={
                                entries.length
                                    ? 'Choose another filter or clear the team filter.'
                                    : `Raise what one ${lowerTerm(terms.team)} needs from another, even before there is a Jira issue for it. Issue links between ${lowerTerm(terms.teams)} can be raised as team dependencies from the issue links tab.`
                            }
                            action={canEdit && !entries.length && doc.teams.length > 0 ? { label: 'Raise dependency', onClick: () => setEditing(null) } : undefined}
                        />
                    )}
                    <table className="exportable hidden" data-export-sheet-name={`${terms.team} dependencies`}>
                        <thead>
                            <tr>
                                <th>What is needed</th>
                                <th>Needed by</th>
                                <th>Delivered by</th>
                                <th>Needed by date</th>
                                <th>Answer</th>
                                <th>Committed date</th>
                                <th>Health</th>
                                <th>{terms.plan}</th>
                                <th>Stories waiting for it</th>
                                <th>Stories delivering it</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(({ dependency, piId, piName, fromTeamName, health }) => (
                                <tr key={`${piId}-${dependency.id}`}>
                                    <td>{dependency.title}</td>
                                    <td>{fromTeamName}</td>
                                    <td>{dependency.toTeam.name}</td>
                                    <td>{dependency.neededBy || ''}</td>
                                    <td>{dependencyStatusLabels[dependency.status]}</td>
                                    <td>{dependency.committedDate || ''}</td>
                                    <td>{dependencyHealthLabels[health]}</td>
                                    <td>{piName}</td>
                                    <td>{dependency.dependantKeys.join(', ')}</td>
                                    <td>{dependency.providerKeys.join(', ')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            ) : (
                <>
                    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-(--border-primary) p-3">
                        {canEdit && (
                            <>
                                <Field label="Issue" className="w-36">
                                    <TextInput value={issueKey} onChange={(e) => setIssueKey(e.value)} placeholder="ABC-123" />
                                </Field>
                                <SelectButton items={relationItems} value={relation} onChange={(e) => setRelation(e.value as Relation)} />
                                <Field label="Other issue (any program)" className="w-44">
                                    <TextInput value={otherKey} onChange={(e) => setOtherKey(e.value)} placeholder="XYZ-456" />
                                </Field>
                                <Button label="Add dependency" leftIcon={<i className="fa fa-link" />} disabled={!canAdd} isLoading={isSaving} onClick={add} />
                            </>
                        )}
                        <span className="flex-1" />
                        <Button
                            layout="outlined"
                            label={`Check other ${lowerTerm(terms.plans)} (${outsideKeys.length})`}
                            leftIcon={<i className="fa fa-sitemap" />}
                            title={`Find the sprint and the ${lowerTerm(terms.plan)} of the issues outside this ${lowerTerm(terms.plan)} and compare their dates`}
                            disabled={!outsideKeys.length}
                            isLoading={isChecking}
                            onClick={checkOtherPlans}
                        />
                    </div>
                    <DependencyTable
                        dependencies={visibleLinks}
                        issues={issues}
                        locationOf={locationOf}
                        teamOf={(key) => teamOfKey(key) || ''}
                        summaryOf={(key) => external[key]?.summary}
                        canRemove={canEdit}
                        onRemove={removeLink}
                        renderActions={(link) =>
                            canEdit &&
                            !link.blockerDone &&
                            model.storyTeam.get(link.dependantKey) &&
                            teamOfKey(link.dependantKey) !== teamOfKey(link.blockerKey) &&
                            !isTracked(link) && (
                                <Button
                                    size="xs"
                                    layout="plain"
                                    leftIcon={<i className="fa fa-users" />}
                                    ariaLabel="Raise as a team dependency"
                                    title="Raise as a team dependency so the other team can commit to a date"
                                    onClick={() => raiseFromLink(link)}
                                />
                            )
                        }
                    />
                </>
            )}

            {editing !== undefined && <TeamDependencyDialog dependency={editing} doc={doc} terms={terms} issues={issues} onHide={() => setEditing(undefined)} />}
            {responding && <DependencyResponseDialog entry={responding} issues={issues} onHide={() => setResponding(null)} />}
        </div>
    );
}
