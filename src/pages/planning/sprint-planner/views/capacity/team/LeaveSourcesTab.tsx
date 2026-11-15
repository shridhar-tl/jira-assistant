import { useState, type ChangeEvent } from 'react';

import type { CalendarInfo } from '@/types';

import { Button, Checkbox, Chips, Dropdown, InputSwitch, Multiselect, SelectButton, TextInput } from '@components';

import { isLeaveSourceAvailable } from '../../../../shared/board-loader';
import Field from '../../../../shared/components/Field';
import { defaultLeaveRules } from '../../../../shared/constants';
import { parseIcsEvents } from '../../../../shared/ics-parser';
import { getSourceCalendars } from '../../../../shared/leave-sources';
import type { LeaveShowAs, LeaveSourceConfig, StoredCalendarEvent, TeamDefinition, TeamMember } from '../../../../shared/types';
import { getIcsImportRange } from '../../../actions';

interface LeaveSourcesTabProps {
    team: TeamDefinition;
    members: TeamMember[];
    imports: Record<string, StoredCalendarEvent[]>;
    onChange: (team: TeamDefinition) => void;
    onImport: (sourceId: string, events: StoredCalendarEvent[] | null) => void;
}

interface SourceEditorProps {
    source: LeaveSourceConfig;
    members: TeamMember[];
    pendingCount: number | null;
    onChange: (s: LeaveSourceConfig) => void;
    onImport: (events: StoredCalendarEvent[]) => void;
    onRemove: () => void;
}

type SourceType = LeaveSourceConfig['type'];

const typeLabels: Record<SourceType, string> = {
    outlook: 'Outlook calendar',
    google: 'Google calendar',
    ics: '.ics file',
    confluence: 'Confluence Team Calendar',
};
const allTypes: SourceType[] = ['outlook', 'google', 'ics', 'confluence'];
const kindItems = [
    { label: 'Leave of each person', value: 'leave' },
    { label: 'Holidays for the team', value: 'holiday' },
];
const showAsOptions: { value: LeaveShowAs; label: string }[] = [
    { value: 'oof', label: 'Out of office' },
    { value: 'busy', label: 'Busy' },
    { value: 'tentative', label: 'Tentative' },
    { value: 'free', label: 'Free' },
];

