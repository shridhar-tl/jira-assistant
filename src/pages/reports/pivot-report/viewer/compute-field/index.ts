import type { PivotFieldConfig } from '../../types';
import { filterDerivedItems } from '../../utils/derived-sources';
import { countValues } from '../common-utils';

import { generateDateRangeColumns } from './date-range-field';

export function processComputeField(column: any, headerOpts: any, issues: any[], depth: number, hasSiblings: boolean, processColumns: any) {
    const func = generator[column.schema.type];

    if (func) {
        return func(column, headerOpts, issues, depth, hasSiblings, processColumns);
    } else {
        throw new Error(`Unknown field error. Type:-${column.schema.type}`);
    }
}

const generator: Record<string, any> = {
    'date-range': generateDateRangeColumns,
};

export function getAggregatedDerivedFieldValue(cell: any, issues: any[]) {
    if (!issues.length) {
        return;
    }

    const { agrFunc = 'first', key } = cell;

    if (!agrFunc) {
        return null;
    }

    let array: any[];

    if (key.includes('.')) {
        const [prop, field] = key.split('.');

        array = issues.flatMap((issue) => {
            const obj = issue[prop];

            if (!obj) {
                return [];
            }

            if (Array.isArray(obj)) {
                return filterDerivedItems(cell, obj).map((item) => item[field]);
            }

            return [obj[field]];
        });
    } else {
        /**
         * ToDo: Currently no compute field exists without '.' in key
         * Need to handle this case if such compute field added
         **/
        throw new Error('Unhandled Error: Error Code:- CF_NO_DOT');
    }

    const func = customFunctions[agrFunc];

    return func ? func(array, cell) : aggregateArray(array, agrFunc);
}

export function flattenDerivedFields(cell: any, issues: any[]) {
    const { key } = cell;

    if (key.includes('.')) {
        const [prop, field] = key.split('.');

        return issues.flatMap((issue) => {
            const obj = issue[prop];

            if (!obj) {
                return [];
            }

            if (Array.isArray(obj)) {
                return filterDerivedItems(cell, obj).map((sf) => ({ ...issue, [prop]: [sf] }));
            }

            return [obj[field]];
        });
    } else {
        /**
         * ToDo: Currently no compute field exists without '.' in key
         * Need to handle this case if such compute field added
         **/
        throw new Error('Unhandled Error: Error Code:- DF_NO_DOT');
    }
}

type AggregateFunction = (items: unknown[], cell: Pick<PivotFieldConfig, 'useDistinct'>) => unknown;

const customFunctions: Record<string, AggregateFunction> = {
    count: function (items, cell) {
        return countValues(items, cell.useDistinct);
    },
    merge: function (items) {
        return items.filter((i) => i || i === 0).join(', ');
    },
    first: function (items) {
        return items[0];
    },
    last: function (items) {
        return items[items.length - 1];
    },
};

function toComparableNumber(value: unknown): number {
    if (typeof value === 'number') {
        return value;
    }

    const num = Number(value);

    return isNaN(num) ? new Date(value as string).getTime() : num;
}

/**
 * Min and max returns the actual value instead of number so that dates are retained in its own format to be displayed
 */
function pickValue(values: unknown[], func: 'min' | 'max') {
    let result: unknown = null;
    let resultNum = NaN;

    values.forEach((value) => {
        const num = toComparableNumber(value);
        if (isNaN(num)) {
            return;
        }

        if (isNaN(resultNum) || (func === 'min' ? num < resultNum : num > resultNum)) {
            result = value;
            resultNum = num;
        }
    });

    return result;
}

export function aggregateArray(values: unknown[], func: string): unknown {
    const filtered = values.filter((v) => v !== null && v !== undefined && v !== '');

    if (!filtered.length) return null;

    switch (func) {
        case 'sum':
            return filtered.reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
        case 'avg':
            return filtered.reduce<number>((sum, val) => sum + (Number(val) || 0), 0) / filtered.length;
        case 'min':
        case 'max':
            return pickValue(filtered, func);
        default:
            return null;
    }
}
