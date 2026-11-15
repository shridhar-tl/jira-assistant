import { addDays, differenceInCalendarDays, format, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';

import { segmentsFormatVersion } from './constants';
import type { PlannedSegment, SegmentPerson } from './types';

interface LegacySegment {
    startDate?: string;
    endDate?: string;
    resources?: { id?: string; unit?: number }[];
}

interface StoredSegments {
    v: number;
    segments: PlannedSegment[];
}

const dateKeyFormat = 'yyyy-MM-dd';

export function toDateKey(date: Date): string {
    return format(date, dateKeyFormat);
}

export function parseDateKey(value: string): Date {
    return startOfDay(parseISO(value));
}

export function createSegmentId(): string {
    return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function isValidDateKey(value: unknown): value is string {
    return typeof value === 'string' && !Number.isNaN(parseISO(value).getTime());
}

function normalizePeople(people: unknown): SegmentPerson[] {
    if (!Array.isArray(people)) {
        return [];
    }
    return people
        .map((p) => ({
            id: String((p as SegmentPerson)?.id || ''),
            allocation: clampAllocation(Number((p as SegmentPerson)?.allocation ?? 100)),
        }))
        .filter((p) => p.id);
}

export function clampAllocation(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
        return 100;
    }
    return Math.min(100, Math.round(value));
}

function normalizeSegment(segment: PlannedSegment): PlannedSegment | null {
    if (!isValidDateKey(segment?.start) || !isValidDateKey(segment?.end)) {
        return null;
    }
    const start = segment.start.substring(0, 10);
    const end = segment.end.substring(0, 10);
    return {
        id: segment.id || createSegmentId(),
        start: start <= end ? start : end,
        end: start <= end ? end : start,
        label: segment.label || undefined,
        people: normalizePeople(segment.people),
    };
}

function upgradeLegacy(list: LegacySegment[]): PlannedSegment[] {
    return list
        .map((item) =>
            normalizeSegment({
                id: createSegmentId(),
                start: item.startDate || '',
                end: item.endDate || item.startDate || '',
                people: (item.resources || [])
                    .filter((r) => r?.id)
                    .map((r) => ({ id: String(r.id), allocation: clampAllocation(Number(r.unit ?? 100)) })),
            }),
        )
        .filter((s): s is PlannedSegment => !!s);
}

/**
 * Reads the planned segments stored in the issue property.
 * The old planner stored an array of { startDate, endDate, resources: [{ id, unit }] } which is upgraded on read.
 */
export function readSegments(value: unknown): { segments: PlannedSegment[]; isLegacy: boolean } {
    if (Array.isArray(value)) {
        return { segments: sortSegments(upgradeLegacy(value as LegacySegment[])), isLegacy: true };
    }
    const stored = value as StoredSegments | null | undefined;
    if (stored && Array.isArray(stored.segments)) {
        const segments = stored.segments.map(normalizeSegment).filter((s): s is PlannedSegment => !!s);
        return { segments: sortSegments(segments), isLegacy: false };
    }
    return { segments: [], isLegacy: false };
}

export function serializeSegments(segments: PlannedSegment[]): StoredSegments {
    return {
        v: segmentsFormatVersion,
        segments: sortSegments(segments).map(({ id, start, end, label, people }) => ({
            id,
            start,
            end,
            ...(label ? { label } : {}),
            people: people.map(({ id: personId, allocation }) => ({ id: personId, allocation })),
        })),
    };
}

export function sortSegments(segments: PlannedSegment[]): PlannedSegment[] {
    return [...segments].sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
}

export function getSegmentsSpan(segments: PlannedSegment[]): { start: Date; end: Date } | null {
    if (!segments.length) {
        return null;
    }
    let start = parseDateKey(segments[0].start);
    let end = parseDateKey(segments[0].end);
    for (const segment of segments) {
        const s = parseDateKey(segment.start);
        const e = parseDateKey(segment.end);
        if (isBefore(s, start)) start = s;
        if (isAfter(e, end)) end = e;
    }
    return { start, end };
}

export function splitSegment(segment: PlannedSegment, atDate: Date): [PlannedSegment, PlannedSegment] | null {
    const start = parseDateKey(segment.start);
    const end = parseDateKey(segment.end);
    const days = differenceInCalendarDays(end, start);
    if (days < 1) {
        return null;
    }
    let splitAt = startOfDay(atDate);
    if (!isAfter(splitAt, start) || isAfter(splitAt, end)) {
        splitAt = addDays(start, Math.ceil(days / 2));
    }
    return [
        { ...segment, end: toDateKey(addDays(splitAt, -1)) },
        { ...segment, id: createSegmentId(), start: toDateKey(splitAt) },
    ];
}
