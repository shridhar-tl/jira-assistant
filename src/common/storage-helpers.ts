import { convertToDate } from '../utils/helpers';

export function set(storage: Storage, key: string, value: any, expires?: number | Date, raw?: boolean): void {
    if (!key) {
        return;
    }

    if (value) {
        const storableValue = convertToStorableValue(value, expires, raw);
        storage.setItem(key, storableValue);
    } else {
        storage.removeItem(key);
    }
}

export function convertToStorableValue(value: any, expires?: number | Date, raw?: boolean): string {
    if (!raw) {
        const wrappedValue: any = { value: value };
        if (expires) {
            if (typeof expires === 'number' && expires > 0) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + expires);
                wrappedValue.expires = expiryDate;
            } else if (expires instanceof Date) {
                wrappedValue.expires = expires;
            }
        }
        value = stringify(wrappedValue);
    }

    if (typeof value === 'object') {
        value = stringify(value);
    }
    return value;
}

export function get(storage: Storage, key: string, raw?: boolean): any {
    return convertToUsableValue(storage.getItem(key), raw);
}

export function convertToUsableValue(data: any, raw?: boolean): any {
    if (raw) {
        return data;
    }
    if (typeof data === 'string') {
        let parsedData = parseCustomJSON(data);
        if (parsedData.expires) {
            const exp = new Date(parsedData.expires);
            if (exp < new Date()) {
                parsedData.value = null;
            }
        }
        parsedData = parsedData.value;
        return parsedData;
    }
    return data;
}

export function parseCustomJSON(value: string): any {
    return JSON.parse(value, (key, val) => {
        if (val && typeof val === 'string' && val.startsWith('/Date(')) {
            return convertToDate(val);
        }
        return val;
    });
}

const reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/;

function stringify(value: any): string {
    return JSON.stringify(value, (key, val) => {
        if (val && val instanceof Date) {
            return `/Date(${val.getTime()})/`;
        } else if (val && typeof val === 'string') {
            if (reISO.test(val)) {
                const dateVal = convertToDate(val);
                return dateVal ? `/Date(${dateVal.getTime()})/` : val;
            }
        }
        return val;
    });
}
