import type { LeaveEntry, LeaveSourceType } from './types';

export const leaveRetentionDays = 400;
export const leaveFutureDays = 1100;
export const maxLeaveEntriesPerRequest = 500;
export const maxLeaveTitleLength = 80;

const millisecondsPerDay = 86400000;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const idPattern = /^[A-Za-z0-9_.:-]{1,80}$/;
const personPattern = /^[^\p{Cc}]{1,128}$/u;
const maxMemberIds = 200;
const sourceTypes = new Set<LeaveSourceType>(['manual', 'outlook', 'google', 'ics', 'confluence']);

export function isDateKey(value: unknown): value is string {
    const time = typeof value === 'string' && datePattern.test(value) ? Date.parse(`${value}T00:00:00Z`) : NaN;
    return !Number.isNaN(time) && new Date(time).toISOString().startsWith(value as string);
}

export function isLeaveId(value: unknown): value is string {
    return typeof value === 'string' && idPattern.test(value);
}

export function addDaysToKey(key: string, days: number): string {
    return new Date(Date.parse(`${key}T00:00:00Z`) + days * millisecondsPerDay).toISOString().substring(0, 10);
}

export function getTodayKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getLeaveRetentionStart(): string {
    return addDaysToKey(getTodayKey(), -leaveRetentionDays);
}

function getLeaveFutureLimit(): string {
    return addDaysToKey(getTodayKey(), leaveFutureDays);
}

export function overlapsRange(entry: Pick<LeaveEntry, 'start' | 'end'>, start: string, end: string): boolean {
    return entry.start <= end && entry.end >= start;
}

function isPerson(value: unknown): value is string {
    return typeof value === 'string' && personPattern.test(value);
}

export function sanitizeLeaveEntry(value: unknown): LeaveEntry | null {
    if (!value || typeof value !== 'object') {
        return null;
    }
    const raw = value as Record<string, unknown>;
    const source = raw.source as LeaveSourceType;
    if (!isLeaveId(raw.id) || !isDateKey(raw.start) || !isDateKey(raw.end) || raw.start > raw.end || !sourceTypes.has(source)) {
        return null;
    }
    if (raw.end < getLeaveRetentionStart() || raw.start > getLeaveFutureLimit()) {
        return null;
    }
    const memberId = raw.memberId === null || raw.memberId === undefined ? null : isPerson(raw.memberId) ? raw.memberId : undefined;
    if (memberId === undefined) {
        return null;
    }
    const hours = raw.hours === null || raw.hours === undefined ? null : Number(raw.hours);
    if (hours !== null && !(Number.isFinite(hours) && hours > 0 && hours <= 24)) {
        return null;
    }
    const sourceId = source === 'manual' ? undefined : isLeaveId(raw.sourceId) ? raw.sourceId : null;
    if (sourceId === null) {
        return null;
    }
    const memberIds = Array.isArray(raw.memberIds) ? raw.memberIds.filter(isPerson).slice(0, maxMemberIds) : [];

    const entry: LeaveEntry = {
        id: raw.id,
        memberId,
        start: raw.start,
        end: raw.end,
        hours: hours === null ? null : Math.round(hours * 100) / 100,
        title: typeof raw.title === 'string' ? raw.title.trim().substring(0, maxLeaveTitleLength) : '',
        source,
    };
    if (sourceId) {
        entry.sourceId = sourceId;
    }
    if (!memberId && memberIds.length) {
        entry.memberIds = memberIds;
    }
    return entry;
}

export function isSameLeave(a: LeaveEntry, b: LeaveEntry): boolean {
    return (
        a.id === b.id &&
        a.memberId === b.memberId &&
        a.start === b.start &&
        a.end === b.end &&
        a.hours === b.hours &&
        a.title === b.title &&
        a.source === b.source &&
        (a.sourceId || '') === (b.sourceId || '') &&
        (a.memberIds || []).join(',') === (b.memberIds || []).join(',')
    );
}

export function isSameLeaveSet(a: LeaveEntry[], b: LeaveEntry[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    const byId = new Map(a.map((e) => [e.id, e]));
    return b.every((e) => {
        const other = byId.get(e.id);
        return !!other && isSameLeave(other, e);
    });
}

export function createLeaveId(prefix: string, ...parts: string[]): string {
    let hash = 0x811c9dc5;
    let second = 0x01000193;
    for (const char of parts.join('|')) {
        const code = char.charCodeAt(0);
        hash = Math.imul(hash ^ code, 0x01000193) >>> 0;
        second = Math.imul(second ^ code, 0x5bd1e995) >>> 0;
    }
    return `${prefix}${hash.toString(36)}${second.toString(36)}`;
}
