import { getPathValue } from '../utils/helpers';

export function parseClause<T, R>(clause?: string | ((item: T, index?: number) => R)): ((item: T, index?: number) => R) | undefined {
    const isClauseString = typeof clause === 'string';
    if (isClauseString) {
        const tmp = clause;
        return tmp.indexOf('.') > -1 ? (obj: any) => getPathValue(obj, tmp) : (obj: any) => obj[tmp];
    }
    return clause;
}

function prepareAgreData(data: any): any {
    if (data && data instanceof Date) {
        return data.getTime();
    }
    return data;
}

function addDistinct<T>(array: T[], item: T): boolean {
    if (!array.includes(item)) {
        array[array.length] = item;
        return true;
    }
    return false;
}

function getColsArr(obj: Record<string, any>): string[] {
    let cols = Object.keys(obj);
    if (cols.filter((c) => c.startsWith('~~')).length > 1) {
        throw Error('#Error: Multiple array recursion not allowed');
    }
    cols = cols.orderBy((c) => (c.startsWith('~~') ? 2 : 1));
    return cols;
}

function getObjVal(row: any, prop: string | Function): any {
    if (typeof prop === 'string') {
        const split = prop.split('.');
        let value = row[split[0]];
        for (let j = 1; value && j < split.length; j++) {
            value = value[split[j]];
        }
        return value;
    } else if (typeof prop === 'function') {
        return prop(row);
    }
}

function getObject(row: any, clause: any, curItem: any, propPrefix?: string): any[] {
    propPrefix = propPrefix || '';
    const cols = getColsArr(clause);
    const colsLen = cols.length;
    let returnRaw = false;

    for (let i = 0; i < colsLen; i++) {
        let propName = cols[i];
        let field = clause[propName];
        const repeatOnVal = propName.startsWith('~~');
        if (repeatOnVal) {
            propName = propName.substring(2);
        }

        if (field === true) {
            field = propName;
        }

        if (typeof field === 'object' && !Array.isArray(field)) {
            const obj = field;
            field = field.field;
            if (!field || field === true) {
                field = propName;
            }
            const spread = obj.spread === true || !propName;
            const value = getObjVal(row, field);
            const props = obj.props;
            let newVal = null;

            if (value) {
                if (!repeatOnVal) {
                    newVal = props ? getObject(value, props, spread ? curItem : {}, spread ? propName : '') : value;
                    if (!spread) {
                        curItem[propPrefix + propName] = newVal;
                    }
                } else if (Array.isArray(value)) {
                    newVal = props ? value.flatten(props, null, spread ? curItem : null, spread ? propName : '') : value;
                    if (!spread) {
                        curItem = newVal.map((nv: any) => {
                            const ret = { ...curItem, [propPrefix + propName]: nv };
                            Object.keys(nv).forEach((nvp) => {
                                if (nvp.startsWith('...')) {
                                    ret[nvp.substring(3)] = nv[nvp];
                                    delete nv[nvp];
                                }
                            });
                            return ret;
                        });
                        returnRaw = true;
                    }
                }
            }
        } else {
            const value = getObjVal(row, field);
            curItem[propPrefix + propName] = value;
        }
    }
    return returnRaw ? curItem : [curItem];
}

