import { parseISO } from 'date-fns';

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

export function prepareDateRange(dateRange: DateRangeInput): DateRangeOutput {
    let { fromDate, toDate, ...others } = dateRange;

    if (typeof fromDate === 'string') {
        fromDate = parseISO(fromDate);
    }
    if (typeof toDate === 'string') {
        toDate = parseISO(toDate);
    }

    return { fromDate, toDate, ...others };
}

export function getRandomColor(): string {
    const bg = Math.floor(Math.random() * 16777215).toString(16);
    return `#${bg}`;
}
