import { formatDate as formatDateUtil, formatDateTimeForJira as formatDTForJira, getDateArray, getUserName, padNumber } from '@utils';

import type { User } from '@types';

const secsPerDay = 86400;
const secsPerHour = 3600;

export function convertDate(date: string | Date | number): Date {
    if (date instanceof Date) return date;
    if (typeof date === 'string' || typeof date === 'number') {
        return new Date(date);
    }
    return new Date();
}

export function formatDate(date: Date | string | number, format: string): string {
    const d = convertDate(date);
    return formatDateUtil(d, format);
}

export function formatDateTimeForJira(datetime: Date | string | number): string {
    const d = convertDate(datetime);
    return formatDTForJira(d);
}

export function formatDateForJira(date: Date | string | number): string {
    const d = convertDate(date);
    return formatDateUtil(d, 'dd/MMM/yy');
}

export function getTotalSecs(ts: string | number | { timeSpent?: string; overrideTimeSpent?: string }): number {
    if (typeof ts === 'string') {
        const parts = ts.split(':');
        if (parts.length < 2) {
            // Handle Jira-format strings like "1h 30m", "2h", "30m", "1d 2h 30m"
            const jiraMatch = ts.match(/(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s\s*)?/);
            if (jiraMatch && (jiraMatch[1] || jiraMatch[2] || jiraMatch[3] || jiraMatch[4])) {
                const days = parseInt(jiraMatch[1] || '0', 10);
                const hours = parseInt(jiraMatch[2] || '0', 10);
                const mins = parseInt(jiraMatch[3] || '0', 10);
                const secs = parseInt(jiraMatch[4] || '0', 10);
                return days * 8 * 3600 + hours * 3600 + mins * 60 + secs;
            }
            return parseFloat(ts) || 0;
        }
        let secs = parseInt(parts[0], 10) * 60 * 60;
        secs += parseInt(parts[1], 10) * 60;
        if (parts.length > 2) {
            secs += parseInt(parts[2], 10);
        }
        return secs;
    } else if (typeof ts === 'number') {
        return ts / 1000;
    } else if (ts && typeof ts === 'object') {
        const timeStr = (ts as any).overrideTimeSpent || (ts as any).timeSpent;
        return timeStr ? getTotalSecs(timeStr) : 0;
    }
    return 0;
}

export function convertSecs(d: number | number[], opts?: { format?: boolean; showZeroSecs?: boolean }): number | string {
    const options = opts || {};

    if (!d) {
        return options.showZeroSecs ? 0 : '';
    }

    if (Array.isArray(d)) {
        d = d.reduce((sum, val) => sum + val, 0);
    }

    const num = Number(d);

    if (options.format) {
        return formatSecs(num, options.showZeroSecs);
    }

    return parseFloat((num / 3600).toFixed(4));
}