declare global {
    interface Array<T> {
        init(val: T | ((item: T, index: number) => T), count?: number, start?: number): this;
        orderBy<R>(clause?: (item: T) => R): T[];
        orderByDescending<R>(clause?: (item: T) => R): T[];
        sortBy<R>(clause?: string | ((item: T) => R), desc?: boolean): T[];
        count(clause?: (item: T) => boolean): number;
        distinct<R>(clause?: string | ((item: T) => R), excludeNulls?: boolean): R[];
        distinctObj<R>(clause?: (item: T) => R): R[];
        sum(clause?: string | ((item: T) => number)): number;
        avg(clause?: string | ((item: T) => number)): number;
        max<R>(clause?: string | ((item: T) => R)): R;
        min<R>(clause?: string | ((item: T) => R)): R;
        first(clause?: string | ((item: T, index: number) => boolean)): T | null;
        last(clause?: string | ((item: T, index: number) => boolean)): T | null;
        removeAll(clause: ((item: T) => boolean) | T[]): this;
        addRange(items: T[]): this;
        addDistinctRange(items: T[]): this;
        groupBy<K, R = T>(
            clause: string | ((item: T) => K),
            filter?: (item: T) => boolean,
            keyObj?: (item: T, key: K) => R,
        ): Array<{ key: K; values: T[]; keyObj?: R }>;
        union<R>(clause?: T[] | ((item: T, index: number) => R[])): any[];
        remove(func: ((item: T) => boolean) | T): boolean | undefined;
        mapAsync<R>(callback: (item: T, index: number, array: T[]) => Promise<R>): Promise<R[]>;
        leftJoin<U>(rightArray: U[], onClause: (left: T, right: U) => boolean): Array<{ left: T; right: U | null }>;
        findAllIndex(clause: (item: T, index: number) => boolean, maxItems?: number): number[];
        flatten<R>(clause: any, filter?: (item: R) => boolean, templ?: any, propPrefix?: string): R[];
    }
}

Array.prototype.init = function <T>(val: T | ((item: T, index: number) => T), count?: number, start: number = 0): T[] {
    if (count === undefined || count === null) {
        count = this.length;
    }
    if (typeof val === 'function') {
        const func = val as (item: T, index: number) => T;
        while (start < count) {
            this[start] = func(this[start], start);
            start++;
        }
    } else {
        while (start < count) {
            this[start++] = val;
        }
    }
    return this;
};

Array.prototype.orderBy = function <T, R>(clause?: (item: T) => R): T[] {
    const tempArray: T[] = [];
    for (let i = 0; i < this.length; i++) {
        tempArray[tempArray.length] = this[i];
    }
    return tempArray.sort((a, b) => {
        const x = clause ? clause(a) : a;
        const y = clause ? clause(b) : b;
        if (!x && y) {
            return -1;
        } else if (x && !y) {
            return 1;
        }
        return x < y ? -1 : x > y ? 1 : 0;
    });
};

Array.prototype.orderByDescending = function <T, R>(clause?: (item: T) => R): T[] {
    const tempArray: T[] = [];
    for (let i = 0; i < this.length; i++) {
        tempArray[tempArray.length] = this[i];
    }
    return tempArray.sort((a, b) => {
        const x = clause ? clause(b) : b;
        const y = clause ? clause(a) : a;
        if (!x && y) {
            return -1;
        } else if (x && !y) {
            return 1;
        }
        return x < y ? -1 : x > y ? 1 : 0;
    });
};

Array.prototype.sortBy = function <T, R>(clause?: string | ((item: T) => R), desc?: boolean): T[] {
    if (clause && typeof clause === 'string') {
        const tmpSort = clause;
        clause = tmpSort.indexOf('.') > -1 ? (b: any) => getPathValue(b, tmpSort) : (b: any) => b[tmpSort];
    }
    return desc ? this.orderByDescending(clause as any) : this.orderBy(clause as any);
};

Array.prototype.count = function <T>(clause?: (item: T) => boolean): number {
    if (!clause) {
        return this.length;
    } else {
        return this.filter(clause).length;
    }
};

Array.prototype.distinct = function <T, R>(clause?: string | ((item: T) => R), excludeNulls?: boolean): R[] {
    let item: any;
    const dict: Record<string, boolean> = {};
    const retVal: R[] = [];
    const parsedClause = parseClause(clause as any);
    for (let i = 0; i < this.length; i++) {
        item = parsedClause ? parsedClause(this[i]) : this[i];
        if (excludeNulls && (item === null || item === undefined)) {
            continue;
        }
        if (!dict[item]) {
            dict[item] = true;
            retVal.push(item);
        }
    }
    return retVal;
};

