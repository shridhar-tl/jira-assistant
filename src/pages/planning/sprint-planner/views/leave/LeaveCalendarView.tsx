import { useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';

import { phoneMediaQuery, useMediaQuery } from '@/hooks';

import { inject } from '@services';

import {
    Button,
    Calendar,
    CalendarViewMode,
    Multiselect,
    type CalendarDragInfo,
    type CalendarEntryRenderer,
    type CalendarSelectionInfo,
    type ResolvedCalendarEntry,
} from '@components';

import { parseDateKey, toDateKey } from '../../../shared/segments';
import type { LeaveEntry } from '../../../shared/types';
import { loadLeaveRange, refreshCalendars, removeManualLeave, saveManualLeave } from '../../actions';
import { usePlannerStore } from '../../store';
import type { BoardModel } from '../../useBoardModel';
import LeaveDialog, { type LeaveDefaults } from '../capacity/LeaveDialog';

import { appliesToMembers, getLeaveIcon, toCalendarEntry, type LeaveCalendarData } from './leave-display';
import LeaveDetailsDialog from './LeaveDetailsDialog';

interface LeaveCalendarViewProps {
    model: BoardModel;
}

interface LeaveRange {
    start: string;
    end: string;
}

type EditState = { entry: LeaveEntry } | { defaults: LeaveDefaults };

const calendarViews = [CalendarViewMode.dayGridMonth, CalendarViewMode.dayGridWeek, CalendarViewMode.dayGridDay, CalendarViewMode.listMonth];
const viewLabels = {
    [CalendarViewMode.dayGridMonth]: 'Month',
    [CalendarViewMode.dayGridWeek]: 'Week',
    [CalendarViewMode.dayGridDay]: 'Day',
    [CalendarViewMode.listMonth]: 'List',
};

function getLeave(entry: ResolvedCalendarEntry): LeaveEntry | null {
    return (entry.data as LeaveCalendarData | undefined)?.leave || null;
}

function getFirstDayOfWeek(): number {
    const { $session } = inject('SessionService');
    const startOfWeek = $session.CurrentUser?.startOfWeek;
    return startOfWeek && startOfWeek > 0 ? startOfWeek - 1 : 0;
}

function getCurrentMemberId(memberIds: string[]): string | undefined {
    const { $session } = inject('SessionService');
    const user = $session.CurrentUser;
    return memberIds.find((id) => id === user?.accountId || id === user?.name);
}

const renderEntry: CalendarEntryRenderer = (entry) => {
    const leave = getLeave(entry);
    return (
        <div className="flex min-w-0 items-center gap-1 px-1 text-[11px] leading-4">
            {leave && <i className={classNames(getLeaveIcon(leave), 'shrink-0 text-[10px] opacity-80')} />}
            <span className="truncate">{entry.title}</span>
        </div>
    );
};

export default function LeaveCalendarView({ model }: LeaveCalendarViewProps) {
    const { data } = model;
    const { members, team, leave } = data;
    const readOnly = !!usePlannerStore((s) => s.teamReadOnlyReason);
    const isPhone = useMediaQuery(phoneMediaQuery);
    const [range, setRange] = useState<LeaveRange | null>(null);
    const [entries, setEntries] = useState<LeaveEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [memberFilter, setMemberFilter] = useState<string[]>([]);
    const [editing, setEditing] = useState<EditState | null>(null);
    const [viewing, setViewing] = useState<LeaveEntry | null>(null);
    const [firstDayOfWeek] = useState(getFirstDayOfWeek);

    useEffect(() => {
        if (!range) {
            return;
        }
        let cancelled = false;
        setIsLoading(true);
        loadLeaveRange(range.start, range.end)
            .then((list) => !cancelled && setEntries(list))
            .catch((err) => console.error('Unable to load the leave of the month', err))
            .finally(() => !cancelled && setIsLoading(false));
        return () => {
            cancelled = true;
        };
    }, [range, leave]);

    const memberOptions = useMemo(() => members.map((m) => ({ label: m.displayName, value: m.id })), [members]);
    const memberIds = useMemo(() => members.map((m) => m.id), [members]);

    const calendarEntries = useMemo(() => {
        const selected = new Set(memberFilter);
        return entries.filter((e) => appliesToMembers(e, selected)).map((e) => toCalendarEntry(e, members, !readOnly, parseDateKey));
    }, [entries, memberFilter, members, readOnly]);

    const businessHours = useMemo(() => ({ daysOfWeek: team.defaults.workingDays, startTime: '00:00', endTime: '23:59' }), [team.defaults.workingDays]);

    const getDefaultMember = useCallback(
        () => (memberFilter.length === 1 ? memberFilter[0] : getCurrentMemberId(memberIds)),
        [memberFilter, memberIds],
    );

    const openNew = useCallback(
        (start: Date, end: Date) => {
            if (!readOnly) {
                setEditing({ defaults: { start: toDateKey(start), end: toDateKey(end), memberId: getDefaultMember() } });
            }
        },
        [readOnly, getDefaultMember],
    );

    const handleRangeChange = useCallback((next: { start: Date; end: Date }) => setRange({ start: toDateKey(next.start), end: toDateKey(next.end) }), []);
    const handleSelect = useCallback((info: CalendarSelectionInfo) => openNew(info.start, info.end), [openNew]);
    const handleDateClick = useCallback((date: Date) => openNew(date, date), [openNew]);

    const handleEntryClick = useCallback(
        (entry: ResolvedCalendarEntry) => {
            const item = getLeave(entry);
            if (!item) {
                return;
            }
            if (item.source === 'manual' && !readOnly) {
                setEditing({ entry: item });
            } else {
                setViewing(item);
            }
        },
        [readOnly],
    );

    const handleDrop = useCallback(async (info: CalendarDragInfo) => {
        const item = getLeave(info.entry);
        if (!item || item.source !== 'manual') {
            return;
        }
        const moved: LeaveEntry = { ...item, start: toDateKey(info.newStart), end: toDateKey(info.newEnd) };
        setEntries((list) => list.map((e) => (e === item ? moved : e)));
        if (!(await saveManualLeave(moved, item))) {
            setEntries((list) => list.map((e) => (e === moved ? item : e)));
        }
    }, []);

    const saveEntry = async (entry: LeaveEntry) => {
        const previous = editing && 'entry' in editing ? editing.entry : null;
        if (await saveManualLeave(entry, previous)) {
            setEditing(null);
        }
    };

    const deleteEntry = async (entry: LeaveEntry) => {
        if (await removeManualLeave(entry)) {
            setEditing(null);
        }
    };

    return (
        <div className="flex min-h-[560px] flex-1 flex-col gap-3 p-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="w-full sm:w-72">
                    <Multiselect options={memberOptions} value={memberFilter} onChange={(e) => setMemberFilter(e.value as string[])} placeholder="Everyone" />
                </div>
                <span className="flex-1" />
                {team.leaveSources.length > 0 && (
                    <Button size="sm" layout="plain" leftIcon={<i className="fa fa-refresh" />} label="Calendars" title="Read the leave calendars again" onClick={() => refreshCalendars()} />
                )}
                {!readOnly && (
                    <Button
                        size="sm"
                        layout="outlined"
                        leftIcon={<i className="fa fa-plus" />}
                        label="Add leave"
                        onClick={() => setEditing({ defaults: { start: toDateKey(new Date()), end: toDateKey(new Date()), memberId: getDefaultMember() } })}
                    />
                )}
            </div>

            <div className="min-h-0 flex-1">
                <Calendar
                    key={isPhone ? 'list' : 'month'}
                    entries={calendarEntries}
                    initialView={isPhone ? CalendarViewMode.listMonth : CalendarViewMode.dayGridMonth}
                    headerToolbarViews={calendarViews}
                    viewLabels={viewLabels}
                    navLinkView={CalendarViewMode.dayGridDay}
                    height="100%"
                    firstDayOfWeek={firstDayOfWeek}
                    businessHours={businessHours}
                    selectable={!readOnly}
                    editable={false}
                    fixedWeekCount={false}
                    dayMaxEntries
                    loading={isLoading}
                    emptyMessage="No leave or holidays in this period"
                    renderEntry={renderEntry}
                    onDateRangeChange={handleRangeChange}
                    onDateSelect={handleSelect}
                    onDateClick={readOnly ? undefined : handleDateClick}
                    onEntryClick={handleEntryClick}
                    onEntryDrop={handleDrop}
                    ariaLabel="Leave calendar"
                />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-(--text-tertiary)">
                <span>
                    <i className="fa fa-plane me-1" />
                    Leave
                </span>
                <span>
                    <i className="fa fa-flag me-1" />
                    Holiday
                </span>
                <span>
                    <i className="fa fa-calendar me-1" />
                    From a calendar (read only)
                </span>
                {!readOnly && <span>Click a day or drag across days in the month to add leave. Click a date to open that day. Drag an entry to move it.</span>}
            </div>

            {editing && (
                <LeaveDialog
                    entry={'entry' in editing ? editing.entry : null}
                    defaults={'defaults' in editing ? editing.defaults : undefined}
                    members={members}
                    onSave={saveEntry}
                    onDelete={deleteEntry}
                    onHide={() => setEditing(null)}
                />
            )}
            {viewing && <LeaveDetailsDialog entry={viewing} members={members} sources={team.leaveSources} onHide={() => setViewing(null)} />}
        </div>
    );
}
