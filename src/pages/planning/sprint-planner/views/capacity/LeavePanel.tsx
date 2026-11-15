import { useEffect, useMemo, useState } from 'react';

import { addDays } from 'date-fns';

import { Button, Dropdown } from '@components';

import type { BoardData } from '../../../shared/board-loader';
import { formatDateRange } from '../../../shared/format';
import { parseDateKey, toDateKey } from '../../../shared/segments';
import type { LeaveEntry } from '../../../shared/types';
import { loadLeaveList, refreshCalendars, removeManualLeave, saveManualLeave, saveTeam } from '../../actions';
import { leaveSourceLabels } from '../leave/leave-display';
import LeaveDialog from './LeaveDialog';

interface LeavePanelProps {
    data: BoardData;
    readOnly: boolean;
}

export default function LeavePanel({ data, readOnly }: LeavePanelProps) {
    const { team, members, leave } = data;
    const [editing, setEditing] = useState<LeaveEntry | 'new' | null>(null);
    const [manualLeave, setManualLeave] = useState<LeaveEntry[]>(leave.manual);
    const memberName = (id: string | null | undefined) => (id ? members.find((m) => m.id === id)?.displayName || id : 'Everyone');

    useEffect(() => {
        let cancelled = false;
        loadLeaveList()
            .then((entries) => !cancelled && setManualLeave(entries))
            .catch((err) => console.error('Unable to load the leave list', err));
        return () => {
            cancelled = true;
        };
    }, [leave]);

    const calendarRanges = useMemo(() => {
        const sorted = [...leave.entries].sort(
            (a, b) => `${a.source}:${a.memberId}:${a.title}`.localeCompare(`${b.source}:${b.memberId}:${b.title}`) || a.start.localeCompare(b.start),
        );
        const ranges: { title: string; memberId: string | null; source: LeaveEntry['source']; start: string; end: string }[] = [];
        for (const entry of sorted) {
            const last = ranges[ranges.length - 1];
            const continues =
                last &&
                last.source === entry.source &&
                last.memberId === entry.memberId &&
                last.title === entry.title &&
                toDateKey(addDays(parseDateKey(last.end), 1)) >= entry.start;
            if (continues) {
                last.end = entry.end > last.end ? entry.end : last.end;
            } else {
                ranges.push({ title: entry.title, memberId: entry.memberId, source: entry.source, start: entry.start, end: entry.end });
            }
        }
        return ranges.sort((a, b) => a.start.localeCompare(b.start));
    }, [leave.entries]);

    const unmappedPeople = useMemo(() => [...new Set(leave.unmapped.map((u) => u.person))], [leave.unmapped]);

    const saveEntry = async (entry: LeaveEntry) => {
        const previous = editing && editing !== 'new' ? editing : null;
        if (await saveManualLeave(entry, previous)) {
            setEditing(null);
        }
    };

    const mapPerson = (person: string, memberId: string) => saveTeam({ ...team, userMapping: { ...team.userMapping, [person]: memberId } });

    return (
        <section className="flex flex-col gap-2 rounded-lg border border-(--border-primary) p-3">
            <div className="flex items-center gap-2">
                <h3 className="me-auto text-sm font-semibold">Leave and holidays</h3>
                {team.leaveSources.length > 0 && <Button size="sm" layout="plain" leftIcon={<i className="fa fa-refresh" />} label="Calendars" onClick={() => refreshCalendars()} />}
                {!readOnly && <Button size="sm" layout="outlined" leftIcon={<i className="fa fa-plus" />} label="Add" onClick={() => setEditing('new')} />}
            </div>

            <div className="overflow-x-auto">
                <table className="exportable w-full min-w-[480px] border-collapse text-sm" data-export-sheet-name="Leave">
                    <thead>
                        <tr className="border-b border-(--border-primary) text-left text-xs text-(--text-secondary)">
                            <th className="px-2 py-1">Who</th>
                            <th className="px-2 py-1">When</th>
                            <th className="px-2 py-1">Title</th>
                            <th className="px-2 py-1">Source</th>
                            <th className="px-2 py-1" data-export-ignore="true" />
                        </tr>
                    </thead>
                    <tbody>
                        {manualLeave.map((entry) => (
                            <tr key={entry.id} className="border-b border-(--border-secondary)">
                                <td className="px-2 py-1">{entry.memberId ? memberName(entry.memberId) : entry.memberIds?.length ? entry.memberIds.map(memberName).join(', ') : 'Everyone (holiday)'}</td>
                                <td className="px-2 py-1">
                                    {formatDateRange(parseDateKey(entry.start), parseDateKey(entry.end))}
                                    {entry.hours !== null && <span className="ms-1 text-xs text-(--text-secondary)">({entry.hours} h/day)</span>}
                                </td>
                                <td className="px-2 py-1">{entry.title}</td>
                                <td className="px-2 py-1">{leaveSourceLabels[entry.source]}</td>
                                <td className="px-2 py-1 text-right">
                                    {!readOnly && (
                                        <>
                                            <Button size="xs" layout="plain" leftIcon={<i className="fa fa-pencil" />} ariaLabel="Edit" onClick={() => setEditing(entry)} />
                                            <Button size="xs" layout="plain" variant="danger" leftIcon={<i className="fa fa-trash" />} ariaLabel="Delete" confirmText="Delete this entry?" onClick={() => removeManualLeave(entry)} />
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {calendarRanges.map((entry, index) => (
                            <tr key={`cal-${index}`} className="border-b border-(--border-secondary) text-(--text-secondary)">
                                <td className="px-2 py-1">{entry.memberId ? memberName(entry.memberId) : 'Everyone (holiday)'}</td>
                                <td className="px-2 py-1">{formatDateRange(parseDateKey(entry.start), parseDateKey(entry.end))}</td>
                                <td className="px-2 py-1">{entry.title}</td>
                                <td className="px-2 py-1">{leaveSourceLabels[entry.source]}</td>
                                <td />
                            </tr>
                        ))}
                        {!manualLeave.length && !calendarRanges.length && (
                            <tr>
                                <td colSpan={5} className="px-2 py-3 text-center text-(--text-tertiary)">
                                    No leave or holidays planned. Add them here or connect a calendar under Team.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <span className="text-[11px] text-(--text-tertiary)">Manual leave from the last 30 days and the next 12 months. Calendar leave of the planned sprints.</span>

            {unmappedPeople.length > 0 && (
                <div className="flex flex-col gap-1 rounded border border-amber-300 bg-amber-50 p-2 text-sm dark:border-amber-700 dark:bg-amber-900/20">
                    <span className="font-medium">Calendar leave of people not matched to a team member</span>
                    {unmappedPeople.map((person) => {
                        const entries = leave.unmapped.filter((u) => u.person === person);
                        return (
                            <div key={person} className="flex flex-wrap items-center gap-2">
                                <span className="min-w-40">{person}</span>
                                <span className="text-xs text-(--text-secondary)">
                                    {entries.length} entries · {entries[0].sourceName}
                                </span>
                                {!readOnly && (
                                    <div className="ms-auto w-56">
                                        <Dropdown
                                            options={members.map((m) => ({ label: m.displayName, value: m.id }))}
                                            placeholder="Map to member"
                                            onChange={(e) => mapPerson(person, e.value as string)}
                                            searchable
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {editing && <LeaveDialog entry={editing === 'new' ? null : editing} members={members} onSave={saveEntry} onHide={() => setEditing(null)} />}
        </section>
    );
}
