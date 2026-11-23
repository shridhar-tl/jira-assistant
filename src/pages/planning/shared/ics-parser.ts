import { addDays, addMonths, addWeeks, addYears, isAfter } from 'date-fns';

import type { LeaveShowAs, StoredCalendarEvent } from './types';

interface IcsProperty {
    name: string;
    params: Record<string, string>;
    value: string;
}

type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const maxOccurrences = 500;
const busyStatusMap: Record<string, LeaveShowAs> = { OOF: 'oof', BUSY: 'busy', FREE: 'free', TENTATIVE: 'tentative' };

function unfoldLines(text: string): string[] {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\n[ \t]/g, '')
        .split('\n')
        .filter((l) => l.trim());
}

function parseProperty(line: string): IcsProperty | null {
    const colonIndex = line.indexOf(':');
    if (colonIndex < 1) {
        return null;
    }
    const [name, ...paramParts] = line.substring(0, colonIndex).split(';');
    const params: Record<string, string> = {};
    for (const part of paramParts) {
        const [key, value] = part.split('=');
        if (key) {
            params[key.toUpperCase()] = (value || '').replace(/^"|"$/g, '');
        }
    }
    return { name: name.toUpperCase(), params, value: line.substring(colonIndex + 1) };
}

function unescapeText(value: string): string {
    return value.replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();
}

function parseIcsDate(prop: IcsProperty): { date: Date; allDay: boolean } | null {
    const value = prop.value.trim();
    const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
    if (dateOnly || prop.params.VALUE === 'DATE') {
        const m = dateOnly || /^(\d{4})(\d{2})(\d{2})/.exec(value);
        if (!m) {
            return null;
        }
        return { date: new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])), allDay: true };
    }

    const dateTime = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(value);
    if (!dateTime) {
        return null;
    }
    const [, y, mo, d, h, mi, s, utc] = dateTime;
    const date = utc
        ? new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)))
        : new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
    return { date, allDay: false };
}

function parsePerson(prop: IcsProperty): { email?: string; name?: string } {
    const email = prop.value.replace(/^mailto:/i, '').trim() || undefined;
    return { email, name: prop.params.CN || undefined };
}

function parseRule(value: string): { freq: Frequency; interval: number; count: number | null; until: Date | null } | null {
    const parts = Object.fromEntries(
        value.split(';').map((p) => {
            const [k, v] = p.split('=');
            return [k?.toUpperCase(), v];
        }),
    ) as Record<string, string>;
    const freq = parts.FREQ as Frequency;
    if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(freq)) {
        return null;
    }
    const until = parts.UNTIL ? parseIcsDate({ name: 'UNTIL', params: {}, value: parts.UNTIL })?.date || null : null;
    return { freq, interval: Math.max(1, Number(parts.INTERVAL) || 1), count: parts.COUNT ? Number(parts.COUNT) : null, until };
}

function addFrequency(date: Date, freq: Frequency, amount: number): Date {
    switch (freq) {
        case 'DAILY':
            return addDays(date, amount);
        case 'WEEKLY':
            return addWeeks(date, amount);
        case 'MONTHLY':
            return addMonths(date, amount);
        default:
            return addYears(date, amount);
    }
}

/**
 * Parses the events of an .ics file. Recurring events are expanded within the given window for the simple
 * DAILY / WEEKLY / MONTHLY / YEARLY rules (with INTERVAL, COUNT and UNTIL), which covers holiday and leave calendars.
 */
export function parseIcsEvents(text: string, windowStart: Date, windowEnd: Date): StoredCalendarEvent[] {
    const lines = unfoldLines(text);
    const events: StoredCalendarEvent[] = [];
    let current: IcsProperty[] | null = null;

    for (const line of lines) {
        if (line === 'BEGIN:VEVENT') {
            current = [];
            continue;
        }
        if (line === 'END:VEVENT') {
            if (current) {
                events.push(...toEvents(current, windowStart, windowEnd, events.length));
            }
            current = null;
            continue;
        }
        if (current) {
            const prop = parseProperty(line);
            if (prop) {
                current.push(prop);
            }
        }
    }

    return events;
}

function toEvents(props: IcsProperty[], windowStart: Date, windowEnd: Date, offset: number): StoredCalendarEvent[] {
    const get = (name: string) => props.find((p) => p.name === name);
    const startProp = get('DTSTART');
    const start = startProp ? parseIcsDate(startProp) : null;
    if (!start) {
        return [];
    }
    const endProp = get('DTEND');
    const end = endProp ? parseIcsDate(endProp) : null;
    const endDate = end?.date || (start.allDay ? addDays(start.date, 1) : start.date);
    const duration = endDate.getTime() - start.date.getTime();

    const busy = get('X-MICROSOFT-CDO-BUSYSTATUS')?.value.toUpperCase();
    const transparent = get('TRANSP')?.value.toUpperCase() === 'TRANSPARENT';
    const showAs: LeaveShowAs | null = busy ? busyStatusMap[busy] || null : transparent ? 'free' : null;
    const categories = props.filter((p) => p.name === 'CATEGORIES').flatMap((p) => p.value.split(',').map(unescapeText));
    const attendees = props.filter((p) => p.name === 'ATTENDEE').map(parsePerson);
    const organizer = get('ORGANIZER');
    const people = attendees.length ? attendees : organizer ? [parsePerson(organizer)] : [];
    const title = unescapeText(get('SUMMARY')?.value || '');
    const uid = get('UID')?.value || `ics-${offset}`;

    const base = { title, allDay: start.allDay, showAs, categories, people };
    const occurrences: Date[] = [start.date];
    const ruleProp = get('RRULE');
    const rule = ruleProp ? parseRule(ruleProp.value) : null;
    if (rule) {
        for (let i = 1; i < maxOccurrences; i++) {
            const next = addFrequency(start.date, rule.freq, rule.interval * i);
            if ((rule.count !== null && i >= rule.count) || (rule.until && isAfter(next, rule.until)) || isAfter(next, windowEnd)) {
                break;
            }
            occurrences.push(next);
        }
    }

    return occurrences
        .map((occurrence, index) => ({
            ...base,
            id: index ? `${uid}-${index}` : uid,
            start: occurrence.toISOString(),
            end: new Date(occurrence.getTime() + duration).toISOString(),
        }))
        .filter((e) => new Date(e.end) >= windowStart && new Date(e.start) <= windowEnd);
}
