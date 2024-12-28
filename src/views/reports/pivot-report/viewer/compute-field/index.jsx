import { generateDateRangeColumns } from "./date-range-field";

export function processComputeField(column, headerOpts, issues, depth, hasSiblings, processColumns) {
    const func = generator[column.schema.type];

    if (func) {
        return func(column, headerOpts, issues, depth, hasSiblings, processColumns);
    } else {
        throw new Error(`Unknown field error. Type:-${column.schema.type}`);
    }
}

const generator = {
    'date-range': generateDateRangeColumns
};

export function getAggregatedDerivedFieldValue(cell, issues) {
    if (!issues.length) {
        return;
    }

    const { agrFunc = 'first', key } = cell;

    if (!agrFunc) {
        return null;
    }

    let array = [];

    if (key.includes('.')) {
        const [prop, field] = key.split('.');

        array = issues.flatMap(issue => {
            const { [prop]: obj } = issue;

            if (!obj) {
                return [];
            }

            if (Array.isArray(obj)) {
                return obj.map(({ [field]: f }) => f);
            }

            return [obj[field]];
        });
    } else {
        /**
         * ToDo: Currently no compute field exists without "." in key
         * Need to handle this case if such compute field added
         **/
        throw new Error('Unhandled Error: Error Code:- CF_NO_DOT');
    }

    const func = customFunctions[agrFunc];

    return func ? func(array) : array[agrFunc]();
}

export function flattenDerivedFields(cell, issues) {
    const { key } = cell;

    if (key.includes('.')) {
        const [prop, field] = key.split('.');

        return issues.flatMap(issue => {
            const { [prop]: obj } = issue;

            if (!obj) {
                return [];
            }

            if (Array.isArray(obj)) {
                return obj.map(sf => ({ ...issue, [prop]: [sf] }));
            }

            return [obj[field]];
        });
    } else {
        /**
         * ToDo: Currently no compute field exists without "." in key
         * Need to handle this case if such compute field added
         **/
        throw new Error('Unhandled Error: Error Code:- DF_NO_DOT');
    }
}

const customFunctions = {
    count: function (items) {
        return items.filter(i => i || i === 0).length;
    },
    merge: function (items) {
        return items.join(', ');
    },
    first: function (items) {
        return items[0];
    },
    last: function (items) {
        return items.last();
    }
};