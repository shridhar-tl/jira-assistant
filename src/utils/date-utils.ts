import {
    addMinutes,
    addDays as dateFnsAddDays,
    differenceInDays as dateFnsDifferenceInDays,
    format as dateFnsFormat,
    differenceInMinutes,
    endOfDay,
    isValid,
    parseISO,
    startOfDay,
} from 'date-fns';

import { FULL_DAY_NAMES, FULL_MONTH_NAMES, SHORT_DAY_NAMES, SHORT_MONTH_NAMES, TINY_DAY_NAMES } from '../constants/settings';
import { getStartOfWeek } from './helpers';

export { addDays, differenceInDays } from 'date-fns';

export function padNumber(num: number, size = 2): string {
    let s = String(num);
    while (s.length < size) {
        s = `0${s}`;
    }
    return s;
}

export function formatDate(date: Date, formatStr: string): string {
    const yyyy = date.getFullYear();
    const mm = padNumber(date.getMonth() + 1);
    const dd = padNumber(date.getDate());
    const hh = padNumber(date.getHours());
    const min = padNumber(date.getMinutes());
    const ss = padNumber(date.getSeconds());
    const monthIndex = date.getMonth();
    const dayIndex = date.getDay();

    return formatStr
        .replace('yyyy', String(yyyy))
        .replace('yy', String(yyyy))
        .replace('MMMM', FULL_MONTH_NAMES[monthIndex])
        .replace('MMM', SHORT_MONTH_NAMES[monthIndex])
        .replace('MM', mm)
        .replace('DDDD', FULL_DAY_NAMES[dayIndex])
        .replace('DDD', SHORT_DAY_NAMES[dayIndex])
        .replace('dddd', FULL_DAY_NAMES[dayIndex])
        .replace('ddd', SHORT_DAY_NAMES[dayIndex])
        .replace('DD', TINY_DAY_NAMES[dayIndex])
        .replace('dd', dd)
        .replace('HH', hh)
        .replace('H', String(date.getHours()))
        .replace('hh', padNumber(date.getHours() > 12 ? date.getHours() - 12 : date.getHours()))
        .replace('mm', min)
        .replace('ss', ss)
        .replace('tt', date.getHours() >= 12 ? 'PM' : 'AM');
}

/**
 * Check if date is between two dates
 */
export function isBetween(date: Date, fromDate: Date, toDate: Date): boolean {
    const time = date.getTime();
    const from = fromDate.getTime();
    const to = toDate.getTime();
    return from <= time && time <= to;
}

/**
 * Convert date to UTC (adds timezone offset)
 */
export function toUTCDate(date: Date): Date {
    const newDate = new Date(date.getTime());
    newDate.setMinutes(newDate.getMinutes() + date.getTimezoneOffset());
    return newDate;
}

/**
 * Add days to date
 */
export function addDaysToDate(date: Date, days: number): Date {
    return dateFnsAddDays(date, days);
}

/**
 * Format time as HH:MM:SS
 */
export function formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return formatDate(d, 'HH:mm:ss');
}

export function formatTimeFromSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get start of day (00:00:00)
 */
export function getStartOfDay(date: Date): Date {
    return startOfDay(date);
}

/**
 * Get end of day (23:59:59.999)
 */
export function getEndOfDay(date: Date): Date {
    return endOfDay(date);
}

/**
 * Add minutes to date
 */
export function addMinutesToDate(date: Date, minutes: number): Date {
    return addMinutes(date, minutes);
}

/**
 * Get difference in minutes between two dates
 */
export function getDifferenceInMinutes(laterDate: Date, earlierDate: Date): number {
    return differenceInMinutes(laterDate, earlierDate);
}

/**
 * Parse ISO string to date
 */
export function parseISOString(dateString: string): Date {
    return parseISO(dateString);
}

/**
 * Check if date is valid
 */
export function isValidDate(date: any): boolean {
    return date instanceof Date && isValid(date);
}

/**
 * Format date for Jira API (ISO format with timezone)
 */
export function formatDateTimeForJira(date: Date): string {
    const iso = date.toISOString();
    // Remove trailing 'Z' and add +0000
    return iso.replace('Z', '') + '+0000';
}

/**
 * Format time span in HH:MM format
 */
