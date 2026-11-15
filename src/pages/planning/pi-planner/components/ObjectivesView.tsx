import { useState } from 'react';

import classNames from 'classnames';

import { inject } from '@services';

import { Button, Dropdown, InputSwitch, Modal, NumericInput, TextArea, TextInput } from '@components';

import Field from '../../shared/components/Field';
import { getJiraErrorMessage } from '../../shared/jira-api';
import { formatNumber } from '../../shared/format';
import { createItemId, syncObjectiveToJira, updatePlan } from '../pi-actions';
import { usePiStore } from '../pi-store';
import type { PiDocument, PiObjective } from '../pi-types';
import type { TermSet } from '../terminology';

interface ObjectivesViewProps {
    doc: PiDocument;
    terms: TermSet;
    canEdit: boolean;
}

const programValue = 'program';

export function getPredictability(objectives: PiObjective[]): number | null {
    const planned = objectives.filter((o) => o.committed).reduce((sum, o) => sum + (o.plannedValue || 0), 0);
    const actual = objectives.filter((o) => o.committed).reduce((sum, o) => sum + (o.actualValue || 0), 0);
    return planned > 0 ? Math.round((actual * 100) / planned) : null;
}

function ObjectiveDialog({ objective, doc, terms, onHide }: { objective: PiObjective | null; doc: PiDocument; terms: TermSet; onHide: () => void }) {
    const [text, setText] = useState(objective?.text || '');
    const [team, setTeam] = useState(objective?.teamBoardId ? String(objective.teamBoardId) : programValue);
    const [committed, setCommitted] = useState(objective?.committed ?? true);
    const [planned, setPlanned] = useState<number | undefined>(objective?.plannedValue ?? undefined);
    const [actual, setActual] = useState<number | undefined>(objective?.actualValue ?? undefined);
    const [issueKeys, setIssueKeys] = useState((objective?.issueKeys || []).join(', '));
    const [isSaving, setIsSaving] = useState(false);

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
                issueKeys: issueKeys
                    .split(/[\s,]+/)
                    .map((k) => k.trim().toUpperCase())
                    .filter(Boolean),
                jiraKey: objective?.jiraKey,
            });
            const objectives = objective ? doc.objectives.map((o) => (o.id === next.id ? next : o)) : [...doc.objectives, next];
            if (await updatePlan({ objectives })) {
                onHide();
            }
        } catch (err) {
            const { $message } = inject('MessageService');
            $message.error(getJiraErrorMessage(err), `Unable to save the ${terms.objective.toLowerCase()}`);
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
        <Modal isOpen onClose={onHide} title={objective ? `Edit ${terms.objective.toLowerCase()}` : `New ${terms.objective.toLowerCase()}`} size="md" footer={footer}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={terms.objective} className="sm:col-span-2">
                    <TextArea value={text} onChange={(e) => setText(e.value)} rows={3} autoFocus />
                </Field>
                <Field label={terms.team}>
                    <Dropdown options={[{ label: terms.program, value: programValue }, ...doc.teams.map((t) => ({ label: t.name, value: String(t.boardId) }))]} value={team} onChange={(e) => setTeam(e.value as string)} />
                </Field>
                <InputSwitch label={committed ? terms.committed : terms.uncommitted} checked={committed} onChange={(e) => setCommitted(e.value)} />
                <Field label={`${terms.plannedValue} (1–10)`}>
                    <NumericInput value={planned} min={1} max={10} onChange={(e) => setPlanned(e.value)} />
                </Field>
                <Field label={`${terms.actualValue} (0–10)`} hint="Filled in at the end of the plan.">
                    <NumericInput value={actual} min={0} max={10} onChange={(e) => setActual(e.value)} />
                </Field>
                <Field label="Linked issues" hint="Issue keys separated by commas." className="sm:col-span-2">
                    <TextInput value={issueKeys} onChange={(e) => setIssueKeys(e.value)} placeholder="ABC-12, ABC-40" />
                </Field>
            </div>
        </Modal>
    );
}

