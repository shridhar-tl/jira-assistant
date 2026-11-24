import { useMemo, useState } from 'react';

import classNames from 'classnames';

import { inject } from '@services';

import { Button, Dropdown, InputSwitch, Modal, NumericInput, TextArea } from '@components';

import Field from '../../shared/components/Field';
import { formatNumber } from '../../shared/format';
import { getJiraErrorMessage } from '../../shared/jira-api';
import { createItemId, syncObjectiveToJira, updatePlan } from '../pi-actions';
import type { PiData } from '../pi-loader';
import { formatMeasure, getElapsedPercent, getIssueProgress, getObjectiveHealth, getPredictability, objectiveHealthLabels, type IssueLookup, type IssueProgress, type ObjectiveHealth } from '../pi-progress';
import { usePiStore } from '../pi-store';
import type { PiDocument, PiObjective } from '../pi-types';
import { lowerTerm, type TermSet } from '../terminology';
import usePlanIssues from '../usePlanIssues';

import HealthBadge from './common/HealthBadge';
import IssueKeysField from './common/IssueKeysField';
import IssueLink from './common/IssueLink';
import ProgressMeter from './common/ProgressMeter';
import StatusPill from './common/StatusPill';
import ViewToolbar from './common/ViewToolbar';

interface ObjectivesViewProps {
    doc: PiDocument;
    data: PiData;
    terms: TermSet;
    canEdit: boolean;
}

interface ObjectiveRow {
    objective: PiObjective;
    progress: IssueProgress;
    health: ObjectiveHealth;
}

const programValue = 'program';
const healthOrder: ObjectiveHealth[] = ['achieved', 'onTrack', 'atRisk', 'missed', 'untracked'];

interface ObjectiveDialogProps {
    objective: PiObjective | null;
    doc: PiDocument;
    terms: TermSet;
    issues: IssueLookup;
    progress: IssueProgress | null;
    onHide: () => void;
}