export function formatTimeSpan(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${padNumber(hours, 2)}:${padNumber(minutes, 2)}`;
}

/**
 * Parse time string (HH:MM) to total minutes
 */
export function parseTimeSpan(timeStr: string): number {
    if (!timeStr) return 0;

    const trimmed = timeStr.trim().replace(' ', '0');
    const parts = trimmed.split(':');

    if (parts.length === 2) {
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        return hours * 60 + minutes;
    }

    return 0;
}

/**
 * Parse time string to total seconds
 */
export function parseTimeSpanToSeconds(timeStr: string): number {
    return parseTimeSpan(timeStr) * 60;
}

/**
 * Get total seconds from time span string or object
 */
export function getTotalSecs(timeSpent: string | { timeSpent?: string; overrideTimeSpent?: string }): number {
    if (!timeSpent) return 0;

    let timeStr: string;
    if (typeof timeSpent === 'string') {
        timeStr = timeSpent;
    } else {
        timeStr = timeSpent.overrideTimeSpent || timeSpent.timeSpent || '';
    }

    return parseTimeSpanToSeconds(timeStr);
}

/**
 * Format Jira time span (supports w, d, h, m format like "1w 2d 3h 30m")
 */
export function formatJiraTimeSpan(totalSeconds: number): string {
    if (totalSeconds <= 0) return '0m';

    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
        return `${minutes}m`;
    }

    if (minutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
}

/**
 * Parse Jira-style time span (1w 2d 3h 30m) to seconds
 */
export function parseJiraTimeSpan(value: string | number): number {
    if (!value) return 0;

    if (typeof value === 'number') {
        return Math.round(value * 3600); // Assume hours
    }

    const str = value.toString().trim();

    // Check if it's HH:MM format
    if (/^\d{1,3}:([0-5]\d?|60?)$/.test(str)) {
        const parts = str.split(':');
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        return (hours * 60 + minutes) * 60;
    }

    // Check if it's a plain number (hours)
    if (!isNaN(Number(str))) {
        return Math.round(parseFloat(str) * 3600);
    }

    // Parse Jira format (1w 2d 3h 30m)
    const regex = /^\s*(?:(\d+)w)?\s*(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*$/;
    const match = regex.exec(str);

    if (!match) return 0;

    const weeks = parseInt(match[1], 10) || 0;
    const days = parseInt(match[2], 10) || 0;
    const hours = parseInt(match[3], 10) || 0;
    const minutes = parseInt(match[4], 10) || 0;

    const hoursPerDay = 8;
    const daysPerWeek = 5;

    const totalMinutes = ((weeks * daysPerWeek + days) * hoursPerDay + hours) * 60 + minutes;
    return totalMinutes * 60;
}

/**
 * Format date using date-fns format string
 */
export function format(date: Date, formatStr: string): string {
    return dateFnsFormat(date, formatStr);
}

/**
 * Get difference in days between two dates
 */
export function getDifferenceInDays(laterDate: Date, earlierDate: Date): number {
    return dateFnsDifferenceInDays(laterDate, earlierDate);
}

/**
 * Clone date
 */
export function cloneDate(date: Date): Date {
    return new Date(date.getTime());
}

/**
 * Get array of dates between start and end date (inclusive)
 */
export function getDateArray(startDate: Date, endDate: Date): Date[] {
    const retVal: Date[] = [];
    let current = new Date(startDate);

    while (current <= endDate) {
        retVal.push(new Date(current));
        current = dateFnsAddDays(current, 1);
    }

    return retVal;
}

/**
 * Get date range with additional properties
 */
export interface DateRangeItem {
    prop: string;
    date: Date;
    dispFormat: string;
    month: number;
    week: number;
    dayOfWeek: number;
    day: string;
    dateNum: number;
    isHoliday: boolean;
}

export function getDateRange(fromDate: Date, toDate: Date, isHoliday: (date: Date) => boolean): DateRangeItem[] {
    const datesArr = getDateArray(fromDate, toDate);

    return datesArr.map((d: Date) => ({
        prop: formatDate(d, 'yyyyMMdd'),
        date: d,
        dispFormat: formatDate(d, 'MMM yyyy').toUpperCase(),
        month: d.getMonth(),
        week: getWeekNumber(d),
        dayOfWeek: d.getDay(),
        day: formatDate(d, 'DD').toUpperCase(),
        dateNum: d.getDate(),
        isHoliday: isHoliday(d),
    }));
}

/**
 * Get week number respecting the user's configured start-of-week day.
 * weekStartsOn: 0=Sun, 1=Mon, ..., 6=Sat
 */
export function getWeekNumber(date: Date): number {
    const weekStartsOn = getStartOfWeek(); // 0=Sun, 1=Mon, etc.
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Shift day so that weekStartsOn becomes day 0
    const dayOfWeek = (d.getUTCDay() - weekStartsOn + 7) % 7;
    // Move to the Thursday of the current week (in the shifted calendar)
    d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Calculate working days between two dates
 */
export function getDaysDiffForDateRange(fromDate: Date, toDate: Date, workingDays?: number[]): number {
    // Convert toDate to Date object first (matching moment.js order)
    let toDateMoment = new Date(toDate);

    // Early return when workingDays is undefined or null (but NOT empty array)
    // Note: !workingDays?.length catches undefined, null, AND empty array
    // But the old code only early-returns for undefined/null, empty array triggers allWorking
    if (workingDays === undefined || workingDays === null) {
        const fromDateMoment = new Date(fromDate);
        // Return difference in days with decimals (can be negative if toDate < fromDate)
        return (toDateMoment.getTime() - fromDateMoment.getTime()) / (1000 * 60 * 60 * 24) || 0;
    }

    // Now convert fromDate (matches moment.js conversion order)
    let fromDateMoment = new Date(fromDate);

    // If workingDays is empty array, consider all days as working days
    const allWorking = workingDays.length === 0;

    // If fromDate is after toDate, swap them (mutate the variables like moment.js does)
    if (fromDateMoment.getTime() > toDateMoment.getTime()) {
        [fromDateMoment, toDateMoment] = [toDateMoment, fromDateMoment];
    }

    // Helper function to check if two dates are the same calendar day
    const isSameDay = (date1: Date, date2: Date): boolean => {
        return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
    };

    // Helper function to check if date1 is before date2 (by calendar day)
    const isBeforeDay = (date1: Date, date2: Date): boolean => {
        const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
        const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
        return d1.getTime() < d2.getTime();
    };

    // If both dates are the same day
    if (isSameDay(fromDateMoment, toDateMoment)) {
        if (allWorking || workingDays.includes(fromDateMoment.getDay())) {
            return (toDateMoment.getTime() - fromDateMoment.getTime()) / (1000 * 60 * 60 * 24) || 0;
        } else {
            return 0;
        }
    }

    let totalDays = 0;

    // Clone date to avoid mutating (matching moment.clone() behavior)
    let current = new Date(fromDateMoment);

    // First day (from fromDate to end of the day)
    if (allWorking || workingDays.includes(current.getDay())) {
        // Create end of day without mutating current (unlike moment.endOf which mutates)
        const endOfDay = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59, 999);
        const diff = (endOfDay.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
        totalDays += diff;
    }

    // Move to the start of the next day (matching moment.add(1, 'day').startOf('day'))
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 0, 0);

    // Iterate through full days (matching moment.isBefore(toDate, 'day'))
    while (isBeforeDay(current, toDateMoment)) {
        if (allWorking || workingDays.includes(current.getDay())) {
            totalDays += 1;
        }
        // Move to next day
        current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 0, 0);
    }

    // Last day (from start of the day to toDate)
    if (isSameDay(current, toDateMoment)) {
        if (allWorking || workingDays.includes(current.getDay())) {
            const startOfDay = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, 0, 0);
            const diff = (toDateMoment.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24);
            totalDays += diff;
        }
    }

    return totalDays || 0;
}

interface DateItem {
    month: number;
    week: number;
    dispFormat: string;
    dateNum: number;
    date: Date | string;
}

interface WeekGroup {
    display: string;
    days: number;
    values: DateItem[];
    start: number;
    end: number;
}

export function getWeekGroup(dates: DateItem[]): WeekGroup[] {
    // Group by month_week
    const grouped = dates.reduce(
        (acc, d) => {
            const key = `${d.month}_${d.week}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(d);
            return acc;
        },
        {} as Record<string, DateItem[]>,
    );

    // Map each group to the result format
    return Object.values(grouped).map((values) => {
        const days = values.length;
        let display = '';

        const start = values[0];
        const end = values[days - 1];

        const { week, dispFormat, dateNum: first, date: startDate } = start;
        const { dateNum: last, date: endDate } = end;

        if (days > 4) {
            display = `${dispFormat}, ${first} to ${last} (W-${week})`;
        } else if (days > 3) {
            display = `${dispFormat}, ${first}-${last}`;
        } else if (days > 2) {
            display = `${dispFormat.split(' ')[0]} (W-${week})`;
        } else {
            display = dispFormat.split(' ')[0];
        }

        // Convert dates to timestamps without moment
        const startTimestamp = new Date(startDate);
        startTimestamp.setHours(0, 0, 0, 0);

        const endTimestamp = new Date(endDate);
        endTimestamp.setHours(23, 59, 59, 999);

        return {
            display,
            days,
            values,
            start: startTimestamp.valueOf(),
            end: endTimestamp.valueOf(),
        };
    });
}