/** Objectives per team and for the program with planned and actual value, and program predictability (PI-6). */
export default function ObjectivesView({ doc, terms, canEdit }: ObjectivesViewProps) {
    const isSaving = usePiStore((s) => s.isSaving);
    const [editing, setEditing] = useState<PiObjective | 'new' | null>(null);
    const predictability = getPredictability(doc.objectives);
    const groups = [{ id: null as number | null, name: terms.program }, ...doc.teams.map((t) => ({ id: t.boardId as number | null, name: t.name }))];

    const remove = (id: string) => updatePlan({ objectives: doc.objectives.filter((o) => o.id !== id) });
    const issueUrl = (key: string) => inject('UserUtilsService').$userutils.getTicketUrl(key) || '';

    return (
        <div className="flex flex-col gap-4 p-3">
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-(--text-secondary)">
                    Predictability: <b className="text-(--text-primary)">{predictability === null ? '–' : `${predictability}%`}</b> ({terms.actualValue.toLowerCase()} ÷ {terms.plannedValue.toLowerCase()} of{' '}
                    {terms.committed.toLowerCase()} {terms.objectives.toLowerCase()})
                </span>
                <span className="flex-1" />
                {canEdit && <Button label={`Add ${terms.objective.toLowerCase()}`} leftIcon={<i className="fa fa-plus" />} disabled={isSaving} onClick={() => setEditing('new')} />}
            </div>
            <div className="overflow-x-auto">
                <table className="exportable w-full min-w-[640px] border-collapse text-sm" data-export-sheet-name={terms.objectives}>
                    <thead>
                        <tr className="bg-(--bg-secondary) text-left text-xs text-(--text-secondary)">
                            <th className="px-2 py-1.5">{terms.team}</th>
                            <th className="px-2 py-1.5">{terms.objective}</th>
                            <th className="px-2 py-1.5">Type</th>
                            <th className="px-2 py-1.5 text-right">{terms.plannedValue}</th>
                            <th className="px-2 py-1.5 text-right">{terms.actualValue}</th>
                            <th className="px-2 py-1.5">Issues</th>
                            <th className="px-2 py-1.5" data-export-ignore="true" />
                        </tr>
                    </thead>
                    <tbody>
                        {groups.flatMap((group) => {
                            const list = doc.objectives.filter((o) => o.teamBoardId === group.id);
                            return list.map((objective, index) => (
                                <tr key={objective.id} className="border-t border-(--border-secondary) align-top">
                                    <td className="px-2 py-1.5 font-medium">{index === 0 ? group.name : ''}</td>
                                    <td className="px-2 py-1.5">
                                        {objective.text}
                                        {objective.jiraKey && (
                                            <a href={issueUrl(objective.jiraKey)} target="_blank" rel="noreferrer" className="ms-2 cursor-pointer text-xs text-(--primary-color) hover:underline">
                                                {objective.jiraKey}
                                            </a>
                                        )}
                                    </td>
                                    <td className={classNames('px-2 py-1.5 text-xs', objective.committed ? 'text-(--text-primary)' : 'text-(--text-secondary)')}>
                                        {objective.committed ? terms.committed : terms.uncommitted}
                                    </td>
                                    <td className="px-2 py-1.5 text-right">{formatNumber(objective.plannedValue)}</td>
                                    <td className="px-2 py-1.5 text-right">{formatNumber(objective.actualValue)}</td>
                                    <td className="px-2 py-1.5 text-xs">
                                        {objective.issueKeys.map((key) => (
                                            <a key={key} href={issueUrl(key)} target="_blank" rel="noreferrer" className="me-1 cursor-pointer hover:underline">
                                                {key}
                                            </a>
                                        ))}
                                    </td>
                                    <td className="whitespace-nowrap px-2 py-1.5 text-right">
                                        {canEdit && (
                                            <>
                                                <Button size="xs" layout="plain" leftIcon={<i className="fa fa-pencil" />} ariaLabel="Edit" onClick={() => setEditing(objective)} />
                                                <Button size="xs" layout="plain" variant="danger" leftIcon={<i className="fa fa-trash" />} ariaLabel="Delete" confirmText="Delete this entry from the plan?" onClick={() => remove(objective.id)} />
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ));
                        })}
                        {!doc.objectives.length && (
                            <tr>
                                <td colSpan={7} className="px-2 py-6 text-center text-(--text-tertiary)">
                                    No {terms.objectives.toLowerCase()} yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {editing && <ObjectiveDialog objective={editing === 'new' ? null : editing} doc={doc} terms={terms} onHide={() => setEditing(null)} />}
        </div>
    );
}
