import { useState } from 'react';

import { Button, Dropdown, Modal, SelectButton, TextArea } from '@components';

import Field from '../../../shared/components/Field';
import UserPicker from '../../../shared/components/UserPicker';
import type { PlannerUser } from '../../../shared/types';
import { respondToRisk } from '../../pi-item-actions';
import type { RiskEntry } from '../../pi-risk-model';
import type { AcceptanceStatus, RoamStatus } from '../../pi-types';
import { lowerTerm, type TermSet } from '../../terminology';

import { roamOrder } from './risk-styles';

interface RiskResponseDialogProps {
    entry: RiskEntry;
    terms: TermSet;
    people: PlannerUser[];
    onHide: () => void;
}

const acceptanceItems: Array<{ label: string; value: AcceptanceStatus }> = [
    { label: 'Accept', value: 'accepted' },
    { label: 'Decline', value: 'declined' },
    { label: 'Undecided', value: 'pending' },
];

/** The team a risk is raised on accepts it, names an owner and moves it on the ROAM board, or declines it with a reason. */
export default function RiskResponseDialog({ entry, terms, people, onHide }: RiskResponseDialogProps) {
    const { risk } = entry;
    const [acceptance, setAcceptance] = useState<AcceptanceStatus>(risk.acceptance?.status === 'pending' || !risk.acceptance ? 'accepted' : risk.acceptance.status);
    const [note, setNote] = useState(risk.acceptance?.note || '');
    const [roam, setRoam] = useState<RoamStatus>(risk.roam === 'open' ? 'owned' : risk.roam);
    const [owner, setOwner] = useState<PlannerUser | null>(risk.ownerId ? { id: risk.ownerId, displayName: risk.ownerName } : null);
    const [isSaving, setIsSaving] = useState(false);

    const save = async () => {
        setIsSaving(true);
        const ok = await respondToRisk(entry.piId, risk.id, {
            acceptance,
            note: note.trim(),
            roam: acceptance === 'accepted' ? roam : risk.roam,
            ownerId: acceptance === 'accepted' ? owner?.id || null : risk.ownerId,
            ownerName: acceptance === 'accepted' ? owner?.displayName || '' : risk.ownerName,
        });
        setIsSaving(false);
        if (ok) {
            onHide();
        }
    };

    const footer = (
        <div className="flex justify-end gap-2">
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Save answer" isLoading={isSaving} disabled={isSaving || (acceptance === 'declined' && !note.trim())} onClick={save} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={`Answer the ${lowerTerm(terms.risk)}`} size="md" footer={footer}>
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 rounded-lg bg-(--bg-secondary) px-3 py-2 text-sm">
                    <span className="font-semibold">{risk.title}</span>
                    <span className="text-xs text-(--text-secondary)">
                        Raised by {entry.fromTeamName} on {risk.targetTeam?.name}
                        {risk.resolveBy ? `, to be resolved by ${risk.resolveBy}` : ''} · {entry.piName}
                    </span>
                    {risk.impact && (
                        <span className="text-xs">
                            <span className="font-semibold">If it happens: </span>
                            {risk.impact}
                        </span>
                    )}
                </div>
                <Field label="Answer" group>
                    <SelectButton items={acceptanceItems} value={acceptance} onChange={(e) => setAcceptance(e.value as AcceptanceStatus)} />
                </Field>
                {acceptance === 'accepted' && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Owner">
                            <UserPicker value={owner} onChange={setOwner} suggestions={people} allowUnassigned />
                        </Field>
                        <Field label="Status">
                            <Dropdown options={roamOrder.map((r) => ({ label: terms.roam[r], value: r }))} value={roam} onChange={(e) => setRoam(e.value as RoamStatus)} />
                        </Field>
                    </div>
                )}
                <Field label={acceptance === 'declined' ? 'Why it is declined' : 'Note'}>
                    <TextArea value={note} onChange={(e) => setNote(e.value)} rows={2} maxLength={2000} />
                </Field>
            </div>
        </Modal>
    );
}