Array.prototype.distinctObj = function <T, R>(clause?: (item: T) => R): R[] {
    let item: any;
    const retVal: R[] = [];
    for (let i = 0; i < this.length; i++) {
        item = clause ? clause(this[i]) : this[i];

        const keys = Object.keys(item);
        if (
            !retVal.some((d: any) => {
                let match = true;
                for (let i = 0; i < keys.length; i++) {
                    match = match && d[keys[i]] === item[keys[i]];
                }
                return match;
            })
        ) {
            retVal[retVal.length] = item;
        }
    }
    return retVal;
};

Array.prototype.sum = function <T>(clause?: string | ((item: T) => number)): number {
    let value = 0;
    let index: number;
    const parsedClause = parseClause(clause as any);

    if (parsedClause) {
        for (index = 0; index < this.length; index++) {
            value += (parsedClause(this[index]) as number) || 0;
        }
    } else {
        for (index = 0; index < this.length; index++) {
            value += parseFloat(this[index]) || 0;
        }
    }
    return value;
};

Array.prototype.avg = function <T>(clause?: string | ((item: T) => number)): number {
    let value = 0;
    let count = 0;
    let val: number;
    let index: number;
    const parsedClause = parseClause(clause as any);

    if (parsedClause) {
        for (index = 0; index < this.length; index++) {
            val = parseFloat(parsedClause(this[index]) as any);
            if (val || val === 0) {
                value = value + val;
                count++;
            }
        }
    } else {
        for (index = 0; index < this.length; index++) {
            val = parseFloat(this[index]);
            if (val || val === 0) {
                value = value + val;
                count++;
            }
        }
    }
    return count ? value / count : 0;
};

Array.prototype.max = function <T, R>(clause?: string | ((item: T) => R)): R {
    let value: any = 0;
    let index: number;
    let newVal: any;
    const parsedClause = parseClause(clause as any);
    if (parsedClause) {
        for (index = 0; index < this.length; index++) {
            newVal = parsedClause(this[index]) || 0;
            if (prepareAgreData(newVal) > prepareAgreData(value)) {
                value = newVal;
            }
        }
    } else {
        for (index = 0; index < this.length; index++) {
            newVal = this[index] || 0;
            if (prepareAgreData(newVal) > prepareAgreData(value)) {
                value = newVal;
            }
        }
    }
    return value;
};

Array.prototype.min = function <T, R>(clause?: string | ((item: T) => R)): R {
    let value: any = 0;
    let index: number;
    let newVal: any;
    const parsedClause = parseClause(clause as any);
    if (parsedClause) {
        for (index = 0; index < this.length; index++) {
            newVal = parsedClause(this[index]) || 0;
            if (prepareAgreData(newVal) < prepareAgreData(value)) {
                value = newVal;
            }
        }
    } else {
        for (index = 0; index < this.length; index++) {
            newVal = this[index] || 0;
            if (prepareAgreData(newVal) < prepareAgreData(value)) {
                value = newVal;
            }
        }
    }
    return value;
};

Array.prototype.first = function <T>(clause?: string | ((item: T, index: number) => boolean)): T | null {
    const parsedClause = parseClause(clause as any);
    if (parsedClause) {
        return this.filter(parsedClause as any).first();
    } else {
        if (this.length > 0) {
            return this[0];
        } else {
            return null;
        }
    }
};

Array.prototype.last = function <T>(clause?: string | ((item: T, index: number) => boolean)): T | null {
    const parsedClause = parseClause(clause as any);
    if (parsedClause) {
        return this.filter(parsedClause as any).last();
    } else {
        if (this.length > 0) {
            return this[this.length - 1];
        } else {
            return null;
        }
    }
};

Array.prototype.removeAll = function <T>(clause: ((item: T) => boolean) | T[]): T[] {
    const arr = this;
    if (typeof clause === 'function') {
        this.removeAll(this.filter(clause));
    } else if (Array.isArray(clause)) {
        clause.forEach((o: T) => arr.remove(o));
    }
    return arr;
};

Array.prototype.addRange = function <T>(items: T[]): T[] {
    if (items) {
        for (let i = 0; i < items.length; i++) {
            this.push(items[i]);
        }
    }
    return this;
};

