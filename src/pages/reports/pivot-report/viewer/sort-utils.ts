import { convertToDate } from '@utils/helpers';

import type { SortOrder } from '../types';

import { isEmptyValue } from './common-utils';

export interface SortKey<T> {
    valueOf: (item: T) => unknown;
    order: SortOrder;
}

type SortValue = number | string | null;

const datePattern = /^\d{4}-\d{2}-\d{2}/;
const textProps = ['displayName', 'name', 'value', 'key'];
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function toSortValue(value: unknown): SortValue {
    if (isEmptyValue(value)) {
        return null;
    }

    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }

    if (value instanceof Date) {
        return value.getTime();
    }

    if (typeof value === 'string') {
        const date = datePattern.test(value) ? convertToDate(value) : undefined;
        return date ? date.getTime() : value;
    }

    if (Array.isArray(value)) {
        const values = value.map(toSortValue).filter((v): v is number | string => v !== null);
        if (values.length < 2) {
            return values.length ? values[0] : null;
        }
        return values.join(', ');
    }

    const obj = value as Record<string, unknown>;
    const prop = textProps.find((p) => !isEmptyValue(obj[p]));

    return prop ? toSortValue(obj[prop]) : null;
}

function compareValues(a: SortValue, b: SortValue, order: SortOrder): number {
    if (a === null || b === null) {
        if (a === b) {
            return 0;
        }
        return a === null ? 1 : -1;
    }

    const result = typeof a === 'number' && typeof b === 'number' ? a - b : collator.compare(String(a), String(b));

    return order === 'desc' ? -result : result;
}

export function sortItems<T>(items: T[], keys: SortKey<T>[]): T[] {
    if (!keys.length || items.length < 2) {
        return items;
    }

    return items
        .map((item) => ({ item, values: keys.map((k) => toSortValue(k.valueOf(item))) }))
        .sort((a, b) => {
            for (let i = 0; i < keys.length; i++) {
                const result = compareValues(a.values[i], b.values[i], keys[i].order);
                if (result) {
                    return result;
                }
            }
            return 0;
        })
        .map(({ item }) => item);
}
