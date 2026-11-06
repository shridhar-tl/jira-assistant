import { format } from 'date-fns';

const msPerMinute = 60 * 1000;
const msPerHour = 60 * msPerMinute;

export function formatDuration(ms: number | null | undefined, dayLength: number): string {
    if (ms === null || ms === undefined) {
        return '';
    }
    if (ms < msPerMinute) {
        return ms > 0 ? '< 1m' : '0m';
    }
    if (ms < msPerHour) {
        return `${Math.floor(ms / msPerMinute)}m`;
    }
    if (ms < dayLength) {
        const hours = Math.floor(ms / msPerHour);
        const minutes = Math.floor((ms % msPerHour) / msPerMinute);
        return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    const days = Math.floor(ms / dayLength);
    const hours = Math.floor((ms % dayLength) / msPerHour);
    return hours && days < 100 ? `${days}d ${hours}h` : `${days}d`;
}

export function toExportDays(ms: number | null | undefined, dayLength: number): string {
    if (ms === null || ms === undefined) {
        return '';
    }
    return (ms / dayLength).toFixed(2);
}

export function formatDateTime(time: number): string {
    return format(time, 'dd MMM yyyy, HH:mm');
}

export function formatShortDate(time: number): string {
    return format(time, 'dd MMM yy');
}
