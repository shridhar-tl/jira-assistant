import moment from 'moment';

export function setLastUpdated(obj: any): void {
    if (obj) {
        obj._ts = new Date().getTime();
    }
}

export function parseTimeToSeconds(timeStr: string): number {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        const [hours, minutes] = parts.map(Number);
        return hours * 3600 + minutes * 60;
    }
    return 0;
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

export function getHostFromUrl(url: string | URL): string {
    const urlStr = typeof url === 'string' ? url : url.toString();
    return new URL(urlStr).host;
}

export function getOriginFromUrl(url: string | URL): string {
    const urlStr = typeof url === 'string' ? url : url.toString();
    let origin = new URL(urlStr).origin;

    if (!origin || origin === 'null') {
        return '';
    }

    if (!origin.endsWith('/')) {
        origin += '/';
    }

    return origin;
}

export function getUserName(userObj: { name?: string; emailAddress?: string; accountId?: string }, convertToLower = false): string | null {
    let name: string | null = null;

    if (userObj && typeof userObj === 'object') {
        name = userObj.name || userObj.emailAddress || userObj.accountId || null;
    }

    if (convertToLower && name) {
        name = name.toLowerCase();
    }

    return name;
}

export function parseIfJson<T>(json: string | T | undefined | null, defaultValue: T): T {
    if (json) {
        if (typeof json === 'string') {
            try {
                return JSON.parse(json) as T;
            } catch {
                return defaultValue;
            }
        } else {
            return json as T;
        }
    } else {
        return defaultValue;
    }
}

