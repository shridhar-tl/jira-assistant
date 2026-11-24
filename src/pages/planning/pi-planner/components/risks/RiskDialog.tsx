import { useState } from 'react';

import { DateTimePicker } from '@/controls';

import { inject } from '@services';


import { Button, Dropdown, Modal, TextArea, TextInput } from '@components';

import Field from '../../../shared/components/Field';
import UserPicker from '../../../shared/components/UserPicker';
import { getJiraErrorMessage } from '../../../shared/jira-api';
import { parseDateKey, toDateKey } from '../../../shared/segments';
import type { PlannerUser } from '../../../shared/types';
import { createItemId, syncRiskToJira, updatePlan } from '../../pi-actions';
import { getCurrentUserRef } from '../../pi-item-actions';
import type { IssueLookup } from '../../pi-progress';
import type { PiDocument, PiRisk, PiTeamRef, RoamStatus } from '../../pi-types';
import { articleTerm, lowerTerm, type TermSet } from '../../terminology';
import IssueKeysField from '../common/IssueKeysField';
import TeamSelect from '../common/TeamSelect';

import { roamOrder } from './risk-styles';

interface RiskDialogProps {
    risk: PiRisk | null;
    doc: PiDocument;
    terms: TermSet;
    people: PlannerUser[];
    issues: IssueLookup;
    onHide: () => void;
}

const programValue = 'program';

/**
 * Raises or edits a risk of the plan. A risk can be raised on another team, even of another ART, which then has to accept it.
 * The date it has to be resolved by drives the overdue highlighting.
 */
export default function RiskDialog({ risk, doc, terms, people, issues, onHide }: RiskDialogProps) {
    const [title, setTitle] = useState(risk?.title || '');
    const [description, setDescription] = useState(risk?.description || '');
    const [impact, setImpact] = useState(risk?.impact || '');
    const [owner, setOwner] = useState<PlannerUser | null>(risk?.ownerId ? { id: risk.ownerId, displayName: risk.ownerName } : null);
    const [team, setTeam] = useState(risk?.teamBoardId ? String(risk.teamBoardId) : programValue);
    const [targetTeam, setTargetTeam] = useState<PiTeamRef | null>(risk?.targetTeam || null);
    const [resolveBy, setResolveBy] = useState<Date | null>(risk?.resolveBy ? parseDateKey(risk.resolveBy) : null);
    const [roam, setRoam] = useState<RoamStatus>(risk?.roam || 'open');
    const [issueKeys, setIssueKeys] = useState<string[]>(risk?.issueKeys || []);
    const [isSaving, setIsSaving] = useState(false);
    const fromDependency = !!risk?.dependencyId;

    const save = async () => {
        setIsSaving(true);
        try {
            const targetChanged = (targetTeam?.boardId ?? null) !== (risk?.targetTeam?.boardId ?? null);
            const next = await syncRiskToJira(
                {
                    id: risk?.id || createItemId('r'),
                    title: title.trim(),
                    description,
                    impact: impact.trim(),
                    ownerId: owner?.id || null,
                    ownerName: owner?.displayName || '',
                    teamBoardId: team === programValue ? null : Number(team),
                    targetTeam,
                    resolveBy: resolveBy ? toDateKey(resolveBy) : null,
                    acceptance: targetTeam ? (targetChanged || !risk?.acceptance ? { status: 'pending', by: null, at: null, note: '' } : risk.acceptance) : null,
                    dependencyId: risk?.dependencyId ?? null,
                    issueKeys,
                    roam,
                    raisedBy: risk?.raisedBy || getCurrentUserRef(),
                    raisedAt: risk?.raisedAt || new Date().toISOString(),
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
            $message.error(getJiraErrorMessage(err), `Unable to save the ${lowerTerm(terms.risk)}`);
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
        <Modal isOpen onClose={onHide} title={risk ? `Edit ${lowerTerm(terms.risk)}` : `Raise ${articleTerm(terms.risk)}`} size="lg" footer={footer}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fromDependency && (
                    <div className="rounded-md bg-(--bg-secondary) px-3 py-2 text-xs text-(--text-secondary) sm:col-span-2">
                        Raised from a dependency. Its teams and date follow the dependency, so change them there.
                    </div>
                )}
                <Field label="Title" className="sm:col-span-2">
                    <TextInput value={title} onChange={(e) => setTitle(e.value)} autoFocus maxLength={200} disabled={fromDependency} />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                    <TextArea value={description} onChange={(e) => setDescription(e.value)} rows={2} maxLength={4000} />
                </Field>
                <Field label="What goes wrong if it happens" className="sm:col-span-2" hint="The impact on the plan, for example a missed objective or a release that slips.">
                    <TextArea value={impact} onChange={(e) => setImpact(e.value)} rows={2} maxLength={2000} />
                </Field>
                <Field label={`Raised by (${lowerTerm(terms.team)})`}>
                    <Dropdown
                        options={[{ label: terms.program, value: programValue }, ...doc.teams.map((t) => ({ label: t.name, value: String(t.boardId) }))]}
                        value={team}
                        disabled={fromDependency}
                        onChange={(e) => setTeam(e.value as string)}
                    />
                </Field>
                <Field label={`Raised on (${lowerTerm(terms.team)})`} hint="The team that has to act on it. It sees the request and accepts or declines it.">
                    {fromDependency ? (
                        <TextInput value={targetTeam?.name || ''} disabled />
                    ) : (
                        <TeamSelect doc={doc} value={targetTeam} onChange={setTargetTeam} terms={terms} placeholder="Nobody else" clearable />
                    )}
                </Field>
                <Field label="Resolve by">
                    <DateTimePicker value={resolveBy ?? undefined} onChange={setResolveBy} onClear={() => setResolveBy(null)} disabled={fromDependency} placeholder="No date" />
                </Field>
                <Field label="Owner">
                    <UserPicker value={owner} onChange={setOwner} suggestions={people} allowUnassigned />
                </Field>
                <Field label="Status">
                    <Dropdown options={roamOrder.map((r) => ({ label: terms.roam[r], value: r }))} value={roam} onChange={(e) => setRoam(e.value as RoamStatus)} />
                </Field>
                <div />
                <Field group label="Linked issues" className="sm:col-span-2">
                    <IssueKeysField value={issueKeys} onChange={setIssueKeys} issues={issues} />
                </Field>
            </div>
        </Modal>
    );
}
