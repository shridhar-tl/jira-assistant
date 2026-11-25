import { addDays, format, isAfter, startOfDay } from 'date-fns';

import type { Worklog } from '@types';

import { getTimeSpentInSeconds, setTimeOfDay } from '../calendar-utils';
import type { WorklogSuggestion } from '../types';

import type { ActivityInterval, IssueActivity } from './activity-loader';

export interface BusyEntry {
    start: Date;
    end: Date;
    worklog?: Worklog;
}

export interface SuggestionOptions {
    rangeStart: Date;
    rangeEnd: Date;
    startOfDay: string;
    endOfDay: string;
    workingDays: number[];
    targetHours: number;
    dismissed: Set<string>;
}

const slotMs = 15 * 60 * 1000;
const slotSecs = slotMs / 1000;

const getSuggestionId = (dateKey: string, issueKey: string) => `${dateKey}|${issueKey}`;

function overlapMs(intervals: ActivityInterval[], from: number, to: number): number {
    return intervals.reduce((sum, i) => sum + Math.max(0, Math.min(i.end, to) - Math.max(i.start, from)), 0);
}

function getFreeSlots(busy: BusyEntry[], from: number, to: number): ActivityInterval[] {
    const sorted = busy.map((b) => ({ start: b.start.getTime(), end: b.end.getTime() })).sort((a, b) => a.start - b.start);
    const free: ActivityInterval[] = [];
    let cursor = from;

    for (const b of sorted) {
        if (b.start > cursor) {
            free.push({ start: cursor, end: Math.min(b.start, to) });
        }
        cursor = Math.max(cursor, b.end);
        if (cursor >= to) {
            break;
        }
    }
    if (cursor < to) {
        free.push({ start: cursor, end: to });
    }

    return free.filter((f) => f.end - f.start >= slotMs);
}

function reserve(free: ActivityInterval[], start: number, end: number): void {
    const next = free.flatMap((f) =>
        f.end <= start || f.start >= end
            ? [f]
            : [...(f.start < start ? [{ start: f.start, end: start }] : []), ...(f.end > end ? [{ start: end, end: f.end }] : [])],
    );
    free.splice(0, free.length, ...next);
}

function roomAfter(free: ActivityInterval[], at: number): number {
    const slot = free.find((f) => f.start <= at && f.end > at);
    return slot ? Math.floor((slot.end - at) / slotMs) * slotMs : 0;
}

function placeChunks(free: ActivityInterval[], durationMs: number, from: number): ActivityInterval[] {
    const ordered = [...free.filter((f) => f.end > from), ...free.filter((f) => f.end <= from)];
    const chunks: ActivityInterval[] = [];
    let remaining = durationMs;

    for (const f of ordered) {
        const start = Math.max(f.start, f.end > from ? from : f.start);
        const length = Math.min(Math.floor((f.end - start) / slotMs) * slotMs, remaining);
        if (length >= slotMs) {
            chunks.push({ start, end: start + length });
            remaining -= length;
        }
        if (remaining < slotMs) {
            break;
        }
    }
    chunks.forEach((c) => reserve(free, c.start, c.end));
    return chunks;
}

const lastActiveSince = (activity: IssueActivity) => Math.max(...activity.intervals.map((i) => i.start));

function allocateSlots<T extends { gapSecs: number; activity: IssueActivity; issueWorklogs: Worklog[] }>(candidates: T[], units: number): (T & { secs: number })[] {
    const totalGapSecs = candidates.reduce((sum, c) => sum + c.gapSecs, 0);
    const scale = Math.min(1, (units * slotSecs) / totalGapSecs);
    const shares = candidates.map((c) => {
        const exact = (c.gapSecs * scale) / slotSecs;
        return { candidate: c, units: Math.floor(exact), fraction: exact - Math.floor(exact), maxUnits: Math.floor(c.gapSecs / slotSecs) };
    });

    let leftover = units - shares.reduce((sum, s) => sum + s.units, 0);
    [...shares]
        .sort(
            (a, b) =>
                Number(!!b.candidate.issueWorklogs.length) - Number(!!a.candidate.issueWorklogs.length) ||
                b.fraction - a.fraction ||
                lastActiveSince(b.candidate.activity) - lastActiveSince(a.candidate.activity) ||
                a.candidate.activity.key.localeCompare(b.candidate.activity.key),
        )
        .forEach((s) => {
            if (leftover > 0 && s.units < s.maxUnits) {
                s.units++;
                leftover--;
            }
        });

    return shares.map((s) => ({ ...s.candidate, secs: s.units * slotSecs }));
}

