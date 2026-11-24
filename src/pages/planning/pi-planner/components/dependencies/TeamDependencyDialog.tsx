import { useState } from 'react';

import { startOfDay } from 'date-fns';

import { DateTimePicker } from '@/controls';

import { Button, Dropdown, InputSwitch, Modal, TextArea, TextInput } from '@components';

import Field from '../../../shared/components/Field';
import { parseDateKey, toDateKey } from '../../../shared/segments';
import { createItemId } from '../../pi-actions';
import { getCurrentUserRef, saveTeamDependency, setDependencyRisk } from '../../pi-item-actions';
import type { IssueLookup } from '../../pi-progress';
import { usePiStore } from '../../pi-store';
import type { PiDocument, PiTeamDependency, PiTeamRef } from '../../pi-types';
import { lowerTerm, type TermSet } from '../../terminology';
import IssueKeysField from '../common/IssueKeysField';
import TeamSelect from '../common/TeamSelect';

/** A dependency being raised or edited. A draft without an id is new, for example one pre-filled from an issue link. */
export interface DependencyDraft extends Omit<PiTeamDependency, 'toTeam'> {
    toTeam: PiTeamRef | null;
}

interface TeamDependencyDialogProps {
    dependency: DependencyDraft | null;
    doc: PiDocument;
    terms: TermSet;
    issues: IssueLookup;
    onHide: () => void;
}

function getDefaultNeededBy(doc: PiDocument): Date {
    const today = toDateKey(startOfDay(new Date()));
    const next = doc.iterations.find((it) => it.endDate >= today && !it.isIp);
    return parseDateKey(next?.endDate || doc.endDate);
}

/**
 * Raises a dependency of a team of the plan on another team, with or without Jira issues. The other team can be in this plan,
 * in another ART, or any board. The needing team tags the stories that wait for it; the providing team answers it.
 */
export default function TeamDependencyDialog({ dependency, doc, terms, issues, onHide }: TeamDependencyDialogProps) {
    const isNew = !dependency?.id;
    const existingRisk = dependency?.id ? doc.risks.find((r) => r.dependencyId === dependency.id) : undefined;
    const isSaving = usePiStore((s) => s.isSaving);
    const [title, setTitle] = useState(dependency?.title || '');
    const [description, setDescription] = useState(dependency?.description || '');
    const [fromBoardId, setFromBoardId] = useState<number | null>(dependency?.fromBoardId ?? doc.teams[0]?.boardId ?? null);
    const [toTeam, setToTeam] = useState<PiTeamRef | null>(dependency?.toTeam || null);
    const [neededBy, setNeededBy] = useState<Date>(dependency?.neededBy ? parseDateKey(dependency.neededBy) : getDefaultNeededBy(doc));
    const [dependantKeys, setDependantKeys] = useState<string[]>(dependency?.dependantKeys || []);
    const [isRisk, setIsRisk] = useState(!!existingRisk);
    const [impact, setImpact] = useState(existingRisk?.impact || '');
    const previousTeam = dependency?.id ? dependency.toTeam : null;
    const dropsAnswer = !!previousTeam && !!toTeam && toTeam.boardId !== previousTeam.boardId && !!dependency && (dependency.status !== 'requested' || !!dependency.respondedBy);

    const save = async () => {
        if (!fromBoardId || !toTeam) {
            return;
        }
        const next: PiTeamDependency = {
            id: dependency?.id || createItemId('d'),
            title: title.trim(),
            description: description.trim(),
            fromBoardId,
            toTeam,
            neededBy: toDateKey(neededBy),
            status: dependency?.status || 'requested',
            committedDate: dependency?.committedDate ?? null,
            responseNote: dependency?.responseNote || '',
            dependantKeys,
            providerKeys: dependency?.providerKeys || [],
            raisedBy: dependency?.raisedBy || getCurrentUserRef(),
            raisedAt: dependency?.raisedAt || new Date().toISOString(),
            respondedBy: dependency?.respondedBy ?? null,
            respondedAt: dependency?.respondedAt ?? null,
        };
        if (!(await saveTeamDependency(next))) {
            return;
        }
        if (isRisk !== !!existingRisk || (isRisk && impact.trim() !== existingRisk?.impact)) {
            await setDependencyRisk(next, isRisk ? impact.trim() : null);
        }
        onHide();
    };

    const footer = (
        <div className="flex justify-end gap-2">
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Save" isLoading={isSaving} disabled={isSaving || !title.trim() || !fromBoardId || !toTeam || toTeam.boardId === fromBoardId || (isRisk && !impact.trim())} onClick={save} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={isNew ? 'Raise a dependency' : 'Edit dependency'} size="lg" footer={footer}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="What is needed" className="sm:col-span-2">
                    <TextInput value={title} onChange={(e) => setTitle(e.value)} maxLength={200} autoFocus placeholder="Payment API for gift cards in the sandbox" />
                </Field>
                <Field label="Details" className="sm:col-span-2" hint="Optional. Scope, contacts or acceptance criteria.">
                    <TextArea value={description} onChange={(e) => setDescription(e.value)} rows={2} maxLength={2000} />
                </Field>
                <Field label={`Needed by (${lowerTerm(terms.team)})`}>
                    <Dropdown options={doc.teams.map((t) => ({ label: t.name, value: t.boardId }))} value={fromBoardId ?? undefined} onChange={(e) => setFromBoardId(e.value as number)} />
                </Field>
                <Field label={`Delivered by (${lowerTerm(terms.team)})`} hint={
                        dropsAnswer
                            ? `${previousTeam?.name} already answered it. Saving with another ${lowerTerm(terms.team)} clears that answer and asks the new ${lowerTerm(terms.team)} again.`
                            : `A team of another ${lowerTerm(terms.program)} makes it a cross-${terms.program === 'ART' ? 'ART' : 'program'} dependency.`
                    }>
                    <TeamSelect doc={doc} value={toTeam} onChange={setToTeam} terms={terms} excludeBoardId={fromBoardId} />
                </Field>
                <Field label="Needed by date">
                    <DateTimePicker value={neededBy} onChange={setNeededBy} />
                </Field>
                <div />
                <Field group label="Stories waiting for it" className="sm:col-span-2" hint="Stories of the needing team that are blocked until the dependency is delivered.">
                    <IssueKeysField value={dependantKeys} onChange={setDependantKeys} issues={issues} emptyText="None tagged yet." />
                </Field>
                <div className="flex flex-col gap-2 rounded-lg border border-(--border-primary) p-3 sm:col-span-2">
                    <InputSwitch label={`Also raise it as a ${lowerTerm(terms.risk)}`} checked={isRisk} onChange={(e) => setIsRisk(e.value)} />
                    {isRisk && (
                        <Field label="What goes wrong if it is late" hint={`The ${lowerTerm(terms.risk)} is raised on the delivering team with the same date and shows on the ${lowerTerm(terms.risks)} view.`}>
                            <TextArea value={impact} onChange={(e) => setImpact(e.value)} rows={2} maxLength={2000} placeholder="Gift cards cannot launch with the holiday release" />
                        </Field>
                    )}
                </div>
            </div>
        </Modal>
    );
}
