import { useState } from 'react';

import { Button, Modal, NumericInput } from '@components';

import Field from '../../../shared/components/Field';
import type { PlannerSprint } from '../../../shared/types';

interface CapacityOverrideDialogProps {
    sprint: PlannerSprint;
    value: number;
    onSave: (percent: number) => Promise<void>;
    onHide: () => void;
}

/** Team-wide capacity for one sprint, for example 50% during a training week (CP-7). */
export default function CapacityOverrideDialog({ sprint, value, onSave, onHide }: CapacityOverrideDialogProps) {
    const [percent, setPercent] = useState<number | undefined>(value);
    const [isSaving, setIsSaving] = useState(false);

    const save = async () => {
        setIsSaving(true);
        await onSave(Math.max(0, Math.min(200, percent ?? 100)));
        setIsSaving(false);
    };

    const footer = (
        <div className="flex justify-end gap-2">
            <Button label="Reset to 100%" layout="plain" className="me-auto" onClick={() => setPercent(100)} />
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Save" isLoading={isSaving} disabled={isSaving} onClick={save} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={`Capacity of ${sprint.name}`} size="sm" footer={footer}>
            <Field label="Team capacity for this sprint (%)" hint="Applies to every member on top of their own availability and the focus factor.">
                <NumericInput value={percent} onChange={(e) => setPercent(e.value)} min={0} max={200} step={5} />
            </Field>
        </Modal>
    );
}
