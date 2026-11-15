import { addDays, differenceInCalendarDays, isAfter, isBefore, startOfDay } from 'date-fns';

export interface PlanSegment {
    id?: string;
    label?: string;
    start: Date;
    end: Date;
    people: { id: string; allocation: number }[];
}

export interface PlanSource {
    assigneeId: string | null;
    startDate: Date | null;
    dueDate: Date | null;
    segments: PlanSegment[];
}

export interface PlanSpan {
    start: Date;
    end: Date;
    isDerived: boolean;
}

export interface PlanPart extends PlanSpan {
    personId: string;
    weight: number;
    segmentId?: string;
    label?: string;
}

export interface PlanContext {
    isWorkingDay: (personId: string, date: Date) => boolean;
    fallbackRange: { start: Date; end: Date } | null;
    leadTimeDays: number;
    hoursPerDay: number;
    today: Date;
}

export interface PlanDayShare {
    personId: string;
    date: Date;
    share: number;
    part: PlanPart;
    isOverdue: boolean;
}

const daysInWeek = 7;
const defaultHoursPerDay = 8;

function nearestWorkingDay(personId: string, date: Date, direction: 1 | -1, ctx: PlanContext): Date {
    let current = date;
    for (let i = 0; i < daysInWeek; i++) {
        if (ctx.isWorkingDay(personId, current)) {
            return current;
        }
        current = addDays(current, direction);
    }
    return date;
}

function shiftWorkingDays(personId: string, date: Date, count: number, direction: 1 | -1, ctx: PlanContext): Date {
    let current = date;
    let remaining = count;
    const limit = count * daysInWeek + daysInWeek;
    for (let step = 0; remaining > 0 && step < limit; step++) {
        current = addDays(current, direction);
        if (ctx.isWorkingDay(personId, current)) {
            remaining--;
        }
    }
    return remaining > 0 ? addDays(date, count * direction) : current;
}

function getWorkingDays(personId: string, start: Date, end: Date, ctx: PlanContext): Date[] {
    const days: Date[] = [];
    const total = differenceInCalendarDays(end, start);
    for (let offset = 0; offset <= total; offset++) {
        const date = addDays(start, offset);
        if (ctx.isWorkingDay(personId, date)) {
            days.push(date);
        }
    }
    return days;
}

function getLeadDays(hours: number, ctx: PlanContext): number {
    if (ctx.leadTimeDays > 0) {
        return ctx.leadTimeDays;
    }
    const hoursPerDay = ctx.hoursPerDay > 0 ? ctx.hoursPerDay : defaultHoursPerDay;
    return Math.max(1, Math.ceil(hours / hoursPerDay));
}

export function getPlannedSpan(source: Pick<PlanSource, 'startDate' | 'dueDate'>, hours: number, ctx: PlanContext, personId = ''): PlanSpan | null {
    const { startDate, dueDate } = source;
    if (startDate && dueDate) {
        return isAfter(startDate, dueDate) ? { start: dueDate, end: dueDate, isDerived: false } : { start: startDate, end: dueDate, isDerived: false };
    }

    const leadDays = getLeadDays(hours, ctx);
    if (dueDate) {
        const anchor = nearestWorkingDay(personId, dueDate, -1, ctx);
        return { start: shiftWorkingDays(personId, anchor, leadDays - 1, -1, ctx), end: dueDate, isDerived: true };
    }
    if (startDate) {
        const anchor = nearestWorkingDay(personId, startDate, 1, ctx);
        return { start: startDate, end: shiftWorkingDays(personId, anchor, leadDays - 1, 1, ctx), isDerived: true };
    }
    if (ctx.fallbackRange) {
        return { start: ctx.fallbackRange.start, end: ctx.fallbackRange.end, isDerived: true };
    }
    return null;
}

export function getPlanParts(source: PlanSource, hours: number, ctx: PlanContext): PlanPart[] {
    if (source.segments.length) {
        return source.segments.flatMap((segment) =>
            segment.people.map((person) => ({
                personId: person.id,
                start: segment.start,
                end: isBefore(segment.end, segment.start) ? segment.start : segment.end,
                isDerived: false,
                weight: person.allocation / 100,
                segmentId: segment.id,
                label: segment.label,
            })),
        );
    }

    if (!source.assigneeId) {
        return [];
    }
    const span = getPlannedSpan(source, hours, ctx, source.assigneeId);
    return span ? [{ ...span, personId: source.assigneeId, weight: 1 }] : [];
}

function getPartWeights(parts: PlanPart[], ctx: PlanContext): number[] {
    return parts.map((part) => Math.max(1, getWorkingDays(part.personId, part.start, part.end, ctx).length) * part.weight);
}

export function getPersonShares(parts: PlanPart[], ctx: PlanContext): Map<string, number> {
    const weights = getPartWeights(parts, ctx);
    const total = weights.reduce((sum, w) => sum + w, 0);
    const shares = new Map<string, number>();
    if (!total) {
        return shares;
    }
    parts.forEach((part, index) => shares.set(part.personId, (shares.get(part.personId) || 0) + weights[index] / total));
    return shares;
}

export function spreadPlanByDay(parts: PlanPart[], ctx: PlanContext): PlanDayShare[] {
    const weights = getPartWeights(parts, ctx);
    const total = weights.reduce((sum, w) => sum + w, 0);
    if (!total) {
        return [];
    }

    const today = startOfDay(ctx.today);
    const result: PlanDayShare[] = [];
    parts.forEach((part, index) => {
        const partShare = weights[index] / total;
        const isOverdue = isBefore(part.end, today);
        const start = isOverdue ? nearestWorkingDay(part.personId, today, 1, ctx) : isBefore(part.start, today) ? today : part.start;
        const end = isOverdue ? start : part.end;
        const days = getWorkingDays(part.personId, start, end, ctx);
        const targets = days.length ? days : [end];
        const share = partShare / targets.length;
        targets.forEach((date) => result.push({ personId: part.personId, date, share, part, isOverdue }));
    });
    return result;
}
