import * as moment from 'moment';
import { convertToDate } from './utils';

export function set(storage, key, value, expires, raw) {
    if (!key) { return; }

    if (value) {
        value = convertToStorableValue(value, expires, raw);
        storage.setItem(key, value);
    }
    else {
        storage.removeItem(key);
    }
}

export function convertToStorableValue(value, expires, raw) {
    if (!raw) {
        value = { value: value };
        if (expires) {
            if (typeof expires === "number" && expires > 0) {
                value.expires = moment().add(expires, 'days').toDate();
            }
            else if (expires instanceof Date) {
                value.expires = expires;
            }
            else if (moment.isMoment(expires)) {
                value.expires = expires.toDate();
            }
        }
        value = stringify(value);
    }

    if (typeof (value) === "object") {
        value = stringify(value);
    }
    return value;
}

export function get(storage, key, raw) {
    return convertToUsableValue(storage.getItem(key), raw);
}

export function convertToUsableValue(data, raw) {
    if (raw) {
        return data;
    }
    if (typeof data === 'string') {
        data = parseCustomJSON(data);
        if (data.expires) {
            const exp = moment(data.expires);
            if (exp.isBefore(new Date())) {
                data.value = null;
            }
        }
        data = data.value;
    }
    return data;
}

export function parseCustomJSON(value) {
    return JSON.parse(value, (key, val) => {
        if (val && typeof val === "string" && val.startsWith("/Date(")) {
            return convertToDate(val);
        }
        return val;
    });
}

const reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/;
function stringify(value) {
    return JSON.stringify(value, (key, val) => {
        if (val && val instanceof Date) {
            return `/Date(${val.getTime()})/`;
        }
        else if (val && typeof val === "string") {
            if (reISO.test(val)) {
                return `/Date(${convertToDate(val).getTime()})/`; //Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6])
            }
        }
        return val;
    });
}