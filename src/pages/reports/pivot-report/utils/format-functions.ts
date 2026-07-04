import { parseClause } from '@/common/linq';
import { getPathValue } from '@/utils';

import { aggregateArray } from '../viewer/compute-field';

const noAggregationFuncName = 'none';

const aggregationFunction = [
    { value: noAggregationFuncName, label: 'No Aggregation', allowDistinct: true },
    { value: 'sum', label: 'Sum', allowedFor: ['number', 'timespent', 'date', 'datetime'] },
    { value: 'avg', label: 'Avg', allowedFor: ['number', 'timespent', 'date', 'datetime'] },
    { value: 'min', label: 'Min', allowedFor: ['number', 'timespent', 'date', 'datetime'] },
    { value: 'max', label: 'Max', allowedFor: ['number', 'timespent', 'date', 'datetime'] },
    { value: 'count', label: 'Count', returnType: 'number', allowDistinct: true },
    { value: 'merge', label: 'Merge (CSV)', allowedFor: ['string'] },
    { value: 'first', label: 'First value' },
    { value: 'last', label: 'Last value' },
];

const distinctAllowedFunctions = aggregationFunction.filter((f) => f.allowDistinct).map((f) => f.value);

export function canAllowDistinct(func?: string) {
    return func && distinctAllowedFunctions.includes(func);
}

export function getFunctionsByType(type?: string, isRow?: boolean) {
    return aggregationFunction.filter(
        (f) => (!f.allowedFor || f.allowedFor.includes(type || '')) && (isRow || f.value !== noAggregationFuncName),
    );
}

const customFunctions: Record<string, (key: string, items: any[], cell?: any) => any> = {
    count: function (key, items) {
        return items.map(parseClause(key)!).filter((i) => i || i === 0).length;
    },
    merge: function (key, items) {
        return items.map(parseClause(key)!).join(', ');
    },
    first: function (key, items) {
        return getPathValue(items[0], key);
    },
    last: function (key, items) {
        return getPathValue(items[items.length - 1], key);
    },
};

export function isAggregated(cell: any) {
    const { agrFunc = 'first' } = cell;

    if (!agrFunc || agrFunc === noAggregationFuncName) {
        return false;
    }

    return true;
}

export function formatValue(cell: any, issues: any[]) {
    if (!isAggregated(cell)) {
        return null;
    }

    const { agrFunc = 'first' } = cell;

    const func = customFunctions[agrFunc];

    if (func) {
        return func(cell.key, issues, cell);
    }

    return aggregateArray(
        issues.map((i) => getPathValue(i, cell.key)),
        agrFunc,
    );
}
