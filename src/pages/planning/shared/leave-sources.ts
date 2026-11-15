import { addDays, endOfDay, isAfter, isBefore, max as maxDate, min as minDate, startOfDay, subMilliseconds } from 'date-fns';

import type { CalendarInfo, CalendarLeaveEvent } from '@types';

import { inject } from '@services';

import { getCached } from './cache';
import { createLeaveId, maxLeaveTitleLength } from './leave-records';
import { toDateKey } from './segments';
import type { LeaveEntry, LeaveRules, LeaveSourceConfig, StoredCalendarEvent, TeamDefinition, TeamMember, UnmappedLeave } from './types';

export interface CalendarLeaveResult {
    live: Record<string, LeaveEntry[]>;
    unmapped: UnmappedLeave[];
    errors: { sourceName: string; message: string }[];
}

interface ConfluenceEvent {
    id?: string;
    title?: string;
    allDay?: boolean;
    start: string;
    end: string;
    eventType?: string;
    invitees?: { id?: string; name?: string; displayName?: string; email?: string }[];
}

const calendarCacheMinutes = 30;
const millisecondsPerHour = 3600000;

function parseTime(value: string | undefined, fallback: number): number {
    const match = /^(\d{1,2}):(\d{2})/.exec(value || '');
    return match ? Number(match[1]) * 60 + Number(match[2]) : fallback;
}

function getWorkWindow(): { startMinutes: number; endMinutes: number } {
    const { $session } = inject('SessionService');
    const user = $session.CurrentUser;
    return { startMinutes: parseTime(user?.startOfDay, 9 * 60), endMinutes: parseTime(user?.endOfDay, 18 * 60) };
}

export function matchesLeaveRules(event: Pick<CalendarLeaveEvent, 'title' | 'categories' | 'showAs' | 'allDay'>, rules: LeaveRules): boolean {
    if (rules.allDayOnly && !event.allDay) {
        return false;
    }

    const keywords = rules.keywords.map((k) => k.trim().toLowerCase()).filter(Boolean);
    const showAs = rules.showAs.filter((s) => s !== 'any');
    if (!keywords.length && !showAs.length) {
        return true;
    }

    const text = `${event.title} ${event.categories.join(' ')}`.toLowerCase();
    const keywordMatch = keywords.some((k) => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text));
    const showAsMatch = !!event.showAs && showAs.includes(event.showAs);
    return keywordMatch || showAsMatch;
}

function toLeaveDays(event: Pick<CalendarLeaveEvent, 'start' | 'end' | 'allDay'>, hoursPerDay: number): { start: string; end: string; hours: number | null }[] {
    if (event.allDay) {
        const lastDay = subMilliseconds(event.end, 1);
        return [{ start: toDateKey(event.start), end: toDateKey(isBefore(lastDay, event.start) ? event.start : lastDay), hours: null }];
    }

    const { startMinutes, endMinutes } = getWorkWindow();
    const days: { start: string; end: string; hours: number | null }[] = [];
    let day = startOfDay(event.start);
    let guard = 0;
    while (!isAfter(day, event.end) && guard++ < 400) {
        const workStart = new Date(day.getTime() + startMinutes * 60000);
        const workEnd = new Date(day.getTime() + endMinutes * 60000);
        const overlapStart = maxDate([event.start, workStart]);
        const overlapEnd = minDate([event.end, workEnd, endOfDay(day)]);
        const hours = (overlapEnd.getTime() - overlapStart.getTime()) / millisecondsPerHour;
        if (hours > 0) {
            const key = toDateKey(day);
            days.push({ start: key, end: key, hours: hours >= hoursPerDay ? null : Math.round(hours * 10) / 10 });
        }
        day = addDays(day, 1);
    }
    return days;
}

function normalizeKey(value?: string): string {
    return (value || '').trim().toLowerCase();
}

