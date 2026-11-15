import { useState } from 'react';

import { DateTimePicker } from '@/controls';

import { Button, Dropdown, InputSwitch, Modal, Multiselect, NumericInput, TextInput } from '@components';

import Field from '../../../shared/components/Field';
import { parseDateKey, toDateKey } from '../../../shared/segments';
import type { LeaveEntry, TeamMember } from '../../../shared/types';

export interface LeaveDefaults {
    start: string;
    end: string;
    memberId?: string | null;
}

interface LeaveDialogProps {
    entry: LeaveEntry | null;
    defaults?: LeaveDefaults;
    members: TeamMember[];
    onSave: (entry: LeaveEntry) => Promise<void>;
    onDelete?: (entry: LeaveEntry) => Promise<void>;
    onHide: () => void;
}

const holidayValue = '__holiday__';

function createId(): string {
    return `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function getInitialMember(entry: LeaveEntry | null, defaults: LeaveDefaults | undefined, members: TeamMember[]): string {
    if (entry) {
        return entry.memberId || holidayValue;
    }
    if (defaults?.memberId !== undefined) {
        return defaults.memberId || holidayValue;
    }
    return members[0]?.id || holidayValue;
}

export default function LeaveDialog({ entry, defaults, members, onSave, onDelete, onHide }: LeaveDialogProps) {
    const initialStart = entry?.start || defaults?.start;
    const initialEnd = entry?.end || defaults?.end;
    const [memberId, setMemberId] = useState(() => getInitialMember(entry, defaults, members));
    const [holidayMembers, setHolidayMembers] = useState<string[]>(entry?.memberIds || []);
    const [start, setStart] = useState<Date>(initialStart ? parseDateKey(initialStart) : new Date());
    const [end, setEnd] = useState<Date>(initialEnd ? parseDateKey(initialEnd) : new Date());
    const [fullDay, setFullDay] = useState(entry ? entry.hours === null : true);
    const [hours, setHours] = useState<number | undefined>(entry?.hours ?? 4);
    const [title, setTitle] = useState(entry?.title || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isHoliday = memberId === holidayValue;
    const invalid = end < start || (!fullDay && !(hours && hours > 0));

    const save = async () => {
        setIsSaving(true);
        await onSave({
            id: entry?.id || createId(),
            memberId: isHoliday ? null : memberId,
            memberIds: isHoliday && holidayMembers.length ? holidayMembers : undefined,
            start: toDateKey(start),
            end: toDateKey(end),
            hours: fullDay ? null : hours || null,
            title: title.trim() || (isHoliday ? 'Holiday' : 'Leave'),
            source: 'manual',
        });
        setIsSaving(false);
    };

    const remove = async () => {
        if (!entry || !onDelete) {
            return;
        }
        setIsDeleting(true);
        await onDelete(entry);
        setIsDeleting(false);
    };

    const memberOptions = [{ label: 'Holiday (team)', value: holidayValue }, ...members.map((m) => ({ label: m.displayName, value: m.id }))];

    const footer = (
        <div className="flex justify-end gap-2">
            {entry && onDelete && (
                <Button
                    label="Delete"
                    layout="plain"
                    variant="danger"
                    className="me-auto"
                    leftIcon={<i className="fa fa-trash" />}
                    isLoading={isDeleting}
                    disabled={isSaving || isDeleting}
                    confirmText="Delete this entry?"
                    onClick={remove}
                />
            )}
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Save" isLoading={isSaving} disabled={isSaving || isDeleting || invalid} onClick={save} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={entry ? 'Edit leave' : 'Add leave or holiday'} size="md" footer={footer}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Who" className="sm:col-span-2">
                    <Dropdown options={memberOptions} value={memberId} onChange={(e) => setMemberId(e.value as string)} searchable />
                </Field>
                {isHoliday && (
                    <Field label="Applies to" hint="Leave empty for everyone in the team (for example teams across countries)." className="sm:col-span-2">
                        <Multiselect options={members.map((m) => ({ label: m.displayName, value: m.id }))} value={holidayMembers} onChange={(e) => setHolidayMembers(e.value as string[])} placeholder="Everyone" />
                    </Field>
                )}
                <Field label="From">
                    <DateTimePicker value={start} onChange={setStart} />
                </Field>
                <Field label="To">
                    <DateTimePicker value={end} onChange={setEnd} />
                </Field>
                <InputSwitch label="Full day" checked={fullDay} onChange={(e) => setFullDay(e.value)} />
                {!fullDay && (
                    <Field label="Hours off per day">
                        <NumericInput value={hours} min={0.5} max={24} step={0.5} maxDecimals={1} onChange={(e) => setHours(e.value)} />
                    </Field>
                )}
                <Field label="Title" className="sm:col-span-2">
                    <TextInput value={title} onChange={(e) => setTitle(e.value)} maxLength={80} placeholder={isHoliday ? 'Holiday' : 'Leave'} />
                </Field>
            </div>
        </Modal>
    );
}
