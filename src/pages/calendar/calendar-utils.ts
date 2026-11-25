import { endOfDay, format, formatDistanceToNow, isAfter, isBefore, isSameDay, parseISO, startOfDay } from 'date-fns';
import type { CalendarViewMode, ResolvedCalendarEntry } from 'fluxo-ui';

import type { MeetingCalendarEntry, Worklog, WorklogCalendarEntry } from '@types';

import { sett_page_calendar } from '@constants/settings';

import type { CalendarEntryData, CalendarEvent, CalendarInfoEvent, CalendarSettings, WorklogSuggestion } from './types';

export const viewModes: Array<{ value: CalendarViewMode; label: string }> = [
    { value: 'dayGridMonth', label: 'Month' },
    { value: 'timeGridWeek', label: 'Week' },
    { value: 'timeGridDay', label: 'Day' },
    { value: 'listMonth', label: 'Month List' },
    { value: 'listWeek', label: 'Week List' },
    { value: 'listDay', label: 'Day List' },
    { value: 'dayGridWeek', label: 'Grid Week' },
    { value: 'dayGridDay', label: 'Grid Day' },
];

export function resolveViewMode(mode: string | undefined): CalendarViewMode | undefined {
    if (!mode) return undefined;
    return mode;
}

function isDailySummaryEntry(entry: ResolvedCalendarEntry): boolean {
    return (entry.data as unknown as CalendarEvent['data'] | undefined)?.entryType === 3;
}

export function compareCalendarEntries(a: ResolvedCalendarEntry, b: ResolvedCalendarEntry): number {
    const summaryDiff = Number(isDailySummaryEntry(b)) - Number(isDailySummaryEntry(a));
    if (summaryDiff) return summaryDiff;

    const startDiff = a.start.getTime() - b.start.getTime();
    if (startDiff) return startDiff;

    return b.end.getTime() - b.start.getTime() - (a.end.getTime() - a.start.getTime());
}

export function isTimeGridView(viewMode: CalendarViewMode): boolean {
    return viewMode === 'timeGridWeek' || viewMode === 'timeGridDay';
}

export function isDayGridView(viewMode: CalendarViewMode): boolean {
    return viewMode === 'dayGridMonth' || viewMode === 'dayGridWeek' || viewMode === 'dayGridDay';
}

export function isListView(viewMode: CalendarViewMode): boolean {
    return viewMode === 'listMonth' || viewMode === 'listWeek' || viewMode === 'listDay';
}

export function getTimeSpentInSeconds(timeSpent: string): number {
    if (!timeSpent) return 0;
    const parts = timeSpent.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 3600 + minutes * 60;
}

