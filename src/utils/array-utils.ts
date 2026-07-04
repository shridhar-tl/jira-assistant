import { getPathValue } from './helpers';

type ClauseFunction<T, R> = (item: T, index?: number) => R;
type Clause<T, R> = ClauseFunction<T, R> | string;

function parseClause<T, R>(clause?: Clause<T, R>): ClauseFunction<T, R> | undefined {
    if (typeof clause === 'string') {
        const prop = clause;
        if (prop.indexOf('.') > -1) {
            return (obj: any) => getPathValue(obj, prop);
        }
        return (obj: any) => obj[prop];
    }
    return clause as ClauseFunction<T, R>;
}

export function distinct<T, R = T>(array: T[], clause?: Clause<T, R>, excludeNulls = false): R[] {
    const parsedClause = parseClause(clause);
    const dict: Record<string, boolean> = {};
    const result: R[] = [];

    for (let i = 0; i < array.length; i++) {
        const item = parsedClause ? parsedClause(array[i], i) : (array[i] as any);
        if (excludeNulls && (item === null || item === undefined)) continue;

        const key = typeof item === 'object' ? JSON.stringify(item) : String(item);
        if (!dict[key]) {
            dict[key] = true;
            result.push(item);
        }
    }

    return result;
}

export function groupBy<T, K = any>(array: T[], clause: Clause<T, K>, filter?: (item: T) => boolean): Array<{ key: K; values: T[] }> {
    const parsedClause = parseClause(clause);
    if (!parsedClause) throw new Error('groupBy requires a clause');

    const result: Array<{ key: K; values: T[] }> = [];
    const valObj: Record<string, { key: K; values: T[] }> = {};

    for (let i = 0; i < array.length; i++) {
        const item = array[i];
        const key = parsedClause(item, i);
        const keyStr = typeof key === 'object' ? JSON.stringify(key) : String(key);

        let obj = valObj[keyStr];
        if (!obj) {
            obj = { key, values: [] };
            result.push(obj);
            valObj[keyStr] = obj;
        }

        if (!filter || filter(item)) {
            obj.values.push(item);
        }
    }

    return result;
}

export function sum<T>(array: T[], clause?: Clause<T, number>): number {
    const parsedClause = parseClause(clause);
    let total = 0;

    if (parsedClause) {
        for (let i = 0; i < array.length; i++) {
            total += parsedClause(array[i], i) || 0;
        }
    } else {
        for (let i = 0; i < array.length; i++) {
            total += parseFloat(array[i] as any) || 0;
        }
    }

    return total;
}

export function avg<T>(array: T[], clause?: Clause<T, number>): number {
    const parsedClause = parseClause(clause);
    let total = 0;
    let count = 0;

    if (parsedClause) {
        for (let i = 0; i < array.length; i++) {
            const val = parsedClause(array[i], i);
            if (val != null) {
                total += val;
                count++;
            }
        }
    } else {
        for (let i = 0; i < array.length; i++) {
            const val = parseFloat(array[i] as any);
            if (!isNaN(val)) {
                total += val;
                count++;
            }
        }
    }

    return count > 0 ? total / count : 0;
}

export function max<T>(array: T[], clause?: Clause<T, number | Date>): number | Date | null {
    if (array.length === 0) return null;

    const parsedClause = parseClause(clause);
    let maxValue: any = null;

    for (let i = 0; i < array.length; i++) {
        const value = parsedClause ? parsedClause(array[i], i) : array[i];
        const compareValue = value instanceof Date ? value.getTime() : value;
        const compareMax = maxValue instanceof Date ? maxValue.getTime() : maxValue;

        if (maxValue === null || compareValue > compareMax) {
            maxValue = value;
        }
    }

    return maxValue;
}

export function min<T>(array: T[], clause?: Clause<T, number | Date>): number | Date | null {
    if (array.length === 0) return null;

    const parsedClause = parseClause(clause);
    let minValue: any = null;

    for (let i = 0; i < array.length; i++) {
        const value = parsedClause ? parsedClause(array[i], i) : array[i];
        const compareValue = value instanceof Date ? value.getTime() : value;
        const compareMin = minValue instanceof Date ? minValue.getTime() : minValue;

        if (minValue === null || compareValue < compareMin) {
            minValue = value;
        }
    }

    return minValue;
}

export function first<T>(array: T[], clause?: Clause<T, boolean>): T | null {
    const parsedClause = parseClause(clause);

    if (parsedClause) {
        for (let i = 0; i < array.length; i++) {
            if (parsedClause(array[i], i)) {
                return array[i];
            }
        }
        return null;
    }

    return array.length > 0 ? array[0] : null;
}

export function last<T>(array: T[], clause?: Clause<T, boolean>): T | null {
    const parsedClause = parseClause(clause);

    if (parsedClause) {
        for (let i = array.length - 1; i >= 0; i--) {
            if (parsedClause(array[i], i)) {
                return array[i];
            }
        }
        return null;
    }

    return array.length > 0 ? array[array.length - 1] : null;
}