function suggestForDay(day: Date, activities: IssueActivity[], dayBusy: BusyEntry[], options: SuggestionOptions, now: number): WorklogSuggestion[] {
    const dateKey = format(day, 'yyyy-MM-dd');
    const workStart = setTimeOfDay(day, options.startOfDay).getTime();
    const workEnd = Math.min(setTimeOfDay(day, options.endOfDay).getTime(), now);
    if (workEnd <= workStart) {
        return [];
    }

    const dayWorklogs = dayBusy.filter((b) => b.worklog).map((b) => b.worklog!);
    const loggedSecs = dayWorklogs.reduce((sum, wl) => sum + getTimeSpentInSeconds(wl.timeSpent), 0);
    const free = getFreeSlots(dayBusy, workStart, workEnd);
    const freeSecs = free.reduce((sum, f) => sum + f.end - f.start, 0) / 1000;
    const remainingSecs = Math.min(options.targetHours * 3600 - loggedSecs, freeSecs);
    if (remainingSecs < slotSecs) {
        return [];
    }

    const candidates = activities
        .filter((a) => !options.dismissed.has(getSuggestionId(dateKey, a.key)))
        .map((activity) => {
            const issueWorklogs = dayWorklogs.filter((wl) => wl.ticketNo?.toUpperCase() === activity.key);
            const issueLoggedSecs = issueWorklogs.reduce((sum, wl) => sum + getTimeSpentInSeconds(wl.timeSpent), 0);
            const activeSecs = overlapMs(activity.intervals, workStart, workEnd) / 1000;
            const firstActive = Math.max(workStart, activity.intervals.find((i) => i.end > workStart && i.start < workEnd)?.start ?? workEnd);
            return { activity, issueWorklogs, issueLoggedSecs, gapSecs: activeSecs - issueLoggedSecs, firstActive };
        })
        .filter((c) => c.gapSecs >= slotSecs);

    const sized = allocateSlots(candidates, Math.floor(remainingSecs / slotSecs)).filter((c) => c.secs >= slotSecs);
    const toSuggestion = (candidate: (typeof sized)[number], start: number, end: number, targetWorklog?: Worklog): WorklogSuggestion => ({
        id: `${getSuggestionId(dateKey, candidate.activity.key)}|${start}`,
        dismissKey: getSuggestionId(dateKey, candidate.activity.key),
        dateKey,
        issueKey: candidate.activity.key,
        summary: candidate.activity.summary,
        start: new Date(start),
        end: new Date(end),
        timeSpentSecs: (end - start) / 1000,
        targetWorklog,
        reason: {
            activeRanges: candidate.activity.intervals
                .filter((i) => i.end > workStart && i.start < workEnd)
                .map((i) => ({ start: new Date(Math.max(i.start, workStart)), end: new Date(Math.min(i.end, workEnd)) })),
            issueLoggedSecs: candidate.issueLoggedSecs,
            dayLoggedSecs: loggedSecs,
            targetSecs: options.targetHours * 3600,
            ticketCount: candidates.length,
        },
    });

    const extensions = sized.map((c) => {
        const targets = dayBusy
            .filter((b) => b.worklog && c.issueWorklogs.includes(b.worklog))
            .map((b) => ({ worklog: b.worklog!, end: b.end.getTime(), room: Math.min(roomAfter(free, b.end.getTime()), c.secs * 1000) }))
            .sort((a, b) => b.room - a.room || getTimeSpentInSeconds(b.worklog.timeSpent) - getTimeSpentInSeconds(a.worklog.timeSpent));
        const target = targets[0];
        if (!target || target.room < slotMs) {
            return { candidate: c, extension: undefined, remainingMs: c.secs * 1000 };
        }
        reserve(free, target.end, target.end + target.room);
        return { candidate: c, extension: toSuggestion(c, target.end, target.end + target.room, target.worklog), remainingMs: c.secs * 1000 - target.room };
    });

    return extensions
        .flatMap(({ candidate, extension, remainingMs }) => {
            const from = workStart + Math.ceil((candidate.firstActive - workStart) / slotMs) * slotMs;
            const chunks = remainingMs >= slotMs ? placeChunks(free, remainingMs, from) : [];
            return [...(extension ? [extension] : []), ...chunks.map((chunk) => toSuggestion(candidate, chunk.start, chunk.end))];
        })
        .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function computeSuggestions(activities: IssueActivity[], busy: BusyEntry[], options: SuggestionOptions): WorklogSuggestion[] {
    if (!activities.length) {
        return [];
    }

    const now = Date.now();
    const lastDay = startOfDay(Math.min(options.rangeEnd.getTime(), now));
    const suggestions: WorklogSuggestion[] = [];

    for (let day = startOfDay(options.rangeStart); !isAfter(day, lastDay); day = addDays(day, 1)) {
        if (!options.workingDays.includes(day.getDay())) {
            continue;
        }
        const dayStart = day.getTime();
        const dayEnd = addDays(day, 1).getTime();
        const dayBusy = busy.filter((b) => b.start.getTime() >= dayStart && b.start.getTime() < dayEnd);
        suggestions.push(...suggestForDay(day, activities, dayBusy, options, now));
    }

    return suggestions;
}