export function formatSecs(d: number | number[], showZeroSecs = false, simple = false, days = false): string {
    if (d === 0) {
        return showZeroSecs ? '0s' : '';
    }

    if (Array.isArray(d)) {
        d = d.reduce((sum, val) => sum + val, 0);
    }

    let num = Number(d);
    let prefix = '';

    if (num < 0) {
        prefix = '-';
        num = Math.abs(num);
    }

    let day = 0;
    let h, m, s;

    if (days) {
        day = Math.floor(num / secsPerDay);
        num = num % secsPerDay;
        h = Math.floor(num / secsPerHour);
        m = Math.floor((num % secsPerHour) / 60);
        s = Math.floor((num % secsPerHour) % 60);
    } else {
        h = Math.floor(num / secsPerHour);
        m = Math.floor((num % secsPerHour) / 60);
        s = Math.floor((num % secsPerHour) % 60);
    }

    if (simple) {
        return `${prefix}${day > 0 ? `${padNumber(day, 2)}:` : ''}${padNumber(h, 2)}:${padNumber(m, 2)}`;
    }

    const parts: string[] = [];
    if (day > 0) parts.push(`${day}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);

    return prefix + parts.join(' ');
}

export function formatTs(d: string | number, simple = false): string {
    return formatSecs(getTotalSecs(d), false, simple);
}

export function formatUser(obj: User | null | undefined, fields?: 'EM' | 'LG' | 'NE' | 'NL'): string | null {
    if (!obj) return null;

    switch (fields) {
        case 'EM':
            return obj.emailAddress || null;
        case 'LG':
            return getUserName(obj) || null;
        case 'NE':
            return `${obj.displayName} (${obj.emailAddress})`;
        case 'NL':
            return `${obj.displayName} (${getUserName(obj)})`;
        default:
            return obj.displayName || null;
    }
}

export function cut(value: string, max = 20, wordwise = false, tail = '...'): string {
    if (!value || max === -1) return value;

    const maxLen = parseInt(String(max), 10);
    if (!maxLen || value.length <= maxLen) return value;

    let truncated = value.substr(0, maxLen);

    if (wordwise) {
        let lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace !== -1) {
            const charBeforeSpace = truncated.charAt(lastSpace - 1);
            if (charBeforeSpace === '.' || charBeforeSpace === ',') {
                lastSpace = lastSpace - 1;
            }
            truncated = truncated.substr(0, lastSpace);
        }
    }

    return truncated + tail;
}

export function getRowStatus(d: any): string {
    let classNames = '';

    if (d.status) {
        const statusName = (d.status.name || d.status).toLowerCase();
        if (statusName === 'closed') {
            classNames += 'closed ';
        }
    }

    if (d.difference) {
        const secsDiff = getTotalSecs(d.difference);
        if (secsDiff > 0) {
            classNames += 'log-high ';
        } else if (secsDiff < 0) {
            classNames += 'log-less ';
        }
    } else if (d.difference === 0) {
        classNames += 'log-good ';
    }

    return classNames.trim();
}

export function propOfNthItem(arr: any[], index: number | string, prop?: string, fromCsv = false): any {
    if (!arr) return null;
    if (!Array.isArray(arr)) return '#Error:Array expected';
    if (!arr.length) return null;

    let idx: number;

    if (typeof index === 'string') {
        if (index === 'last') {
            idx = arr.length - 1;
        } else if (!isNaN(Number(index))) {
            idx = Number(index);
        } else {
            return '#Error:Invalid index';
        }
    } else {
        idx = index;
    }

    if (idx < 0) return '#Error:Out of L Bound';
    if (idx >= arr.length) return '#Error:Out of U Bound';

    return getProperty(arr[idx], prop, fromCsv);
}

export function getProperty(object: any, prop?: string, fromCsv = false): any {
    if (!object) return object;

    // Note: parseJiraCustomCSV would need to be implemented if needed
    // Skipping for now as it's not critical
    if (fromCsv && typeof object === 'string') {
        object = convertCustObj(object);
    }

    if (!prop) return object;
    return object[prop];
}

function convertCustObj(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map((item) => convertCustObj(item));
    }

    if (typeof obj === 'string') {
        return parseJiraCustomCSV(obj);
    }

    return obj;
}

function parseJiraCustomCSV(csv: string): any {
    if (!csv || typeof csv !== 'string') return csv;

    const parts = csv.split(',');
    const result: Record<string, string> = {};

    parts.forEach((part) => {
        const [key, value] = part.split('=');
        if (key && value) {
            result[key.trim()] = value.trim();
        }
    });

    return result;
}

/**
 * Service class (for dependency injection)
 */
export default class UtilsService {
    static dependencies: string[] = [];

    // Expose standalone functions as methods
    convertDate = convertDate;
    getDateArray = getDateArray;
    formatDate = formatDate;
    formatDateTimeForJira = formatDateTimeForJira;
    formatDateForJira = formatDateForJira;
    getTotalSecs = getTotalSecs;
    convertSecs = convertSecs;
    formatSecs = formatSecs;
    formatTs = formatTs;
    formatUser = formatUser;
    cut = cut;
    getRowStatus = getRowStatus;
    propOfNthItem = propOfNthItem;
    getProperty = getProperty;

    // Array utility wrappers (delegating to array-utils)
    sum(arr: any[], prop?: string): number {
        if (!arr) return 0;
        if (prop) {
            return arr.reduce((sum, v) => sum + (v[prop] || 0), 0);
        }
        return arr.reduce((sum, v) => sum + (v || 0), 0);
    }

    avg(arr: any[], prop?: string): number {
        if (!arr || arr.length === 0) return 0;
        return this.sum(arr, prop) / arr.length;
    }

    min(arr: any[], prop?: string): number | null {
        if (!arr || arr.length === 0) return null;
        const values = prop ? arr.map((v: any) => v[prop]) : arr;
        return Math.min(...values.filter((v: any) => v != null));
    }

    max(arr: any[], prop?: string): number | null {
        if (!arr || arr.length === 0) return null;
        const values = prop ? arr.map((v: any) => v[prop]) : arr;
        return Math.max(...values.filter((v: any) => v != null));
    }

    count(arr: any[], prop?: string): number {
        if (!arr) return 0;
        if (prop) {
            return arr.filter((v: any) => v[prop]).length;
        }
        return arr.length;
    }
}
