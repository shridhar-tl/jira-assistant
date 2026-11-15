import { useState } from 'react';

import { addDays, startOfDay } from 'date-fns';

import { DateTimePicker } from '@/controls';

import { Button, Modal, TextArea, TextInput } from '@components';

import Field from '../../../shared/components/Field';
import { getNextSprintName } from '../../../shared/forecast';
import type { PlannerSprint } from '../../../shared/types';
import { createSprint, editSprint, startSprint } from '../../actions';

export type SprintDialogMode = 'create' | 'edit' | 'start';

interface SprintDialogProps {
    mode: SprintDialogMode;
    sprint: PlannerSprint | null;
    lastSprint: PlannerSprint | null;
    boardName: string;
    defaultRange: { start: Date; end: Date } | null;
    onHide: () => void;
}

const titles: Record<SprintDialogMode, string> = { create: 'Create sprint', edit: 'Edit sprint', start: 'Start sprint' };
const defaultLengthDays = 14;

export default function SprintDialog({ mode, sprint, lastSprint, boardName, defaultRange, onHide }: SprintDialogProps) {
    const today = startOfDay(new Date());
    const [name, setName] = useState(sprint?.name || (mode === 'create' ? getNextSprintName(lastSprint?.name, 1, boardName) : ''));
    const [goal, setGoal] = useState(sprint?.goal || '');
    const [startDate, setStartDate] = useState<Date | null>(sprint?.startDate || defaultRange?.start || (mode === 'start' ? today : null));
    const [endDate, setEndDate] = useState<Date | null>(
        sprint?.endDate || defaultRange?.end || (mode === 'start' ? addDays(today, defaultLengthDays - 1) : null),
    );
    const [isSaving, setIsSaving] = useState(false);

    const datesInvalid = !!startDate && !!endDate && endDate < startDate;
    const missingDates = mode === 'start' && (!startDate || !endDate);
    const canSave = !!name.trim() && !datesInvalid && !missingDates && !isSaving;

    const save = async () => {
        setIsSaving(true);
        let ok: boolean;
        if (mode === 'create') {
            ok = !!(await createSprint({ name: name.trim(), goal, startDate, endDate }));
        } else if (mode === 'start' && sprint && startDate && endDate) {
            ok = await startSprint(sprint.id, startDate, endDate, goal);
        } else if (sprint) {
            ok = await editSprint(sprint.id, { name: name.trim(), goal, startDate, endDate });
        } else {
            ok = false;
        }
        setIsSaving(false);
        if (ok) {
            onHide();
        }
    };

    const footer = (
        <div className="flex items-center justify-end gap-2">
            {datesInvalid && <span className="me-auto text-xs text-red-600 dark:text-red-400">End date must be after the start date.</span>}
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label={mode === 'start' ? 'Start' : 'Save'} isLoading={isSaving} disabled={!canSave} onClick={save} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={titles[mode]} size="md" footer={footer}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Name" className="sm:col-span-2">
                    <TextInput value={name} onChange={(e) => setName(e.value)} maxLength={30} autoFocus />
                </Field>
                <Field label="Start date">
                    <DateTimePicker value={startDate || undefined} onChange={setStartDate} onClear={() => setStartDate(null)} />
                </Field>
                <Field label="End date">
                    <DateTimePicker value={endDate || undefined} onChange={setEndDate} onClear={() => setEndDate(null)} />
                </Field>
                <Field label="Goal" className="sm:col-span-2">
                    <TextArea value={goal} onChange={(e) => setGoal(e.value)} rows={3} />
                </Field>
            </div>
        </Modal>
    );
}
