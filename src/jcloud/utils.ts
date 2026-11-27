import { parseISO } from 'date-fns';

import { resolveDateRange, type DateRangeValue } from '@/controls/DateRangePicker';

interface DateRangeInput {
    fromDate: string | Date;
    toDate: string | Date;
    [key: string]: unknown;
}

interface DateRangeOutput {
    fromDate: Date;
    toDate: Date;
    [key: string]: unknown;
}

export interface StoredDateRange {
    fromDate?: string | Date;
    toDate?: string | Date;
    quickDate?: string | number;
}

export function prepareDateRange(dateRange: DateRangeInput): DateRangeOutput {
    const { fromDate: rawFromDate, toDate: rawToDate, ...others } = dateRange;
    let fromDate = rawFromDate;
    let toDate = rawToDate;

    if (typeof fromDate === 'string') {
        fromDate = parseISO(fromDate);
    }
    if (typeof toDate === 'string') {
        toDate = parseISO(toDate);
    }

    return { fromDate, toDate, ...others };
}

export function resolveStoredDateRange(dateRange: StoredDateRange | undefined, defaultQuickDate: string): DateRangeValue {
    const { fromDate, toDate, quickDate } = dateRange || {};
    if (fromDate && toDate) {
        return resolveDateRange({ ...prepareDateRange({ fromDate, toDate }), quickDate });
    }
    return resolveDateRange({ fromDate: new Date(), toDate: new Date(), quickDate: quickDate ?? defaultQuickDate });
}

export function getRandomColor(): string {
    return `#${Math.floor(Math.random() * 0x1000000)
        .toString(16)
        .padStart(6, '0')}`;
}
