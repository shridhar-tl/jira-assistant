import { addDays, format, isValid, parseISO, startOfDay, startOfYear, subDays, subMonths, subYears } from 'date-fns';

import type { QuickDateRange } from '@/controls';

import type { TimeInStatusDateRange } from './types';

export const allTimeRangeKey = 'all_time';

export const defaultDateRange: TimeInStatusDateRange = { quickDate: 'last_90_days', fromDate: null, toDate: null };

export const allTimeDateRange: TimeInStatusDateRange = { quickDate: allTimeRangeKey, fromDate: null, toDate: null };

const storedDateFormat = 'yyyy-MM-dd';
const allTimeYears = 30;

export interface ResolvedDateRange {
    fromDate: Date | null;
    toDate: Date | null;
}

export interface PickerRangeValue {
    fromDate: Date;
    toDate: Date;
    quickDate?: string;
}

export function buildDateRangePresets(now: Date = new Date()): QuickDateRange[] {
    const today = startOfDay(now);
    return [
        { value: 'last_30_days', label: 'Last 30 days', range: [subDays(today, 29), now] },
        { value: 'last_90_days', label: 'Last 90 days', range: [subDays(today, 89), now] },
        { value: 'last_6_months', label: 'Last 6 months', range: [subMonths(today, 6), now] },
        { value: 'last_12_months', label: 'Last 12 months', range: [subMonths(today, 12), now] },
        { value: 'this_year', label: 'This year', range: [startOfYear(now), now] },
        { value: allTimeRangeKey, label: 'All time', range: [subYears(today, allTimeYears), now] },
    ];
}

function parseStoredDate(value: string | null | undefined): Date | null {
    if (!value) {
        return null;
    }
    const date = parseISO(value);
    return isValid(date) ? date : null;
}

export function toStoredDate(date: Date): string {
    return format(date, storedDateFormat);
}

function isPreset(quickDate: string | null | undefined): quickDate is string {
    return !!quickDate && buildDateRangePresets().some((p) => p.value === quickDate);
}

export function normalizeDateRange(value: Partial<TimeInStatusDateRange> | null | undefined): TimeInStatusDateRange {
    if (!value) {
        return defaultDateRange;
    }
    if (isPreset(value.quickDate)) {
        return { quickDate: value.quickDate, fromDate: null, toDate: null };
    }
    const fromDate = parseStoredDate(value.fromDate);
    const toDate = parseStoredDate(value.toDate);
    if (fromDate && toDate && fromDate <= toDate) {
        return { quickDate: null, fromDate: toStoredDate(fromDate), toDate: toStoredDate(toDate) };
    }
    return defaultDateRange;
}

export function fromPickerSelection(range: string | number | undefined, dates: [Date, Date]): TimeInStatusDateRange {
    const quickDate = typeof range === 'string' ? range : null;
    if (isPreset(quickDate)) {
        return { quickDate, fromDate: null, toDate: null };
    }
    return normalizeDateRange({ quickDate: null, fromDate: toStoredDate(dates[0]), toDate: toStoredDate(dates[1]) });
}

/**
 * Returns the dates to filter the issues with. Null means there is no limit on that side.
 * Relative ranges are resolved every time so that they move along with the current date.
 */
export function resolveDateRange(value: TimeInStatusDateRange): ResolvedDateRange {
    if (value.quickDate === allTimeRangeKey) {
        return { fromDate: null, toDate: null };
    }
    const preset = value.quickDate ? buildDateRangePresets().find((p) => p.value === value.quickDate) : undefined;
    if (preset) {
        return { fromDate: startOfDay(preset.range[0]), toDate: null };
    }
    return { fromDate: parseStoredDate(value.fromDate), toDate: parseStoredDate(value.toDate) };
}

export function getDateRangeKey(value: TimeInStatusDateRange): string {
    const { fromDate, toDate } = resolveDateRange(value);
    return `${fromDate ? toStoredDate(fromDate) : ''}~${toDate ? toStoredDate(toDate) : ''}`;
}

export function getPickerValue(value: TimeInStatusDateRange): PickerRangeValue {
    const preset = buildDateRangePresets().find((p) => p.value === value.quickDate);
    if (preset) {
        return { fromDate: preset.range[0], toDate: preset.range[1], quickDate: preset.value };
    }
    const { fromDate, toDate } = resolveDateRange(value);
    const fallback = buildDateRangePresets()[1].range;
    return { fromDate: fromDate ?? fallback[0], toDate: toDate ?? fallback[1] };
}

/**
 * Includes the issues which were open at any time within the range.
 * Issues in a done status without resolution are considered resolved on their last update.
 */
export function getDateRangeJql(value: TimeInStatusDateRange): string | null {
    const { fromDate, toDate } = resolveDateRange(value);
    const parts: string[] = [];

    if (toDate) {
        parts.push(`created < "${toStoredDate(addDays(toDate, 1))}"`);
    }
    if (fromDate) {
        const since = `"${toStoredDate(fromDate)}"`;
        parts.push(`(statusCategory != Done OR resolved >= ${since} OR (resolution is EMPTY AND updated >= ${since}))`);
    }

    return parts.length ? parts.join(' AND ') : null;
}
