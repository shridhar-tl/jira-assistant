import { getPathValue } from "react-controls/common/utils";
import { parseClause } from "src/common/linq";

const noAggregationFuncName = 'none';

const aggregationFunction = [
    { value: noAggregationFuncName, label: 'No Aggregation', allowDistinct: true },
    { value: 'sum', label: 'Sum', allowedFor: ['number', 'timespent', 'date', 'datetime'] },
    { value: 'avg', label: 'Avg', allowedFor: ['number', 'timespent', 'date', 'datetime'] },
    { value: 'min', label: 'Min', allowedFor: ['number', 'timespent', 'date', 'datetime'] },
    { value: 'max', label: 'Max', allowedFor: ['number', 'timespent', 'date', 'datetime'] },
    { value: 'count', label: 'Count', returnType: 'number', allowDistinct: true },
    { value: 'merge', label: 'Merge (CSV)', allowedFor: ['string'] },
    { value: 'first', label: 'First item' },
    { value: 'last', label: 'Last item' },
];

const distinctAllowedFunctions = aggregationFunction.filter(f => f.allowDistinct).map(f => f.value);

export function canAllowDistinct(func) {
    return func && distinctAllowedFunctions.includes(func);
}

export function getFunctionsByType(type, isRow) {
    return aggregationFunction.filter(f => (!f.allowedFor || f.allowedFor.includes(type)) && (isRow || f.value !== noAggregationFuncName));
}

const customFunctions = {
    count: function (key, items) {
        return items.map(parseClause(key)).filter(i => i || i === 0).length;
    },
    merge: function (key, items) {
        return items.map(parseClause(key)).join(', ');
    },
    first: function (key, items) {
        return getPathValue(items[0], key);
    },
    last: function (key, items) {
        return getPathValue(items.last(), key);
    }
};

export function isAggregated(cell) {
    const { agrFunc = 'first' } = cell;

    if (!agrFunc || agrFunc === noAggregationFuncName) {
        return false;
    }

    return true;
}

export function formatValue(cell, issues) {
    if (!isAggregated(cell)) {
        return null;
    }

    const { agrFunc = 'first' } = cell;

    const func = customFunctions[agrFunc];

    if (func) {
        return func(cell.key, issues, cell);
    }

    return issues[agrFunc](cell.key);
}