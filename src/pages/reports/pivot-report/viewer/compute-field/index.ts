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
                return obj.map((item) => item[field]);
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

    return func ? func(array) : aggregateArray(array, agrFunc);
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
                return obj.map((sf) => ({ ...issue, [prop]: [sf] }));
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

const customFunctions: Record<string, (items: any[]) => any> = {
    count: function (items) {
        return items.filter((i) => i || i === 0).length;
    },
    merge: function (items) {
        return items.join(', ');
    },
    first: function (items) {
        return items[0];
    },
    last: function (items) {
        return items[items.length - 1];
    },
};

export function aggregateArray(values: any[], func: string): any {
    const filtered = values.filter((v) => v !== null && v !== undefined);

    if (!filtered.length) return null;

    switch (func) {
        case 'sum':
            return filtered.reduce((sum, val) => sum + (Number(val) || 0), 0);
        case 'avg':
            return filtered.reduce((sum, val) => sum + (Number(val) || 0), 0) / filtered.length;
        case 'min':
            return Math.min(...filtered.map((v) => Number(v)));
        case 'max':
            return Math.max(...filtered.map((v) => Number(v)));
        default:
            return values[func as any]();
    }
}