export function createPersonResolver(team: TeamDefinition, members: TeamMember[]) {
    const { $session } = inject('SessionService');
    const currentUser = $session.CurrentUser;
    const mapping = new Map(Object.entries(team.userMapping).map(([k, v]) => [normalizeKey(k), v]));
    const byEmail = new Map(members.filter((m) => m.email).map((m) => [normalizeKey(m.email), m.id]));
    const byName = new Map(members.map((m) => [normalizeKey(m.displayName), m.id]));
    const byId = new Set(members.map((m) => m.id));
    const currentEmail = normalizeKey(currentUser?.emailAddress);
    const currentId = currentUser?.accountId || currentUser?.name;

    return (person: { email?: string; name?: string; id?: string }): string | null => {
        const email = normalizeKey(person.email);
        const name = normalizeKey(person.name);
        const id = person.id || '';
        return (
            (email && mapping.get(email)) ||
            (name && mapping.get(name)) ||
            (email && byEmail.get(email)) ||
            (id && byId.has(id) ? id : null) ||
            (email && email === currentEmail && currentId ? currentId : null) ||
            (name && byName.get(name)) ||
            null
        );
    };
}

function fromStored(event: StoredCalendarEvent): CalendarLeaveEvent {
    return { ...event, start: new Date(event.start), end: new Date(event.end), showAs: event.showAs === 'any' ? null : event.showAs };
}

function toStored(event: CalendarLeaveEvent): StoredCalendarEvent {
    return { ...event, start: event.start.toISOString(), end: event.end.toISOString() };
}

async function fetchConfluenceEvents(source: LeaveSourceConfig, start: Date, end: Date): Promise<CalendarLeaveEvent[]> {
    const { $ajax } = inject('AjaxService');
    const baseUrl = (source.url || '').replace(/\/$/, '');
    const url = `${baseUrl}/rest/calendar-services/1.0/calendar/events.json?subCalendarId=${encodeURIComponent(source.calendarId)}&start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}&userTimeZoneId=UTC`;
    const result = await $ajax.get<{ events?: ConfluenceEvent[] }>(url);

    return (result.events || []).map((e, index) => ({
        id: e.id || `${source.calendarId}-${index}`,
        title: e.title || '',
        start: new Date(e.start),
        end: new Date(e.end),
        allDay: !!e.allDay,
        showAs: null,
        categories: e.eventType ? [e.eventType] : [],
        people: (e.invitees || []).map((i) => ({ id: i.name || i.id?.split('/').pop(), name: i.displayName, email: i.email })),
    }));
}

export async function getConfluenceCalendars(baseUrl: string): Promise<CalendarInfo[]> {
    const { $ajax } = inject('AjaxService');
    const url = `${baseUrl.replace(/\/$/, '')}/rest/calendar-services/1.0/calendar/subcalendars.json?calendarContext=myCalendars`;
    const result = await $ajax.get<{ payload?: { subCalendar?: { id: string; name: string } }[] }>(url);
    return (result.payload || []).map((p) => p.subCalendar).filter((c): c is { id: string; name: string } => !!c).map(({ id, name }) => ({ id, name }));
}

export async function getSourceCalendars(type: LeaveSourceConfig['type'], url?: string): Promise<CalendarInfo[]> {
    if (type === 'outlook') {
        const { $outlook } = inject('OutlookService');
        return $outlook.getCalendarList();
    }
    if (type === 'google') {
        const { $calendar } = inject('CalendarService');
        return $calendar.getCalendarList();
    }
    if (type === 'confluence' && url) {
        return getConfluenceCalendars(url);
    }
    return [];
}

