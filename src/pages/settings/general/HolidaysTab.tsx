import { useCallback, useMemo, useState } from 'react';

import { inject } from '@services';

import { Button, Checkbox, Dropdown, TextInput } from '@components';

import { formatDate } from '@utils';

import type { NonWorkingDay } from '@types';

interface HolidaysTabProps {
    settings: Record<string, any>;
    onSave: (value: any, field: string) => void;
}

const typeOptions = [
    { value: 'holiday', label: 'Public holiday' },
    { value: 'leave', label: 'Leave / time off' },
];

function todayKey(): string {
    return formatDate(new Date(), 'yyyy-MM-dd');
}

export default function HolidaysTab({ settings, onSave }: HolidaysTabProps) {
    const { $userutils } = inject('UserUtilsService');

    const holidays: NonWorkingDay[] = useMemo(() => settings.holidays || [], [settings.holidays]);

    const [newDate, setNewDate] = useState(todayKey);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'holiday' | 'leave'>('holiday');
    const [newHalfDay, setNewHalfDay] = useState(false);

    const sorted = useMemo(() => [...holidays].sort((a, b) => a.date.localeCompare(b.date)), [holidays]);

    const persist = useCallback(
        (list: NonWorkingDay[]) => {
            onSave(list, 'holidays');
        },
        [onSave],
    );

    const addEntry = useCallback(() => {
        if (!newDate) {
            return;
        }

        const entry: NonWorkingDay = {
            date: newDate,
            name: newName.trim() || undefined,
            type: newType,
            isHalfDay: newHalfDay || undefined,
        };

        // Re-adding an existing date replaces it rather than creating a duplicate
        const list = [...holidays.filter((h) => h.date !== entry.date), entry];
        persist(list);

        setNewName('');
        setNewHalfDay(false);
    }, [newDate, newName, newType, newHalfDay, holidays, persist]);

    const removeEntry = useCallback(
        (date: string) => {
            persist(holidays.filter((h) => h.date !== date));
        },
        [holidays, persist],
    );

    const importWeekendsNote = useMemo(() => {
        const workingDays = settings.workingDays as number[] | undefined;
        if (!workingDays?.length) {
            return null;
        }
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const offDays = dayNames.filter((_, i) => !workingDays.includes(i));
        return offDays.length ? offDays.join(', ') : null;
    }, [settings.workingDays]);

    return (
        <div className="divide-y divide-[--border-primary]">
            <div className="pb-5">
                <div className="text-sm font-semibold text-[--text-primary] mb-1">Holidays &amp; Leave</div>
                <p className="text-xs text-[--text-secondary] mb-3">
                    Days listed here are treated as non-working, so worklog reports and the logging compliance gadget will not flag them as
                    missing time. Mark a day as half day when you are expected to log half of your normal hours.
                    {importWeekendsNote && (
                        <>
                            {' '}
                            Your weekends ({importWeekendsNote}) are already excluded through the Working Days setting and need not be listed
                            here.
                        </>
                    )}
                </p>

                <div className="flex gap-3 items-end flex-wrap mb-4">
                    <div>
                        <label className="block text-xs font-medium text-[--text-secondary] mb-1">Date</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="px-3 py-2 border border-(--border-color) rounded-md text-sm bg-(--bg-primary) text-primary"
                        />
                    </div>
                    <div className="flex-1 min-w-40">
                        <label className="block text-xs font-medium text-[--text-secondary] mb-1">Description (optional)</label>
                        <TextInput value={newName} onChange={(e) => setNewName(e.value)} placeholder="e.g. Christmas, Annual leave" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[--text-secondary] mb-1">Type</label>
                        <Dropdown
                            className="w-44"
                            options={typeOptions}
                            value={newType}
                            onChange={(e) => setNewType(e.value as 'holiday' | 'leave')}
                        />
                    </div>
                    <div className="pb-2">
                        <Checkbox checked={newHalfDay} onChange={(e) => setNewHalfDay(e.value)} label="Half day" />
                    </div>
                    <Button variant="primary" leftIcon={<i className="fa fa-plus" />} onClick={addEntry} disabled={!newDate}>
                        Add
                    </Button>
                </div>

                {!sorted.length && (
                    <div className="text-xs text-[--text-secondary] italic">
                        No holidays or leave configured yet. Only weekends are excluded from expected working time.
                    </div>
                )}

                {!!sorted.length && (
                    <div className="rounded-lg border border-(--border-color) overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-(--bg-secondary)">
                                <tr>
                                    <th className="text-left px-3 py-2 font-medium">Date</th>
                                    <th className="text-left px-3 py-2 font-medium">Description</th>
                                    <th className="text-left px-3 py-2 font-medium">Type</th>
                                    <th className="text-left px-3 py-2 font-medium">Expected hours</th>
                                    <th className="w-12" />
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((h) => (
                                    <tr key={h.date} className="border-t border-(--border-color)">
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            {$userutils.formatDate(new Date(`${h.date}T00:00:00`))}
                                        </td>
                                        <td className="px-3 py-2">{h.name || <span className="text-secondary italic">—</span>}</td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded text-xs ${
                                                    h.type === 'leave'
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                }`}
                                            >
                                                {h.type === 'leave' ? 'Leave' : 'Holiday'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">{h.isHalfDay ? 'Half day' : 'None'}</td>
                                        <td className="px-3 py-2 text-right">
                                            <Button
                                                layout="plain"
                                                variant="danger"
                                                leftIcon={<i className="fa fa-trash" />}
                                                onClick={() => removeEntry(h.date)}
                                                title="Remove"
                                                size="sm"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
