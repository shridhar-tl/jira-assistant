import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';

import type { WorkingTimeSettings } from './types';

export const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const msPerMinute = 60 * 1000;
const msPerDay = 24 * 60 * msPerMinute;

export function parseTimeToMinutes(value: string): number {
    const match = timePattern.exec(value);
    return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

export interface DurationCalculator {
    measure: (start: number, end: number) => number;
    dayLength: number;
}

interface WorkingTimeConfig {
    workingDays: Set<number>;
    dayStartMinutes: number;
    dayEndMinutes: number;
}

function getDayWindow(day: Date, config: WorkingTimeConfig): [number, number] | null {
    if (!config.workingDays.has(day.getDay())) {
        return null;
    }
    const base = day.getTime();
    // Using setHours keeps the window correct across daylight saving changes
    const windowStart = new Date(base).setHours(0, config.dayStartMinutes, 0, 0);
    const windowEnd = new Date(base).setHours(0, config.dayEndMinutes, 0, 0);
    return [windowStart, windowEnd];
}

function getOverlap(day: Date, start: number, end: number, config: WorkingTimeConfig): number {
    const window = getDayWindow(day, config);
    if (!window) {
        return 0;
    }
    return Math.max(0, Math.min(end, window[1]) - Math.max(start, window[0]));
}

function countWorkingDays(fromDay: Date, dayCount: number, workingDays: Set<number>): number {
    if (dayCount <= 0) {
        return 0;
    }
    const fullWeeks = Math.floor(dayCount / 7);
    let result = fullWeeks * workingDays.size;
    const firstDayOfRemainder = (fromDay.getDay() + fullWeeks * 7) % 7;
    for (let i = 0; i < dayCount % 7; i++) {
        if (workingDays.has((firstDayOfRemainder + i) % 7)) {
            result++;
        }
    }
    return result;
}

function measureWorkingTime(start: number, end: number, config: WorkingTimeConfig, dayLength: number): number {
    if (end <= start) {
        return 0;
    }

    const firstDay = startOfDay(start);
    const lastDay = startOfDay(end);
    const daysBetween = differenceInCalendarDays(lastDay, firstDay);

    if (daysBetween === 0) {
        return getOverlap(firstDay, start, end, config);
    }

    const firstDayTime = getOverlap(firstDay, start, end, config);
    const lastDayTime = getOverlap(lastDay, start, end, config);
    const fullDays = countWorkingDays(addDays(firstDay, 1), daysBetween - 1, config.workingDays);

    return firstDayTime + fullDays * dayLength + lastDayTime;
}

/**
 * Creates the calculator used for all the durations. When working time is not provided, calendar time is measured.
 */
export function createDurationCalculator(workingTime: WorkingTimeSettings | null): DurationCalculator {
    if (!workingTime) {
        return { measure: (start, end) => Math.max(0, end - start), dayLength: msPerDay };
    }

    const config: WorkingTimeConfig = {
        workingDays: new Set(workingTime.workingDays),
        dayStartMinutes: parseTimeToMinutes(workingTime.dayStart),
        dayEndMinutes: parseTimeToMinutes(workingTime.dayEnd),
    };
    const dayLength = Math.max(msPerMinute, (config.dayEndMinutes - config.dayStartMinutes) * msPerMinute);

    return { measure: (start, end) => measureWorkingTime(start, end, config, dayLength), dayLength };
}