async function fetchSourceEvents(source: LeaveSourceConfig, start: Date, end: Date, force?: boolean): Promise<CalendarLeaveEvent[]> {
    const cacheKey = `calendar_${source.type}_${source.calendarId}_${toDateKey(start)}_${toDateKey(end)}`;
    const events = await getCached(
        cacheKey,
        calendarCacheMinutes,
        async () => {
            let result: CalendarLeaveEvent[] = [];
            if (source.type === 'outlook') {
                const { $outlook } = inject('OutlookService');
                result = await $outlook.getLeaveEvents(source.calendarId, start, end);
            } else if (source.type === 'google') {
                const { $calendar } = inject('CalendarService');
                result = await $calendar.getLeaveEvents(source.calendarId, start, end);
            } else if (source.type === 'confluence') {
                result = await fetchConfluenceEvents(source, start, end);
            }
            return result.map(toStored);
        },
        force,
    );
    return events.map(fromStored);
}

export function resolveCalendarLeave(
    source: LeaveSourceConfig,
    events: CalendarLeaveEvent[],
    team: TeamDefinition,
    resolvePerson: (person: { email?: string; name?: string; id?: string }) => string | null,
): { entries: LeaveEntry[]; unmapped: UnmappedLeave[] } {
    const entries: LeaveEntry[] = [];
    const unmapped: UnmappedLeave[] = [];

    for (const event of events.filter((e) => matchesLeaveRules(e, source.rules))) {
        const days = toLeaveDays(event, team.defaults.hoursPerDay);
        const title = (event.title || source.name).substring(0, maxLeaveTitleLength);

        if (source.kind === 'holiday') {
            for (const day of days) {
                entries.push({
                    id: createLeaveId('c', source.id, event.id, '*', day.start),
                    memberId: null,
                    memberIds: source.memberIds?.length ? source.memberIds : undefined,
                    start: day.start,
                    end: day.end,
                    hours: day.hours,
                    title,
                    source: source.type,
                    sourceId: source.id,
                });
            }
            continue;
        }

        for (const person of event.people) {
            const memberId = resolvePerson(person);
            if (!memberId) {
                if (days.length) {
                    unmapped.push({
                        sourceName: source.name,
                        person: person.email || person.name || person.id || 'Unknown',
                        start: days[0].start,
                        end: days[days.length - 1].end,
                        title: event.title,
                    });
                }
                continue;
            }
            for (const day of days) {
                entries.push({
                    id: createLeaveId('c', source.id, event.id, memberId, day.start),
                    memberId,
                    start: day.start,
                    end: day.end,
                    hours: day.hours,
                    title,
                    source: source.type,
                    sourceId: source.id,
                });
            }
        }
    }

    return { entries, unmapped };
}

export function readIcsLeave(source: LeaveSourceConfig, events: StoredCalendarEvent[], team: TeamDefinition, members: TeamMember[]) {
    return resolveCalendarLeave(source, events.map(fromStored), team, createPersonResolver(team, members));
}

function canReadLive(source: LeaveSourceConfig, isSourceAvailable: (source: LeaveSourceConfig) => boolean): boolean {
    return source.type !== 'ics' && !!source.calendarId && isSourceAvailable(source);
}

export async function loadCalendarLeave(
    team: TeamDefinition,
    members: TeamMember[],
    start: Date,
    end: Date,
    isSourceAvailable: (source: LeaveSourceConfig) => boolean,
    force?: boolean,
): Promise<CalendarLeaveResult> {
    const resolvePerson = createPersonResolver(team, members);
    const result: CalendarLeaveResult = { live: {}, unmapped: [], errors: [] };

    await Promise.all(
        team.leaveSources
            .filter((source) => canReadLive(source, isSourceAvailable))
            .map(async (source) => {
                try {
                    const events = await fetchSourceEvents(source, start, end, force);
                    const resolved = resolveCalendarLeave(source, events, team, resolvePerson);
                    result.live[source.id] = resolved.entries;
                    result.unmapped.push(...resolved.unmapped);
                } catch (err) {
                    result.errors.push({ sourceName: source.name, message: (err as Error)?.message || 'Unable to read the calendar' });
                }
            }),
    );

    return result;
}