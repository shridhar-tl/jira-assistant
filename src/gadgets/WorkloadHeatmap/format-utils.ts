import { format } from 'date-fns';

export function formatHours(seconds: number): string {
    const hours = seconds / 3600;
    if (hours <= 0) {
        return '0h';
    }
    const rounded = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
    return `${rounded || 0.1}h`;
}

export function formatPercent(percent: number | null): string {
    return percent === null ? '–' : `${percent}%`;
}

export function formatShortDate(date: Date): string {
    return format(date, 'dd MMM');
}
