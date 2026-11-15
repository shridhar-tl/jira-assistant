import { useState } from 'react';

import classNames from 'classnames';

import { inject } from '@services';

import { Button, Dropdown, Modal, TextArea, TextInput } from '@components';

import Field from '../../shared/components/Field';
import UserPicker from '../../shared/components/UserPicker';
import { getJiraErrorMessage } from '../../shared/jira-api';
import type { PlannerUser } from '../../shared/types';
import { createItemId, syncRiskToJira, updatePlan } from '../pi-actions';
import type { PiDocument, PiRisk, RoamStatus } from '../pi-types';
import type { TermSet } from '../terminology';

interface RisksViewProps {
    doc: PiDocument;
    terms: TermSet;
    canEdit: boolean;
    people: PlannerUser[];
}

const roamOrder: RoamStatus[] = ['open', 'owned', 'accepted', 'mitigated', 'resolved'];
const roamClassNames: Record<RoamStatus, string> = {
    open: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
    owned: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
    accepted: 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40',
    mitigated: 'border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/20',
    resolved: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20',
};
const programValue = 'program';

function RiskDialog({ risk, doc, terms, people, onHide }: { risk: PiRisk | null; doc: PiDocument; terms: TermSet; people: PlannerUser[]; onHide: () => void }) {
    const [title, setTitle] = useState(risk?.title || '');
    const [description, setDescription] = useState(risk?.description || '');
    const [owner, setOwner] = useState<PlannerUser | null>(risk?.ownerId ? { id: risk.ownerId, displayName: risk.ownerName } : null);
    const [team, setTeam] = useState(risk?.teamBoardId ? String(risk.teamBoardId) : programValue);
    const [roam, setRoam] = useState<RoamStatus>(risk?.roam || 'open');
    const [issueKeys, setIssueKeys] = useState((risk?.issueKeys || []).join(', '));
    const [isSaving, setIsSaving] = useState(false);

    const save = async () => {
        setIsSaving(true);
        try {
            const next = await syncRiskToJira(
                {
                    id: risk?.id || createItemId('r'),
                    title: title.trim(),
                    description,
                    ownerId: owner?.id || null,
                    ownerName: owner?.displayName || '',
                    teamBoardId: team === programValue ? null : Number(team),
                    issueKeys: issueKeys
                        .split(/[\s,]+/)
                        .map((k) => k.trim().toUpperCase())
                        .filter(Boolean),
                    roam,
                    jiraKey: risk?.jiraKey,
                },
                terms.roam[roam],
            );
            const risks = risk ? doc.risks.map((r) => (r.id === next.id ? next : r)) : [...doc.risks, next];
            if (await updatePlan({ risks })) {
                onHide();
            }
        } catch (err) {
            const { $message } = inject('MessageService');
            $message.error(getJiraErrorMessage(err), `Unable to save the ${terms.risk.toLowerCase()}`);
        } finally {
            setIsSaving(false);
        }
    };

    const footer = (
        <div className="flex justify-end gap-2">
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Save" isLoading={isSaving} disabled={isSaving || !title.trim()} onClick={save} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={risk ? `Edit ${terms.risk.toLowerCase()}` : `New ${terms.risk.toLowerCase()}`} size="md" footer={footer}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Title" className="sm:col-span-2">
                    <TextInput value={title} onChange={(e) => setTitle(e.value)} autoFocus maxLength={200} />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                    <TextArea value={description} onChange={(e) => setDescription(e.value)} rows={3} />
                </Field>
                <Field label="Owner">
                    <UserPicker value={owner} onChange={setOwner} suggestions={people} allowUnassigned />
                </Field>
                <Field label={terms.team}>
                    <Dropdown options={[{ label: terms.program, value: programValue }, ...doc.teams.map((t) => ({ label: t.name, value: String(t.boardId) }))]} value={team} onChange={(e) => setTeam(e.value as string)} />
                </Field>
                <Field label="Status">
                    <Dropdown options={roamOrder.map((r) => ({ label: terms.roam[r], value: r }))} value={roam} onChange={(e) => setRoam(e.value as RoamStatus)} />
                </Field>
                <Field label="Linked issues" hint="Issue keys separated by commas.">
                    <TextInput value={issueKeys} onChange={(e) => setIssueKeys(e.value)} />
                </Field>
            </div>
        </Modal>
    );
}

