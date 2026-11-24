import { useState } from 'react';

import { Button, Modal, TextArea, TextInput } from '@components';

import BoardPicker from '../../../shared/components/BoardPicker';
import Field from '../../../shared/components/Field';
import type { PlannerBoard } from '../../../shared/types';
import { createArtId, removeArt, saveArtDefinition } from '../../art-actions';
import { usePiStore } from '../../pi-store';
import type { PiArt, PiTeamRef } from '../../pi-types';
import { articleTerm, lowerTerm, type TermSet } from '../../terminology';

interface ArtDialogProps {
    art: PiArt | null;
    terms: TermSet;
    onHide: () => void;
    onSaved: (art: PiArt) => void;
    onDeleted: () => void;
}

/** Creates or edits an ART: its name, purpose and the teams (boards) that every new plan of the ART starts with. */
export default function ArtDialog({ art, terms, onHide, onSaved, onDeleted }: ArtDialogProps) {
    const plans = usePiStore((s) => s.plans);
    const [name, setName] = useState(art?.name || '');
    const [description, setDescription] = useState(art?.description || '');
    const [teams, setTeams] = useState<PiTeamRef[]>(art?.teams || []);
    const [isSaving, setIsSaving] = useState(false);
    const planCount = art ? plans.filter((p) => p.artId === art.id).length : 0;

    const save = async () => {
        setIsSaving(true);
        const saved = await saveArtDefinition({
            id: art?.id || createArtId(),
            name: name.trim(),
            description: description.trim(),
            teams,
            version: art?.version || 0,
            created: art?.created || '',
            createdBy: art?.createdBy || null,
            updated: art?.updated || '',
            updatedBy: art?.updatedBy || null,
        });
        setIsSaving(false);
        if (saved) {
            onSaved(saved);
        }
    };

    const remove = async () => {
        if (art && (await removeArt(art))) {
            onDeleted();
        }
    };

    const footer = (
        <div className="flex flex-wrap items-center justify-end gap-2">
            {art && (
                <Button
                    label="Delete"
                    layout="plain"
                    variant="danger"
                    className="me-auto"
                    disabled={planCount > 0}
                    title={planCount ? `Delete or move its ${planCount} ${lowerTerm(terms.plans)} first` : undefined}
                    confirmText={`Delete ${art.name}?`}
                    onClick={remove}
                />
            )}
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Save" isLoading={isSaving} disabled={isSaving || !name.trim() || !teams.length} onClick={save} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={art ? `Edit ${lowerTerm(terms.program)}` : `New ${lowerTerm(terms.program)}`} size="md" footer={footer}>
            <div className="flex flex-col gap-4">
                <Field label="Name">
                    <TextInput value={name} onChange={(e) => setName(e.value)} maxLength={80} autoFocus placeholder="Digital Commerce" />
                </Field>
                <Field label="Purpose" hint="Optional. What the teams deliver together.">
                    <TextArea value={description} onChange={(e) => setDescription(e.value)} rows={2} maxLength={2000} />
                </Field>
                <Field label={terms.teams} hint={`Each ${lowerTerm(terms.team)} is a scrum board. New ${lowerTerm(terms.plans)} of this ${lowerTerm(terms.program)} start with these ${lowerTerm(terms.teams)}; ${articleTerm(terms.plan)} can still leave one out.`}>
                    <BoardPicker
                        multiple
                        scrumOnly
                        value={teams.map((t) => t.boardId)}
                        onChange={(boards: PlannerBoard[]) => setTeams(boards.map((b) => teams.find((t) => t.boardId === b.id) || { boardId: b.id, name: b.name }))}
                        placeholder="Choose the boards of the teams"
                    />
                </Field>
            </div>
        </Modal>
    );
}