function createId(): string {
    return `src${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function isAvailable(type: SourceType): boolean {
    return isLeaveSourceAvailable({ id: '', type, kind: 'leave', name: '', calendarId: '', rules: defaultLeaveRules });
}

function getImportHint(source: LeaveSourceConfig, pendingCount: number | null): string {
    if (pendingCount !== null) {
        return `${pendingCount} events read from the file. The leave is stored for the team when you save.`;
    }
    if (source.importedAt) {
        return `${source.importedCount ?? 0} leave entries imported from ${source.calendarId} on ${new Date(source.importedAt).toLocaleDateString()}. Import the file again after changing the rules or the people mapping.`;
    }
    return 'Events from three months ago to a year ahead are imported. Only the matched leave is stored, not the file.';
}

function SourceEditor({ source, members, pendingCount, onChange, onImport, onRemove }: SourceEditorProps) {
    const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadCalendars = async () => {
        setIsLoading(true);
        setError(null);
        try {
            setCalendars(await getSourceCalendars(source.type, source.url));
        } catch (err) {
            setError((err as Error)?.message || 'Unable to read the calendars. Check that you are signed in.');
        } finally {
            setIsLoading(false);
        }
    };

    const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        const range = getIcsImportRange();
        const events = parseIcsEvents(await file.text(), range.start, range.end);
        onChange({ ...source, calendarId: file.name, name: source.name || file.name });
        onImport(events);
        e.target.value = '';
    };

    const calendarOptions = calendars.length ? calendars.map((c) => ({ label: c.name, value: c.id })) : source.calendarId ? [{ label: source.name || source.calendarId, value: source.calendarId }] : [];

    return (
        <div className="flex flex-col gap-3 rounded border border-(--border-primary) p-3">
            <div className="flex items-center gap-2">
                <span className="font-medium">{typeLabels[source.type]}</span>
                <span className="flex-1" />
                <Button size="xs" layout="plain" variant="danger" leftIcon={<i className="fa fa-trash" />} ariaLabel="Remove source" confirmText="Remove this calendar source?" onClick={onRemove} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Name">
                    <TextInput value={source.name} onChange={(e) => onChange({ ...source, name: e.value })} />
                </Field>
                <Field label="Calendar holds">
                    <SelectButton items={kindItems} value={source.kind} onChange={(e) => onChange({ ...source, kind: e.value as 'leave' | 'holiday' })} />
                </Field>
                {source.type === 'confluence' && (
                    <Field label="Confluence URL" className="sm:col-span-2">
                        <TextInput value={source.url || ''} onChange={(e) => onChange({ ...source, url: e.value.trim() })} placeholder="https://confluence.example.com" />
                    </Field>
                )}
                {source.type === 'ics' ? (
                    <Field label="File" hint={getImportHint(source, pendingCount)} className="sm:col-span-2">
                        <input type="file" accept=".ics,text/calendar" className="cursor-pointer text-sm" onChange={importFile} />
                    </Field>
                ) : (
                    <Field label="Calendar" className="sm:col-span-2">
                        <div className="flex gap-2">
                            <div className="min-w-0 flex-1">
                                <Dropdown
                                    options={calendarOptions}
                                    value={source.calendarId || undefined}
                                    onChange={(e) => onChange({ ...source, calendarId: e.value as string, name: source.name || calendars.find((c) => c.id === e.value)?.name || '' })}
                                    placeholder="Load the calendars first"
                                    searchable
                                />
                            </div>
                            <Button size="sm" layout="outlined" label="Load calendars" isLoading={isLoading} disabled={source.type === 'confluence' && !source.url} onClick={loadCalendars} />
                        </div>
                        {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
                        <span className="text-xs text-(--text-secondary)">
                            Leave read from this calendar is stored for the board, so members who cannot read the calendar plan with the same leave.
                        </span>
                    </Field>
                )}
                {source.kind === 'holiday' && (
                    <Field label="Holidays apply to" hint="Leave empty for everyone in the team." className="sm:col-span-2">
                        <Multiselect options={members.map((m) => ({ label: m.displayName, value: m.id }))} value={source.memberIds || []} onChange={(e) => onChange({ ...source, memberIds: e.value as string[] })} placeholder="Everyone" />
                    </Field>
                )}
                <Field label="Events that count (keywords in title or category)" hint="Leave empty to count every event of the calendar." className="sm:col-span-2">
                    <Chips value={source.rules.keywords} onChange={(e) => onChange({ ...source, rules: { ...source.rules, keywords: e.value } })} placeholder="leave, vacation, holiday" />
                </Field>
                {source.type !== 'confluence' && (
                    <Field label="Or events shown as" className="sm:col-span-2">
                        <div className="flex flex-wrap gap-3">
                            {showAsOptions.map((option) => (
                                <Checkbox
                                    key={option.value}
                                    label={option.label}
                                    checked={source.rules.showAs.includes(option.value)}
                                    onChange={(e) =>
                                        onChange({
                                            ...source,
                                            rules: {
                                                ...source.rules,
                                                showAs: e.value ? [...source.rules.showAs.filter((s) => s !== 'any'), option.value] : source.rules.showAs.filter((s) => s !== option.value),
                                            },
                                        })
                                    }
                                />
                            ))}
                        </div>
                    </Field>
                )}
                <InputSwitch label="Only all-day events" checked={source.rules.allDayOnly} onChange={(e) => onChange({ ...source, rules: { ...source.rules, allDayOnly: e.value } })} />
            </div>
        </div>
    );
}

export default function LeaveSourcesTab({ team, members, imports, onChange, onImport }: LeaveSourcesTabProps) {
    const [newType, setNewType] = useState<SourceType>(isAvailable('outlook') ? 'outlook' : 'ics');
    const types = allTypes.filter(isAvailable);
    const mappings = Object.entries(team.userMapping);

    const addSource = () =>
        onChange({
            ...team,
            leaveSources: [
                ...team.leaveSources,
                { id: createId(), type: newType, kind: 'leave', name: '', calendarId: '', rules: { ...defaultLeaveRules, keywords: [], showAs: [] } },
            ],
        });

    const updateSource = (source: LeaveSourceConfig) => onChange({ ...team, leaveSources: team.leaveSources.map((s) => (s.id === source.id ? source : s)) });

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-(--text-secondary)">
                Leave calendars reduce the capacity of the person the leave belongs to. Holiday calendars reduce the capacity of everyone (or of the chosen people). People in
                the calendar are matched to Jira users by email, then by the mapping below.
            </p>
            {team.leaveSources.map((source) => (
                <SourceEditor
                    key={source.id}
                    source={source}
                    members={members}
                    pendingCount={imports[source.id]?.length ?? null}
                    onChange={updateSource}
                    onImport={(events) => onImport(source.id, events)}
                    onRemove={() => {
                        onImport(source.id, null);
                        onChange({ ...team, leaveSources: team.leaveSources.filter((s) => s.id !== source.id) });
                    }}
                />
            ))}
            <div className="flex flex-wrap items-end gap-2">
                <Field label="Add a calendar source" className="w-60">
                    <Dropdown options={types.map((t) => ({ label: typeLabels[t], value: t }))} value={newType} onChange={(e) => setNewType(e.value as SourceType)} />
                </Field>
                <Button layout="outlined" leftIcon={<i className="fa fa-plus" />} label="Add" onClick={addSource} />
            </div>

            {mappings.length > 0 && (
                <Field label="Calendar people mapped to Jira users">
                    <div className="flex flex-col gap-1">
                        {mappings.map(([person, memberId]) => (
                            <div key={person} className="flex items-center gap-2 text-sm">
                                <span className="min-w-0 flex-1 truncate">{person}</span>
                                <i className="fa fa-long-arrow-right text-(--text-tertiary)" />
                                <span className="min-w-0 flex-1 truncate">{members.find((m) => m.id === memberId)?.displayName || memberId}</span>
                                <Button
                                    size="xs"
                                    layout="plain"
                                    leftIcon={<i className="fa fa-times" />}
                                    ariaLabel="Remove mapping"
                                    onClick={() => {
                                        const userMapping = { ...team.userMapping };
                                        delete userMapping[person];
                                        onChange({ ...team, userMapping });
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </Field>
            )}
        </div>
    );
}