export function encodeAsQuerystring(params: Record<string, any>): string {
    return Object.keys(params)
        .filter((p: any) => params[p] !== undefined)
        .map((key) => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
}

export function prepareUrlWithQueryString(url: string, params: Record<string, any>): string {
    const queryString = encodeAsQuerystring(params);
    const cleanUrl = url.endsWith('?') ? url.slice(0, -1) : url;
    return `${cleanUrl}${queryString ? '?' : ''}${queryString}`;
}

export function mergeUrl(root: string, url: string): string {
    if (!url || (url.startsWith('http') && url.indexOf(':') > 3)) {
        return url;
    }
    if (!url.startsWith('/')) {
        url = `/${url}`;
    }

    const cleanRoot = root?.endsWith('/') ? root.slice(0, -1) : root;
    return cleanRoot + url;
}

export function viewIssueUrl(root: string, key: string): string | undefined {
    if (!root || !key) {
        return undefined;
    }
    return mergeUrl(root, `/browse/${key}`);
}

export function parseHTML(html: string): string {
    // ToDo: Parse HTML and return JSX with alternate option
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.innerText;
}

export function parseJiraCustomCSV(obj: string): Record<string, string> {
    const cleaned = obj.replace(/(^.*\[|\].*$)/g, '');
    const vals = cleaned.split(',');
    const result: Record<string, string> = {};

    for (let i = 0; i < vals.length; i++) {
        const val = vals[i].split('=');
        const data = val[1];
        if (data !== '<null>') {
            result[val[0]] = data;
        }
    }

    return result;
}

export function calcCostPerSecs(secs: number, cost: number): number | null {
    return (secs / 60 / 60) * cost || null;
}

export function convertToDate(value: any): Date | undefined {
    if (!value) {
        return value;
    }
    if (value instanceof Date) {
        return value;
    }
    if (typeof value === 'string' && value.indexOf('/Date(') > -1) {
        return new Date(parseInt(value.replace('/Date(', '').replace(')/', ''), 10));
    }
    const dateObj = new Date(value);
    if (!isNaN(dateObj.getTime())) {
        return dateObj;
    }
    return undefined;
}

export function stop(e: React.MouseEvent | React.KeyboardEvent): void {
    e.stopPropagation();
    e.preventDefault();
}

export function waitFor(ms: number): Promise<boolean> {
    if (ms > 0) {
        return new Promise((resolve) => setTimeout(() => resolve(true), ms));
    }
    return Promise.resolve(true);
}

export function saveAs(blob: Blob, fileName: string): void {
    const reader = new FileReader();
    reader.onload = function () {
        saveStringAs(reader.result as string, blob.type, fileName);
    };
    reader.readAsBinaryString(blob);
}

export function saveStringAs(str: string, typeName: string, fileName: string): void {
    const bdata = btoa(str);
    const datauri = `data:${typeName};base64,${bdata}`;
    const a = document.createElement('a');
    if ('download' in a) {
        a.href = datauri;
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        setTimeout(function () {
            a.click();
            document.body.removeChild(a);
        }, 66);
    } else {
        document.location.href = datauri;
    }
}

export function exportCsv(content: string, fileName: string, mimeType?: string): boolean {
    const a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';
    const ind = fileName.toLowerCase().lastIndexOf('.csv');
    if (ind === -1 || ind !== fileName.length - 4) {
        fileName += '.csv';
    }
    if ((navigator as any).msSaveBlob) {
        return (navigator as any).msSaveBlob(new Blob([content], { type: mimeType }), fileName);
    } else if ('download' in a) {
        a.href = `data:${mimeType},${encodeURIComponent(content)}`;
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        setTimeout(function () {
            a.click();
            document.body.removeChild(a);
        }, 66);
        return true;
    } else {
        const f = document.createElement('iframe');
        document.body.appendChild(f);
        f.src = `data:${mimeType},${encodeURIComponent(content)}`;
        setTimeout(function () {
            document.body.removeChild(f);
        }, 333);
        return true;
    }
}

export function getCurrentQueryParams(): Record<string, string> {
    const qryParams = document.location.search;

    if (qryParams) {
        return parseQueryParams(qryParams);
    }

    return {};
}

export function parseQueryParams(qryParams: string): Record<string, string> {
    const sp = new URLSearchParams(qryParams);
    return Array.from(sp.keys()).reduce(
        (obj, k) => {
            obj[k] = sp.get(k) || '';
            return obj;
        },
        {} as Record<string, string>,
    );
}

const hourColanParser = /^\d{1,3}:([0-5]\d?|60?)$/;
const displayFormatParser = /^\s*(?:(\d+)w)?\s*(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*$/;

export function parseTimespent(value: string | number): number {
    if (!value) {
        return 0;
    }
    let week = 0,
        days = 0,
        hours = 0,
        minutes = 0;

    if (typeof value !== 'string' && typeof value !== 'number') {
        return 0;
    }

    const valueStr = value.toString().trim();

    const hoursPerDay = 8;
    const daysPerWeek = 5;

    if (!isNaN(Number(valueStr))) {
        minutes = Math.round(parseFloat(valueStr) * 60);
    } else if (hourColanParser.test(valueStr)) {
        const parts = valueStr.split(':');
        hours = parseInt(parts[0]) || 0;
        minutes = parseInt(parts[1]) || 0;
    } else if (displayFormatParser.test(valueStr)) {
        const match = displayFormatParser.exec(valueStr);
        if (match) {
            week = parseInt(match[1]) || 0;
            days = parseInt(match[2]) || 0;
            hours = parseInt(match[3]) || 0;
            minutes = parseInt(match[4]) || 0;
        }
    }

    return (((week * daysPerWeek + days) * hoursPerDay + hours) * 60 + minutes) * 60;
}

export function replaceRepeatedWords(names: string[]): string[] {
    const total = names.length;
    if (total === 0) {
        return [];
    }

    const separated = names.map((name) => {
        if (name.length <= 3) {
            return { start: name, middle: '', end: '' };
        }
        return {
            start: name.slice(0, 2),
            middle: name.slice(2, -1),
            end: name.slice(-1),
        };
    });

    const middleTokens = separated.map((parts) => parts.middle.split(' '));

    const maxTokens = middleTokens.reduce((max, tokens) => Math.max(max, tokens.length), 0);

    const tokenCounts = Array.from({ length: maxTokens }, () => ({}) as Record<string, number>);

    for (let i = 0; i < maxTokens; i++) {
        for (let j = 0; j < total; j++) {
            const tokens = middleTokens[j];
            if (i < tokens.length) {
                const token = tokens[i];
                if (!/\d/.test(token) && token.length > 3) {
                    tokenCounts[i][token] = (tokenCounts[i][token] || 0) + 1;
                }
            }
        }
    }

    const positionsToReplace = new Set<number>();
    for (let i = 0; i < maxTokens; i++) {
        for (const [token, count] of Object.entries(tokenCounts[i])) {
            if (count / total >= 0.5) {
                positionsToReplace.add(i);
                break;
            }
        }
    }

    const processedMiddle = middleTokens.map((tokens) =>
        tokens
            .map((token, idx) => {
                if (positionsToReplace.has(idx) && token.length > 3 && !/\d/.test(token)) {
                    return '...';
                }
                return token;
            })
            .join(' '),
    );

    const replacedNames = separated.map((parts, idx) => {
        const middle = processedMiddle[idx];
        if (middle === '') {
            return parts.start + parts.end;
        }
        return (parts.start + middle + parts.end).replace(/([.]+\s*){3,}/g, '...').replace(/([.]+\s*){2}/g, '...');
    });

    return replacedNames;
}

export function getPathValue(obj: any, path: string): any {
    if (!obj || !path) {
        return undefined;
    }

    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            return undefined;
        }
    }

    return result;
}

let weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1;

export function setStartOfWeek(startOfWeek: number): void {
    if (!startOfWeek || startOfWeek < 1) {
        startOfWeek = 1;
    }
    weekStartsOn = ((startOfWeek - 1) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    moment.locale(moment.locale(), { week: { dow: startOfWeek - 1 } });
}

export function getStartOfWeek(): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
    return weekStartsOn;
}

export function clearEnd(str: string, char: string): string {
    while (str.endsWith(char)) {
        str = str.substring(0, str.length - 1);
    }

    return str;
}