export function formatTimeSpent(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function snapTimeToGrid(gridMinutes: number, date: Date): Date {
    const minutes = date.getMinutes();
    let diff = minutes % gridMinutes;

    if (diff === 0) return date;

    const movedUp = diff <= Math.floor(gridMinutes / 2);
    if (movedUp) {
        diff = -diff;
    } else {
        diff = gridMinutes - diff;
    }

    const newDate = new Date(date);
    newDate.setMinutes(newDate.getMinutes() + diff);
    return newDate;
}

export function getEventDuration(entry: Pick<CalendarEvent, 'start' | 'end'>): string {
    const start = entry.start instanceof Date ? entry.start : new Date(entry.start);
    const end = entry.end instanceof Date ? entry.end : new Date(entry.end);
    if (start && end) {
        const diff = (end.getTime() - start.getTime()) / 1000;
        return formatTimeSpent(diff);
    }
    return '00:00';
}

export function getProjectColor(ticketNo: string | undefined, projectColors?: Record<string, string>): string | undefined {
    if (!ticketNo || !projectColors) return undefined;
    return projectColors[ticketNo.substring(0, ticketNo.lastIndexOf('-')).toUpperCase()];
}

export function createWorklogEvent(entry: WorklogCalendarEntry, settings: CalendarSettings, projectColors?: Record<string, string>): CalendarEvent {
    const color = settings.worklogColor || sett_page_calendar.worklogColor;
    const projectColor = getProjectColor(entry.sourceObject?.ticketNo, projectColors);
    return {
        id: entry.id,
        title: entry.title,
        start: entry.start,
        end: entry.end,
        entryType: 1,
        data: {
            entryType: 1,
            sourceObject: entry.sourceObject,
            source: 'worklog',
        },
        color,
        borderColor: projectColor || color,
        className: projectColor ? 'cal-project-entry' : undefined,
        editable: entry.editable,
        resizable: entry.editable,
        parentId: entry.parentId,
    };
}

export function createMeetingEvent(meeting: MeetingCalendarEntry, settings: CalendarSettings): CalendarEvent {
    const color = settings.eventColor || sett_page_calendar.eventColor;
    return {
        id: meeting.id,
        title: meeting.title || 'Meeting',
        start: meeting.start,
        end: meeting.end,
        allDay: meeting.allDay,
        entryType: 2,
        data: {
            entryType: 2,
            sourceObject: meeting.sourceObject,
            source: meeting.source,
        },
        color,
        borderColor: color,
        editable: false,
        resizable: false,
    };
}

export function createSuggestionEvent(suggestion: WorklogSuggestion, settings: CalendarSettings): CalendarEvent {
    const color = settings.suggestionColor || sett_page_calendar.suggestionColor;
    return {
        id: `suggestion:${suggestion.id}`,
        title: suggestion.targetWorklog ? `+ ${suggestion.issueKey}` : suggestion.issueKey,
        start: suggestion.start,
        end: suggestion.end,
        entryType: 4,
        data: { entryType: 4, sourceObject: suggestion },
        color,
        borderColor: color,
        className: 'cal-suggestion-entry',
        editable: false,
        resizable: false,
    };
}

export function createSuggestionSummaryEvent(dateKey: string, suggestions: WorklogSuggestion[], settings: CalendarSettings): CalendarEvent {
    const color = settings.suggestionColor || sett_page_calendar.suggestionColor;
    const date = parseISO(dateKey);
    return {
        id: `suggestions:${dateKey}`,
        title: `${suggestions.length} suggested`,
        start: startOfDay(date),
        end: endOfDay(date),
        allDay: true,
        entryType: 5,
        data: { entryType: 5, sourceObject: { dateKey, suggestions } },
        color,
        borderColor: color,
        className: 'cal-suggestion-entry cal-suggestion-summary',
        editable: false,
        resizable: false,
    };
}

export function createInfoEvent(date: Date, worklogs: Worklog[], maxHours: number, minHours: number, settings: CalendarSettings): CalendarEvent {
    const timeSpent = worklogs.reduce((sum, wl) => sum + getTimeSpentInSeconds(wl.timeSpent || ''), 0);
    const maxSeconds = maxHours ? maxHours * 3600 : Number.MAX_VALUE;
    const minSeconds = minHours ? minHours * 3600 : 0;

    let diff = 0;
    if (timeSpent > maxSeconds) {
        diff = timeSpent - maxSeconds;
    } else if (timeSpent < minSeconds) {
        diff = timeSpent - minSeconds;
    }

    const dateKey = format(date, 'yyyy-MM-dd');
    const backgroundColor = getDiffColor(diff, settings);

    return {
        id: dateKey,
        title: `Logged: ${formatTimeSpent(timeSpent)}${diff ? ` (${diff > 0 ? '+' : '-'}${formatTimeSpent(Math.abs(diff))})` : ''}`,
        start: startOfDay(date),
        end: endOfDay(date),
        allDay: true,
        editable: false,
        resizable: false,
        entryType: 3,
        data: {
            entryType: 3,
            logged: timeSpent,
            diff,
            sourceObject: {
                id: dateKey,
                key: dateKey,
                logged: timeSpent,
                diff,
            } as CalendarInfoEvent,
        },
        color: backgroundColor,
        borderColor: backgroundColor,
    };
}

export function getDiffColor(diff: number, settings: CalendarSettings): string {
    if (diff > 0) {
        return settings.infoColor_high || sett_page_calendar.infoColor_high;
    } else if (diff < 0) {
        return settings.infoColor_less || sett_page_calendar.infoColor_less;
    }
    return settings.infoColor_valid || sett_page_calendar.infoColor_valid;
}

export function formatMeetingTime(dateTime: string | Date | undefined): string {
    if (!dateTime) return '';
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return format(date, 'HH:mm');
}

export function formatMeetingDate(dateTime: string | Date | undefined): string {
    if (!dateTime) return '';
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return format(date, 'MMM dd, yyyy');
}

export function getRemainingTime(startDateTime: string | Date | undefined): string {
    if (!startDateTime) return '';
    const date = typeof startDateTime === 'string' ? new Date(startDateTime) : startDateTime;
    const now = new Date();

    if (isBefore(now, date)) {
        const distance = formatDistanceToNow(date, { addSuffix: true });
        return `(in ${distance.replace(/^in /, '')})`;
    }

    if (isAfter(now, date)) {
        return '';
    }

    return '';
}

export function filterEvents(events: CalendarEvent[], showMeetings: boolean, showWorklogs: boolean, showInfo: boolean): CalendarEvent[] {
    if (!showMeetings && !showWorklogs && !showInfo) {
        return [];
    }

    const types: CalendarEntryData['entryType'][] = [];
    if (showWorklogs) types.push(1);
    if (showMeetings) types.push(2);
    if (showInfo) types.push(3);

    if (types.length === 3) {
        return events;
    }

    return events.filter((e) => types.includes(e.data.entryType));
}

export interface WorklogDateGroup {
    date: Date;
    worklogs: WorklogCalendarEntry[];
}

export function groupWorklogsByDate(worklogs: WorklogCalendarEntry[]): WorklogDateGroup[] {
    const grouped = new Map<string, WorklogDateGroup>();

    worklogs.forEach((wl) => {
        const date = startOfDay(new Date(wl.start));
        const dateKey = format(date, 'yyyy-MM-dd');
        let group = grouped.get(dateKey);
        if (!group) {
            group = { date, worklogs: [] };
            grouped.set(dateKey, group);
        }
        group.worklogs.push(wl);
    });

    return Array.from(grouped.values());
}

export function getWorklogsForDate(worklogs: Worklog[], date: Date): Worklog[] {
    return worklogs.filter((wl) => isSameDay(new Date(wl.dateStarted), date));
}

/** Parse a time string like "09:00" into hours as a number */
export function parseTimeToHours(time: string | undefined): number {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h + (m || 0) / 60;
}

export function setTimeOfDay(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours || 0, minutes || 0);
}

export function getEntryTimeFormat(timeFormat: string | undefined): string {
    return (timeFormat || 'HH:mm')
        .replace(/[.:]ss/, '')
        .trim();
}
