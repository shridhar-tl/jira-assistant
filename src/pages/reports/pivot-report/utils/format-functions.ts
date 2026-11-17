import { parseClause } from '@/common/linq';
import { getPathValue } from '@/utils';

import { countValues } from '../viewer/common-utils';
import { aggregateArray } from '../viewer/compute-field';

const noAggregationFuncName = 'none';
const defaultAggregationFuncName = 'first';
const countFuncName = 'count';

interface AggregationFunction {
    value: string;
    label: string;
    allowedFor?: string[];
    allowDistinct?: boolean;
}

const aggregationFunction: AggregationFunction[] = [
    { value: noAggregationFuncName, label: 'No Aggregation' },
    { value: 'sum', label: 'Sum', allowedFor: ['number', 'timespent'] },
    { value: 'avg', label: 'Avg', allowedFor: ['number', 'timespent'] },
    { value: 'min', label: 'Min', allowedFor: ['number', 'timespent', 'date', 'datetime'] },
    { value: 'max', label: 'Max', allowedFor: ['number', 'timespent', 'date', 'datetime'] },
    { value: countFuncName, label: 'Count', allowDistinct: true },
    { value: 'merge', label: 'Merge (CSV)', allowedFor: ['string'] },
    { value: defaultAggregationFuncName, label: 'First value' },
    { value: 'last', label: 'Last value' },
];

const distinctAllowedFunctions = aggregationFunction.filter((f) => f.allowDistinct).map((f) => f.value);

const functionsWithoutHeaderSuffix = [noAggregationFuncName, defaultAggregationFuncName];

export function canAllowDistinct(func?: string) {
    return !!func && distinctAllowedFunctions.includes(func);
}

export function getFunctionsByType(type?: string, isRow?: boolean) {
    return aggregationFunction.filter(
        (f) => (!f.allowedFor || f.allowedFor.includes(type || '')) && (isRow || f.value !== noAggregationFuncName),
    );
}

export function getAggregationLabel(func?: string) {
    return aggregationFunction.find((f) => f.value === (func || defaultAggregationFuncName))?.label;
}

/**
 * Default header of an aggregated field includes the function name, so that same field aggregated in different ways are distinguishable
 */
export function getDefaultHeaderText(field: { name: string; agrFunc?: string; useDistinct?: boolean; enableGrouping?: boolean }) {
    const { name, agrFunc, useDistinct, enableGrouping } = field;

    if (enableGrouping || !agrFunc || functionsWithoutHeaderSuffix.includes(agrFunc)) {
        return name;
    }

    const label = getAggregationLabel(agrFunc);
    if (!label) {
        return name;
    }

    return `${name} (${agrFunc === countFuncName && useDistinct ? 'Distinct count' : label})`;
}

const customFunctions: Record<string, (key: string, items: any[], cell?: any) => any> = {
    count: function (key, items, cell) {
        return countValues(items.map(parseClause(key)!), cell?.useDistinct);
    },
    merge: function (key, items) {
        return items
            .map(parseClause(key)!)
            .filter((v) => v || v === 0)
            .join(', ');
    },
    first: function (key, items) {
        return getPathValue(items[0], key);
    },
    last: function (key, items) {
        return getPathValue(items[items.length - 1], key);
    },
};

export function isAggregated(cell: any) {
    const { agrFunc = defaultAggregationFuncName } = cell;

    if (!agrFunc || agrFunc === noAggregationFuncName) {
        return false;
    }

    return true;
}

export function formatValue(cell: any, issues: any[]) {
    if (!isAggregated(cell)) {
        return null;
    }

    const { agrFunc = defaultAggregationFuncName } = cell;

    const func = customFunctions[agrFunc];

    if (func) {
        return func(cell.key, issues, cell);
    }

    return aggregateArray(
        issues.map((i) => getPathValue(i, cell.key)),
        agrFunc,
    );
}