function ObjectiveDialog({ objective, doc, terms, issues, progress, onHide }: ObjectiveDialogProps) {
    const [text, setText] = useState(objective?.text || '');
    const [team, setTeam] = useState(objective?.teamBoardId ? String(objective.teamBoardId) : programValue);
    const [committed, setCommitted] = useState(objective?.committed ?? true);
    const [planned, setPlanned] = useState<number | undefined>(objective?.plannedValue ?? undefined);
    const [actual, setActual] = useState<number | undefined>(objective?.actualValue ?? undefined);
    const [issueKeys, setIssueKeys] = useState<string[]>(objective?.issueKeys || []);
    const [isSaving, setIsSaving] = useState(false);
    const suggestedActual = planned && progress?.issueCount ? Math.round((planned * progress.percent) / 10) / 10 : null;

    const save = async () => {
        setIsSaving(true);
        try {
            const next = await syncObjectiveToJira({
                id: objective?.id || createItemId('o'),
                teamBoardId: team === programValue ? null : Number(team),
                text: text.trim(),
                committed,
                plannedValue: planned ?? null,
                actualValue: actual ?? null,
                issueKeys,
                jiraKey: objective?.jiraKey,
            });
            const objectives = objective ? doc.objectives.map((o) => (o.id === next.id ? next : o)) : [...doc.objectives, next];
            if (await updatePlan({ objectives })) {
                onHide();
            }
        } catch (err) {
            const { $message } = inject('MessageService');
            $message.error(getJiraErrorMessage(err), `Unable to save the ${lowerTerm(terms.objective)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const footer = (
        <div className="flex justify-end gap-2">
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Save" isLoading={isSaving} disabled={isSaving || !text.trim()} onClick={save} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={objective ? `Edit ${lowerTerm(terms.objective)}` : `New ${lowerTerm(terms.objective)}`} size="lg" footer={footer}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={terms.objective} className="sm:col-span-2">
                    <TextArea value={text} onChange={(e) => setText(e.value)} rows={3} autoFocus />
                </Field>
                <Field label={terms.team}>
                    <Dropdown options={[{ label: terms.program, value: programValue }, ...doc.teams.map((t) => ({ label: t.name, value: String(t.boardId) }))]} value={team} onChange={(e) => setTeam(e.value as string)} />
                </Field>
                <div className="flex items-end pb-1.5">
                    <InputSwitch label={terms.committed} checked={committed} onChange={(e) => setCommitted(e.value)} />
                </div>
                <Field label={`${terms.plannedValue} (1–10)`}>
                    <NumericInput value={planned} min={1} max={10} onChange={(e) => setPlanned(e.value)} />
                </Field>
                <Field label={`${terms.actualValue} (0–10)`} hint={suggestedActual !== null ? `Filled in at the end of the plan. The linked work suggests ${formatNumber(suggestedActual)}.` : 'Filled in at the end of the plan.'}>
                    <NumericInput value={actual} min={0} max={10} onChange={(e) => setActual(e.value)} />
                </Field>
                <Field
                    label="Linked work"
                    className="sm:col-span-2"
                    hint={`The progress of the objective comes from these issues. An epic counts its stories in the sprints of this ${lowerTerm(terms.plan)}, weighted by story points or estimates.`}
                >
                    <IssueKeysField value={issueKeys} onChange={setIssueKeys} issues={issues} emptyText="No issues linked yet." />
                </Field>
            </div>
        </Modal>
    );
}

function LinkedWork({ progress, sprintName }: { progress: IssueProgress; sprintName: (id: number | null) => string }) {
    return (
        <ul className="flex flex-col divide-y divide-(--border-secondary) rounded-md border border-(--border-secondary) bg-(--bg-secondary)">
            {progress.issues.map((issue) => (
                <li key={issue.key} className="flex flex-wrap items-center gap-2 px-2 py-1 text-xs">
                    <IssueLink issueKey={issue.key} issue={issue} />
                    <span className="min-w-0 flex-1 truncate text-(--text-secondary)">{issue.summary}</span>
                    <span className="text-(--text-tertiary)">{issue.statusCategory === 'done' ? '' : sprintName(issue.currentSprintId)}</span>
                    <StatusPill status={issue.status} category={issue.statusCategory} />
                </li>
            ))}
            {progress.missingKeys.map((key) => (
                <li key={key} className="px-2 py-1 text-xs text-(--text-tertiary)">
                    {key} could not be read. It may have been deleted or you may not have access to it.
                </li>
            ))}
        </ul>
    );
}

/** Objectives per team and for the program with planned and actual value, progress of the linked work and predictability (PI-6). */
export default function ObjectivesView({ doc, data, terms, canEdit }: ObjectivesViewProps) {
    const isSaving = usePiStore((s) => s.isSaving);
    const { issues, sprintEnds, scope } = usePlanIssues(doc, data);
    const [editing, setEditing] = useState<PiObjective | 'new' | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const predictability = getPredictability(doc.objectives);
    const elapsed = getElapsedPercent(doc);
    const groups = [{ id: null as number | null, name: terms.program }, ...doc.teams.map((t) => ({ id: t.boardId as number | null, name: t.name }))];

    const rows = useMemo(
        () =>
            new Map<string, ObjectiveRow>(
                doc.objectives.map((objective) => {
                    const progress = getIssueProgress(objective.issueKeys, issues, sprintEnds, scope);
                    return [objective.id, { objective, progress, health: getObjectiveHealth(progress, doc) }];
                }),
            ),
        [doc, issues, sprintEnds, scope],
    );
    const healthCounts = healthOrder.map((health) => ({ health, count: [...rows.values()].filter((r) => r.health === health).length })).filter((h) => h.count > 0);

    const sprintName = (sprintId: number | null) =>
        sprintId ? Object.values(data.teams).flatMap((t) => t.sprints).find((s) => s.id === sprintId)?.name || 'Sprint of another board' : 'Not in a sprint';
    const remove = (id: string) => updatePlan({ objectives: doc.objectives.filter((o) => o.id !== id) });
    const toggle = (id: string) =>
        setExpanded((current) => {
            const next = new Set(current);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    const teamName = (id: number | null) => groups.find((g) => g.id === id)?.name || '';
    const editingRow = editing && editing !== 'new' ? rows.get(editing.id) : undefined;

    return (
        <div className="flex flex-col gap-4 p-3">
            <ViewToolbar
                actions={
                    canEdit && <Button size="sm" label={`Add ${lowerTerm(terms.objective)}`} leftIcon={<i className="fa fa-plus" />} disabled={isSaving} onClick={() => setEditing('new')} />
                }
            >
                <span title={`${terms.actualValue} ÷ ${lowerTerm(terms.plannedValue)} of ${lowerTerm(terms.committed)} ${lowerTerm(terms.objectives)}`}>
                    Predictability <b className="text-(--text-primary)">{predictability === null ? '–' : `${predictability}%`}</b>
                </span>
                <span>
                    Time passed <b className="text-(--text-primary)">{elapsed}%</b>
                </span>
                <span className="flex flex-wrap gap-1.5">
                    {healthCounts.map(({ health, count }) => (
                        <span key={health} className="inline-flex items-center gap-1">
                            <HealthBadge health={health} />
                            <b className="text-(--text-primary)">{count}</b>
                        </span>
                    ))}
                </span>
            </ViewToolbar>

            {!doc.objectives.length && <div className="rounded-lg border border-dashed border-(--border-primary) p-6 text-center text-sm text-(--text-tertiary)">No {lowerTerm(terms.objectives)} yet.</div>}

            {groups.map((group) => {
                const list = doc.objectives.filter((o) => o.teamBoardId === group.id);
                if (!list.length) {
                    return null;
                }
                const value = getPredictability(list);
                return (
                    <section key={group.name} className="flex flex-col gap-2" aria-label={group.name}>
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                            {group.name}
                            <span className="text-xs font-normal text-(--text-secondary)">
                                {list.length} {lowerTerm(list.length === 1 ? terms.objective : terms.objectives)}
                                {value !== null && ` · predictability ${value}%`}
                            </span>
                        </h3>
                        <ul className="flex flex-col gap-2">
                            {list.map((objective) => {
                                const row = rows.get(objective.id)!;
                                const isOpen = expanded.has(objective.id);
                                return (
                                    <li key={objective.id} className="flex flex-col gap-2 rounded-lg border border-(--border-primary) bg-(--bg-primary) p-3 shadow-sm" data-objective-id={objective.id}>
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                                <span className="font-medium text-(--text-primary)">{objective.text}</span>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--text-secondary)">
                                                    <span className={classNames('rounded px-1.5 py-px font-medium', objective.committed ? 'bg-(--color-primary-100) text-(--color-primary-700)' : 'bg-(--bg-tertiary)')}>
                                                        {objective.committed ? terms.committed : terms.uncommitted}
                                                    </span>
                                                    <span>
                                                        {terms.plannedValue} <b className="text-(--text-primary)">{formatNumber(objective.plannedValue)}</b>
                                                    </span>
                                                    <span>
                                                        {terms.actualValue} <b className="text-(--text-primary)">{formatNumber(objective.actualValue)}</b>
                                                    </span>
                                                    {objective.jiraKey && <IssueLink issueKey={objective.jiraKey} issue={issues[objective.jiraKey]} />}
                                                    {row.progress.issueCount > 0 && (
                                                        <span>
                                                            {formatMeasure(row.progress.done, row.progress.measure)} of {formatMeasure(row.progress.total, row.progress.measure)} done
                                                        </span>
                                                    )}
                                                    {row.progress.outsidePlanCount > 0 && (
                                                        <span
                                                            className="inline-flex items-center gap-1"
                                                            title={`Open stories of the linked ${lowerTerm(terms.features)} that are not in a sprint of this ${lowerTerm(terms.plan)}. They are needed to finish the ${lowerTerm(terms.features)} but do not count in this ${lowerTerm(terms.plan)}.`}
                                                        >
                                                            <i className="fa fa-exclamation-triangle text-(--color-warning)" aria-hidden="true" />
                                                            {row.progress.outsidePlanCount} {row.progress.outsidePlanCount === 1 ? 'story' : 'stories'} outside this {lowerTerm(terms.plan)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 md:w-80">
                                                <div className="min-w-0 flex-1">
                                                    <ProgressMeter progress={row.progress} health={row.health} expectedPercent={elapsed} />
                                                </div>
                                                <HealthBadge health={row.health} />
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1 self-end md:self-auto">
                                                {(row.progress.issueCount > 0 || row.progress.missingKeys.length > 0) && (
                                                    <Button
                                                        size="xs"
                                                        layout="plain"
                                                        leftIcon={<i className={isOpen ? 'fa fa-chevron-up' : 'fa fa-chevron-down'} />}
                                                        label={`${row.progress.issueCount} issues`}
                                                        ariaLabel={isOpen ? 'Hide the linked work' : 'Show the linked work'}
                                                        onClick={() => toggle(objective.id)}
                                                    />
                                                )}
                                                {canEdit && (
                                                    <>
                                                        <Button size="xs" layout="plain" leftIcon={<i className="fa fa-pencil" />} ariaLabel="Edit" onClick={() => setEditing(objective)} />
                                                        <Button size="xs" layout="plain" variant="danger" leftIcon={<i className="fa fa-trash" />} ariaLabel="Delete" confirmText="Delete this entry from the plan?" onClick={() => remove(objective.id)} />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {isOpen && <LinkedWork progress={row.progress} sprintName={sprintName} />}
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                );
            })}

            <table className="exportable hidden" data-export-sheet-name={terms.objectives}>
                <thead>
                    <tr>
                        <th>{terms.team}</th>
                        <th>{terms.objective}</th>
                        <th>Type</th>
                        <th>{terms.plannedValue}</th>
                        <th>{terms.actualValue}</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th>Issues</th>
                        <th>Jira issue</th>
                    </tr>
                </thead>
                <tbody>
                    {doc.objectives.map((objective) => {
                        const row = rows.get(objective.id)!;
                        return (
                            <tr key={objective.id}>
                                <td>{teamName(objective.teamBoardId)}</td>
                                <td>{objective.text}</td>
                                <td>{objective.committed ? terms.committed : terms.uncommitted}</td>
                                <td>{objective.plannedValue ?? ''}</td>
                                <td>{objective.actualValue ?? ''}</td>
                                <td>{row.progress.issueCount ? `${row.progress.percent}%` : ''}</td>
                                <td>{objectiveHealthLabels[row.health]}</td>
                                <td>{objective.issueKeys.join(', ')}</td>
                                <td>{objective.jiraKey || ''}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {editing && (
                <ObjectiveDialog objective={editing === 'new' ? null : editing} doc={doc} terms={terms} issues={issues} progress={editingRow?.progress || null} onHide={() => setEditing(null)} />
            )}
        </div>
    );
}