export function orderBy<T, K = any>(array: T[], clause?: Clause<T, K>): T[] {
    const parsedClause = parseClause(clause);
    const copy = [...array];

    return copy.sort((a, b) => {
        const x = parsedClause ? parsedClause(a) : a;
        const y = parsedClause ? parsedClause(b) : b;

        if (!x && y) return -1;
        if (x && !y) return 1;

        if (x < y) return -1;
        if (x > y) return 1;
        return 0;
    });
}

export function orderByDescending<T, K = any>(array: T[], clause?: Clause<T, K>): T[] {
    const parsedClause = parseClause(clause);
    const copy = [...array];

    return copy.sort((a, b) => {
        const x = parsedClause ? parsedClause(b) : b;
        const y = parsedClause ? parsedClause(a) : a;

        if (!x && y) return -1;
        if (x && !y) return 1;

        if (x < y) return -1;
        if (x > y) return 1;
        return 0;
    });
}

export function sortBy<T, K = any>(array: T[], clause?: Clause<T, K>, desc = false): T[] {
    return desc ? orderByDescending(array, clause) : orderBy(array, clause);
}

export function addRange<T>(array: T[], items: T[]): T[] {
    return [...array, ...items];
}

export function leftJoin<L, R>(
    leftArray: L[],
    rightArray: R[],
    onClause: (left: L, right: R) => boolean,
): Array<{ left: L; right: R | null }> {
    const result: Array<{ left: L; right: R | null }> = [];

    for (let i = 0; i < leftArray.length; i++) {
        const left = leftArray[i];
        const matches = rightArray.filter((right) => onClause(left, right));

        if (matches.length === 0) {
            result.push({ left, right: null });
        } else {
            matches.forEach((right) => {
                result.push({ left, right });
            });
        }
    }

    return result;
}

export function innerJoin<L, R>(leftArray: L[], rightArray: R[], onClause: (left: L, right: R) => boolean): Array<{ left: L; right: R }> {
    const result: Array<{ left: L; right: R }> = [];

    for (let i = 0; i < leftArray.length; i++) {
        const left = leftArray[i];
        const matches = rightArray.filter((right) => onClause(left, right));

        matches.forEach((right) => {
            result.push({ left, right });
        });
    }

    return result;
}

export function rightJoin<L, R>(
    leftArray: L[],
    rightArray: R[],
    onClause: (left: L, right: R) => boolean,
): Array<{ left: L | null; right: R }> {
    const result: Array<{ left: L | null; right: R }> = [];

    for (let i = 0; i < rightArray.length; i++) {
        const right = rightArray[i];
        const matches = leftArray.filter((left) => onClause(left, right));

        if (matches.length === 0) {
            result.push({ left: null, right });
        } else {
            matches.forEach((left) => {
                result.push({ left, right });
            });
        }
    }

    return result;
}

export function count<T>(array: T[], clause?: Clause<T, boolean>): number {
    if (!clause) return array.length;

    const parsedClause = parseClause(clause);
    if (!parsedClause) return array.length;

    return array.filter((item, i) => parsedClause(item, i)).length;
}

export function any<T>(array: T[], clause?: Clause<T, boolean> | T): boolean {
    if (typeof clause === 'function') {
        return array.some(clause as any);
    }
    if (clause !== undefined) {
        return array.indexOf(clause as T) >= 0;
    }
    return array.length > 0;
}

export function all<T>(array: T[], clause: Clause<T, boolean>): boolean {
    const parsedClause = parseClause(clause);
    if (!parsedClause) return true;

    for (let i = 0; i < array.length; i++) {
        if (!parsedClause(array[i], i)) return false;
    }
    return true;
}

export function skip<T>(array: T[], count: number): T[] {
    return array.slice(Math.max(0, count));
}

export function take<T>(array: T[], count: number): T[] {
    return array.slice(0, count);
}

export function contains<T>(array: T[], value: T): boolean {
    return array.indexOf(value) > -1;
}

export function remove<T>(array: T[], item: T | ((item: T) => boolean)): boolean {
    if (typeof item === 'function') {
        const predicate = item as (item: T) => boolean;
        for (let i = 0; i < array.length; i++) {
            if (predicate(array[i])) {
                array.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    const index = array.indexOf(item);
    if (index > -1) {
        array.splice(index, 1);
        return true;
    }
    return false;
}

export async function mapAsync<T, R>(array: T[], callback: (item: T, index: number) => Promise<R>): Promise<R[]> {
    return await Promise.all(array.map(callback));
}

export function union<T, R>(array: T[], selector: (item: T) => R[]): R[] {
    const result: R[] = [];
    for (const item of array) {
        const values = selector(item);
        if (values) {
            result.push(...values);
        }
    }
    return result;
}

export function addDistinctRange<T, R = T>(array: T[], items: T[], clause?: Clause<T, R>): T[] {
    const parsedClause = parseClause(clause);
    const existing = new Set(
        array.map((item, i) => {
            const val = parsedClause ? parsedClause(item, i) : item;
            return typeof val === 'object' ? JSON.stringify(val) : String(val);
        }),
    );

    const result = [...array];
    for (let i = 0; i < items.length; i++) {
        const val = parsedClause ? parsedClause(items[i], i) : (items[i] as any);
        const key = typeof val === 'object' ? JSON.stringify(val) : String(val);
        if (!existing.has(key)) {
            existing.add(key);
            result.push(items[i]);
        }
    }
    return result;
}