/** Risks with owner, linked issues and ROAM status as a board of status columns (PI-7). */
export default function RisksView({ doc, terms, canEdit, people }: RisksViewProps) {
    const [editing, setEditing] = useState<PiRisk | 'new' | null>(null);
    const teamName = (id: number | null) => (id ? doc.teams.find((t) => t.boardId === id)?.name || '' : terms.program);

    const setRoam = (risk: PiRisk, roam: RoamStatus) => updatePlan({ risks: doc.risks.map((r) => (r.id === risk.id ? { ...r, roam } : r)) });
    const remove = (id: string) => updatePlan({ risks: doc.risks.filter((r) => r.id !== id) });

    return (
        <div className="flex flex-col gap-3 p-3">
            <div className="flex items-center">
                <span className="text-sm text-(--text-secondary)">{doc.risks.filter((r) => r.roam === 'open').length} open</span>
                <span className="flex-1" />
                {canEdit && <Button label={`Add ${terms.risk.toLowerCase()}`} leftIcon={<i className="fa fa-plus" />} onClick={() => setEditing('new')} />}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
                {roamOrder.map((status) => (
                    <div key={status} className="flex flex-col gap-2">
                        <div className="text-sm font-semibold">
                            {terms.roam[status]} <span className="font-normal text-(--text-secondary)">({doc.risks.filter((r) => r.roam === status).length})</span>
                        </div>
                        {doc.risks
                            .filter((r) => r.roam === status)
                            .map((risk) => (
                                <div key={risk.id} className={classNames('flex flex-col gap-1 rounded border p-2 text-xs', roamClassNames[status])}>
                                    <div className="flex items-start gap-1">
                                        <span className="flex-1 text-sm font-medium">{risk.title}</span>
                                        {canEdit && <Button size="xs" layout="plain" leftIcon={<i className="fa fa-pencil" />} ariaLabel="Edit" onClick={() => setEditing(risk)} />}
                                    </div>
                                    {risk.description && <p className="text-(--text-secondary)">{risk.description}</p>}
                                    <div className="text-(--text-secondary)">
                                        {teamName(risk.teamBoardId)}
                                        {risk.ownerName && ` · ${risk.ownerName}`}
                                        {risk.jiraKey && ` · ${risk.jiraKey}`}
                                    </div>
                                    {canEdit && (
                                        <div className="flex items-center gap-1">
                                            <div className="flex-1">
                                                <Dropdown options={roamOrder.map((r) => ({ label: terms.roam[r], value: r }))} value={risk.roam} onChange={(e) => setRoam(risk, e.value as RoamStatus)} />
                                            </div>
                                            <Button size="xs" layout="plain" variant="danger" leftIcon={<i className="fa fa-trash" />} ariaLabel="Delete" confirmText="Delete this entry from the plan?" onClick={() => remove(risk.id)} />
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                ))}
            </div>
            <table className="exportable hidden" data-export-sheet-name={terms.risks}>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>{terms.team}</th>
                        <th>Owner</th>
                        <th>Issues</th>
                    </tr>
                </thead>
                <tbody>
                    {doc.risks.map((r) => (
                        <tr key={r.id}>
                            <td>{r.title}</td>
                            <td>{terms.roam[r.roam]}</td>
                            <td>{teamName(r.teamBoardId)}</td>
                            <td>{r.ownerName}</td>
                            <td>{[r.jiraKey, ...r.issueKeys].filter(Boolean).join(', ')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {editing && <RiskDialog risk={editing === 'new' ? null : editing} doc={doc} terms={terms} people={people} onHide={() => setEditing(null)} />}
        </div>
    );
}
