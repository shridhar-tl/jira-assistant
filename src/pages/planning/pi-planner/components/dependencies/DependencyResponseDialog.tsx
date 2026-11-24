import { useState } from 'react';

import { DateTimePicker } from '@/controls';

import { Button, Modal, SelectButton, TextArea } from '@components';

import Field from '../../../shared/components/Field';
import { parseDateKey, toDateKey } from '../../../shared/segments';
import type { DependencyEntry } from '../../pi-dependency-model';
import { respondToDependency } from '../../pi-item-actions';
import { dependencyStatusLabels, type IssueLookup } from '../../pi-progress';
import type { TeamDependencyStatus } from '../../pi-types';
import IssueKeysField from '../common/IssueKeysField';

interface DependencyResponseDialogProps {
    entry: DependencyEntry;
    issues: IssueLookup;
    onHide: () => void;
}

const statusItems = (Object.keys(dependencyStatusLabels) as TeamDependencyStatus[]).map((value) => ({ label: dependencyStatusLabels[value], value }));

/** The delivering team commits to a date, declines or marks the dependency delivered, and tags the stories that deliver it. */
export default function DependencyResponseDialog({ entry, issues, onHide }: DependencyResponseDialogProps) {
    const { dependency } = entry;
    const [status, setStatus] = useState<TeamDependencyStatus>(dependency.status === 'requested' ? 'committed' : dependency.status);
    const [committedDate, setCommittedDate] = useState<Date | null>(
        dependency.committedDate ? parseDateKey(dependency.committedDate) : dependency.neededBy ? parseDateKey(dependency.neededBy) : null,
    );
    const [note, setNote] = useState(dependency.responseNote);
    const [providerKeys, setProviderKeys] = useState<string[]>(dependency.providerKeys);
    const [isSaving, setIsSaving] = useState(false);

    const save = async () => {
        setIsSaving(true);
        const ok = await respondToDependency(entry.piId, dependency.id, {
            status,
            committedDate: status === 'committed' && committedDate ? toDateKey(committedDate) : status === 'delivered' ? dependency.committedDate : null,
            responseNote: note.trim(),
            providerKeys,
        });
        setIsSaving(false);
        if (ok) {
            onHide();
        }
    };

    const isLateCommit = status === 'committed' && !!committedDate && !!dependency.neededBy && toDateKey(committedDate) > dependency.neededBy;

    const footer = (
        <div className="flex justify-end gap-2">
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Save answer" isLoading={isSaving} disabled={isSaving || (status === 'committed' && !committedDate) || (status === 'declined' && !note.trim())} onClick={save} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title="Answer the dependency" size="lg" footer={footer}>
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5 rounded-lg bg-(--bg-secondary) px-3 py-2 text-sm">
                    <span className="font-semibold">{dependency.title}</span>
                    <span className="text-xs text-(--text-secondary)">
                        {entry.fromTeamName}
                        {entry.fromArtName ? ` (${entry.fromArtName})` : ''} needs it from {dependency.toTeam.name}
                        {dependency.neededBy ? ` by ${dependency.neededBy}` : ''} · {entry.piName}
                    </span>
                    {dependency.description && <span className="whitespace-pre-wrap text-xs text-(--text-secondary)">{dependency.description}</span>}
                </div>
                <Field label="Answer" group>
                    <SelectButton items={statusItems} value={status} onChange={(e) => setStatus(e.value as TeamDependencyStatus)} />
                </Field>
                {status === 'committed' && (
                    <Field label="Committed date" hint={isLateCommit ? 'This is after the date it is needed by, so the dependency shows as at risk.' : undefined}>
                        <DateTimePicker value={committedDate ?? undefined} onChange={setCommittedDate} />
                    </Field>
                )}
                <Field label={status === 'declined' ? 'Why it cannot be delivered' : 'Note'}>
                    <TextArea value={note} onChange={(e) => setNote(e.value)} rows={2} maxLength={2000} />
                </Field>
                <Field group label="Stories delivering it" hint="Progress of these stories shows how far the dependency is. When all of them are done it counts as delivered.">
                    <IssueKeysField value={providerKeys} onChange={setProviderKeys} issues={issues} emptyText="No stories tagged yet." />
                </Field>
            </div>
        </Modal>
    );
}