Array.prototype.addDistinctRange = function <T>(items: T[]): T[] {
    if (items) {
        for (let i = 0; i < items.length; i++) {
            addDistinct(this, items[i]);
        }
    }
    return this;
};

Array.prototype.groupBy = function <T, K, R = T>(
    clause: string | ((item: T) => K),
    filter?: (item: T) => boolean,
    keyObj?: (item: T, key: K) => R,
): Array<{ key: K; values: T[]; keyObj?: R }> {
    const result: Array<{ key: K; values: T[]; keyObj?: R }> = [];
    const valObj: Record<string, { key: K; values: T[]; keyObj?: R }> = {};
    const parsedClause = parseClause(clause as any);
    const parsedKeyObj = parseClause(keyObj as any);

    for (let i = 0; i < this.length; i++) {
        const item = this[i];
        const key = parsedClause!(item) as K;
        let keyStr: string | null = null;
        if (typeof key === 'object') {
            keyStr = JSON.stringify(key);
        }
        let obj = valObj[keyStr || (key as any)];
        if (!obj) {
            obj = { key: key, values: [] };
            if (parsedKeyObj) {
                obj.keyObj = parsedKeyObj(item, key as any) as R;
            }
            result.push((valObj[keyStr || (key as any)] = obj));
        }
        if (!filter || filter(item)) {
            obj.values.push(item);
        }
    }
    return result;
};

Array.prototype.union = function <T>(clause?: T[] | ((item: T, index: number) => T[])): any[] {
    let result: any[] = [];
    if (!clause) {
        clause = this;
    } else if (Array.isArray(clause)) {
        result = this;
    }

    if (Array.isArray(clause)) {
        for (let i = 0; i < clause.length; i++) {
            result.addRange(clause[i] as any);
        }
    } else {
        this.forEach((item: T, idx: number) => {
            const newList = (clause as Function)(item, idx);
            if (newList) {
                result.addRange(newList);
            }
        });
    }
    return result;
};

Array.prototype.remove = function <T>(func: ((item: T) => boolean) | T): boolean | undefined {
    if (typeof func === 'function') {
        const predicate = func as (item: T) => boolean;
        for (let i = 0; i < this.length; i++) {
            if (predicate(this[i])) {
                this.splice(i, 1);
                return true;
            }
        }
    } else {
        const index = this.indexOf(func);
        if (index > -1) {
            this.splice(index, 1);
            return true;
        }
    }
};

Array.prototype.mapAsync = async function <T, R>(callback: (item: T, index: number, array: T[]) => Promise<R>): Promise<R[]> {
    return await Promise.all(this.map(callback));
};

Array.prototype.leftJoin = function <T, U>(rightArray: U[], onClause: (left: T, right: U) => boolean): Array<{ left: T; right: U | null }> {
    const result: Array<{ left: T; right: U | null }> = [];

    for (let i = 0; i < this.length; i++) {
        const left = this[i];
        const matches = rightArray.filter((right) => onClause(left, right));
        if (matches.length === 0) {
            result.push({ left: left, right: null });
        } else {
            matches.forEach((right) => {
                result.push({ left: left, right: right });
            });
        }
    }

    return result;
};

Array.prototype.findAllIndex = function <T>(clause: (item: T, index: number) => boolean, maxItems?: number): number[] {
    const source = this;
    const newArray: number[] = [];

    for (let index = 0; index < source.length && (!maxItems || maxItems > newArray.length); index++) {
        if (clause(source[index], index)) {
            newArray[newArray.length] = index;
        }
    }
    return newArray;
};

Array.prototype.flatten = function <T, R>(clause: any, filter?: (item: R) => boolean, templ?: any, propPrefix?: string): R[] {
    const $this = this;
    const thisLen = $this.length;
    const resultArray: R[] = [];
    for (let i = 0; i < thisLen; i++) {
        const row = $this[i];
        const result = getObject(row, clause, templ ? { ...templ } : {}, propPrefix);
        result.forEach((r: R) => {
            if (!filter || filter(r)) {
                resultArray.push(r);
            }
        });
    }
    return resultArray;
};
