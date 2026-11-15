import { useState } from 'react';

import { addDays, differenceInCalendarDays } from 'date-fns';

import { DateTimePicker } from '@/controls';

import { Button, Dropdown, Modal, NumericInput } from '@components';

import type { BoardData } from '../../../shared/board-loader';
import Field from '../../../shared/components/Field';
import UserAvatar from '../../../shared/components/UserAvatar';
import UserPicker from '../../../shared/components/UserPicker';
import { clampAllocation, createSegmentId, parseDateKey, splitSegment, toDateKey } from '../../../shared/segments';
import type { PlannedSegment, PlannerUser, SegmentPerson } from '../../../shared/types';
import { saveSegments } from '../../actions';

export interface SegmentDialogState {
    issueKey: string;
    segmentId: string | null;
    start?: Date;
    end?: Date;
}

interface SegmentDialogProps {
    state: SegmentDialogState;
    data: BoardData;
    onHide: () => void;
}

const noLabel = '';

/** Creates, edits, splits or deletes a planned segment of an issue (RM-6). */
export default function SegmentDialog({ state, data, onHide }: SegmentDialogProps) {
    const issue = data.issues[state.issueKey];
    const existing = issue?.segments.find((s) => s.id === state.segmentId) || null;
    const defaultPerson: SegmentPerson[] = issue?.assignee ? [{ id: issue.assignee.id, allocation: 100 }] : [];

    const [start, setStart] = useState<Date>(existing ? parseDateKey(existing.start) : state.start || issue?.startDate || new Date());
    const [end, setEnd] = useState<Date>(existing ? parseDateKey(existing.end) : state.end || issue?.dueDate || addDays(new Date(), 4));
    const [label, setLabel] = useState(existing?.label || noLabel);
    const [people, setPeople] = useState<SegmentPerson[]>(existing?.people || defaultPerson);
    const [isSaving, setIsSaving] = useState(false);
    const [extraUsers, setExtraUsers] = useState<PlannerUser[]>([]);

    if (!issue) {
        return null;
    }

    const userMap = new Map<string, PlannerUser>();
    [...data.members, ...(issue.assignee ? [issue.assignee] : []), ...extraUsers].forEach((u) => userMap.set(u.id, u));
    const personName = (id: string) => userMap.get(id)?.displayName || id;

    const others = issue.segments.filter((s) => s.id !== state.segmentId);
    const current: PlannedSegment = { id: existing?.id || createSegmentId(), start: toDateKey(start), end: toDateKey(end), label: label || undefined, people };
    const invalid = end < start || !people.length;

    const persist = async (segments: PlannedSegment[]) => {
        setIsSaving(true);
        await saveSegments(issue.key, segments);
        setIsSaving(false);
        onHide();
    };

    const split = () => {
        const days = differenceInCalendarDays(end, start);
        const parts = splitSegment(current, addDays(start, Math.ceil(days / 2)));
        if (parts) {
            persist([...others, ...parts]);
        }
    };

    const labelOptions = [{ label: 'No label', value: noLabel }, ...data.team.segmentLabels.map((l) => ({ label: l, value: l }))];

    const footer = (
        <div className="flex flex-wrap items-center justify-end gap-2">
            {existing && (
                <>
                    <Button label="Delete" layout="plain" variant="danger" leftIcon={<i className="fa fa-trash" />} confirmText="Delete this planned segment?" onClick={() => persist(others)} />
                    <Button label="Split" layout="plain" leftIcon={<i className="fa fa-scissors" />} disabled={differenceInCalendarDays(end, start) < 1} onClick={split} />
                </>
            )}
            <span className="flex-1" />
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Save" isLoading={isSaving} disabled={invalid || isSaving} onClick={() => persist([...others, current])} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={`${existing ? 'Planned segment' : 'Plan work'} · ${issue.key}`} size="md" footer={footer}>
            <div className="flex flex-col gap-3">
                {!issue.segments.length && (
                    <p className="text-xs text-(--text-secondary)">
                        Once an issue has planned segments, they are its plan on the roadmap, the resource timeline and in capacity instead of its start / due dates and assignee.
                    </p>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="From">
                        <DateTimePicker value={start} onChange={setStart} />
                    </Field>
                    <Field label="To">
                        <DateTimePicker value={end} onChange={setEnd} />
                    </Field>
                    <Field label="Label">
                        <Dropdown options={labelOptions} value={label} onChange={(e) => setLabel(e.value as string)} />
                    </Field>
                </div>
                <Field label="People">
                    <div className="flex flex-col gap-1.5">
                        {people.map((person) => (
                            <div key={person.id} className="flex items-center gap-2 text-sm">
                                <UserAvatar name={personName(person.id)} avatarUrl={userMap.get(person.id)?.avatarUrl} size="sm" />
                                <span className="min-w-0 flex-1 truncate">{personName(person.id)}</span>
                                <div className="w-24">
                                    <NumericInput
                                        value={person.allocation}
                                        min={5}
                                        max={100}
                                        step={5}
                                        onChange={(e) => setPeople(people.map((p) => (p.id === person.id ? { ...p, allocation: clampAllocation(e.value ?? 100) } : p)))}
                                    />
                                </div>
                                <span className="text-xs text-(--text-secondary)">%</span>
                                <Button size="xs" layout="plain" leftIcon={<i className="fa fa-times" />} ariaLabel="Remove person" onClick={() => setPeople(people.filter((p) => p.id !== person.id))} />
                            </div>
                        ))}
                        <UserPicker
                            value={null}
                            suggestions={data.members.filter((m) => !people.some((p) => p.id === m.id))}
                            placeholder="Add a person"
                            onChange={(user) => {
                                if (user && !people.some((p) => p.id === user.id)) {
                                    setExtraUsers((prev) => [...prev, user]);
                                    setPeople([...people, { id: user.id, allocation: 100 }]);
                                }
                            }}
                        />
                    </div>
                </Field>
            </div>
        </Modal>
    );
}
