declare global {
    interface Number {
        pad(size?: number): string;
    }

    interface Date {
        isBetween(fromDate: Date | string | number, toDate: Date | string | number): boolean;
        format(separator?: string): string;
        toUTCDate(): Date;
        addDays(days: number): Date;
    }

    interface String {
        format(...args: any[]): string;
        startsWith(str: string): boolean;
        endsWith(str: string): boolean;
        clearEnd(str: string | string[]): string;
        clearStart(str: string | string[]): string;
    }

    interface Array<T> {
        flatten(clause: any, filter?: ((item: any) => boolean) | null, templ?: any | null, propPrefix?: string): any[];
        orderBy<K>(clause?: string | ((item: T) => K), isDesc?: boolean): T[];
    }
}

Number.prototype.pad = function (size?: number): string {
    let s = String(this);
    while (s.length < (size || 2)) {
        s = `0${s}`;
    }
    return s;
};

const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = [
    'January',
    'Febraury',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const TINY_DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

Date.prototype.isBetween = function (fromDate: Date | string | number, toDate: Date | string | number): boolean {
    let fromTime: number;
    let toTime: number;

    if (typeof fromDate !== 'number') {
        fromTime = new Date(fromDate).getTime();
    } else {
        fromTime = fromDate;
    }

    if (typeof toDate !== 'number') {
        toTime = new Date(toDate).getTime();
    } else {
        toTime = toDate;
    }

    const curDate = this.getTime();

    return fromTime <= curDate && curDate <= toTime;
};

Date.prototype.format = function (seperat?: string): string {
    const yyyy = this.getFullYear();
    const mm = this.getMonth() < 9 ? `0${this.getMonth() + 1}` : this.getMonth() + 1;
    const dd = this.getDate() < 10 ? `0${this.getDate()}` : this.getDate();
    const hh = this.getHours() < 10 ? `0${this.getHours()}` : this.getHours();
    const min = this.getMinutes() < 10 ? `0${this.getMinutes()}` : this.getMinutes();
    const ss = this.getSeconds() < 10 ? `0${this.getSeconds()}` : this.getSeconds();

    if (seperat) {
        return seperat
            .replace('yyyy', String(yyyy))
            .replace('yy', String(yyyy))
            .replace('MMMM', FULL_MONTH_NAMES[Number(mm) - 1])
            .replace('MMM', SHORT_MONTH_NAMES[Number(mm) - 1])
            .replace('MM', String(mm))
            .replace('DDDD', FULL_DAY_NAMES[this.getDay()])
            .replace('DDD', SHORT_DAY_NAMES[this.getDay()])
            .replace('dddd', FULL_DAY_NAMES[this.getDay()])
            .replace('ddd', SHORT_DAY_NAMES[this.getDay()])
            .replace('DD', TINY_DAY_NAMES[this.getDay()])
            .replace('dd', String(dd))
            .replace('HH', String(hh))
            .replace('H', String(Number(hh)))
            .replace('hh', Number(hh) > 12 ? (Number(hh) - 12).pad(2) : String(hh))
            .replace('mm', String(min))
            .replace('ss', String(ss))
            .replace('tt', Number(hh) >= 12 ? 'PM' : 'AM');
    } else {
        return ''.concat(String(yyyy)).concat(String(mm)).concat(String(dd)).concat(String(hh)).concat(String(min)).concat(String(ss));
    }
};

Date.prototype.toUTCDate = function (): Date {
    const newObj = new Date(this.getTime());
    newObj.setMinutes(newObj.getMinutes() + this.getTimezoneOffset());
    return newObj;
};

Date.prototype.addDays = function (days: number): Date {
    const dat = new Date(this);
    dat.setDate(dat.getDate() + days);
    return dat;
};

String.prototype.format = function (...args: any[]): string {
    let actualArgs = args;
    if (args && args.length === 1 && Array.isArray(args[0])) {
        actualArgs = args[0];
    }

    if (actualArgs && !Array.isArray(actualArgs)) {
        actualArgs = [actualArgs];
    }
    let str: string = this as string;
    for (let i = 0; i < actualArgs.length; i++) {
        str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), actualArgs[i]);
    }
    return str.toString();
};

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (str: string): boolean {
        return this.toLowerCase().indexOf(str.toLowerCase()) === 0;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (str: string): boolean {
        return this.toLowerCase().lastIndexOf(str.toLowerCase()) === this.length - str.length;
    };
}

if (!String.prototype.clearEnd) {
    String.prototype.clearEnd = function (str: string | string[]): string {
        let s: string = this as string;
        if (Array.isArray(str)) {
            let stop = false;
            while (s && !stop) {
                let mod = false;
                str.forEach((st) => {
                    const newStr = s.clearEnd(st);
                    if (s !== newStr) {
                        s = newStr;
                        mod = true;
                    }
                });
                stop = !mod;
            }
        } else {
            while (s.endsWith(str)) {
                s = s.substring(0, s.length - str.length);
            }
        }
        return s.toString();
    };
}

if (!String.prototype.clearStart) {
    String.prototype.clearStart = function (str: string | string[]): string {
        let s: string = this as string;
        if (Array.isArray(str)) {
            let stop = false;
            while (s && !stop) {
                let mod = false;
                str.forEach((st) => {
                    const newStr = s.clearStart(st);
                    if (s !== newStr) {
                        s = newStr;
                        mod = true;
                    }
                });
                stop = !mod;
            }
        } else {
            while (s.startsWith(str)) {
                s = s.substring(str.length);
            }
        }
        return s.toString();
    };
}

if (!Array.prototype.orderBy) {
    Array.prototype.orderBy = function <T, K>(clause?: string | ((item: T) => K), isDesc?: boolean): T[] {
        const tempArray = [...this];
        const parsedClause = typeof clause === 'string' ? (item: any) => item[clause] : clause;

        return tempArray.sort((a, b) => {
            const x = parsedClause ? parsedClause(isDesc ? b : a) : isDesc ? b : a;
            const y = parsedClause ? parsedClause(isDesc ? a : b) : isDesc ? a : b;
            if (!x && y) {
                return -1;
            } else if (x && !y) {
                return 1;
            }
            return x < y ? -1 : x > y ? 1 : 0;
        });
    };
}

if (!Array.prototype.flatten) {
    Array.prototype.flatten = function (
        clause: any,
        filter?: ((item: any) => boolean) | null,
        templ?: any | null,
        propPrefix?: string,
    ): any[] {
        const getColsArr = (obj: Record<string, any>): string[] => {
            let cols = Object.keys(obj);
            if (cols.filter((c) => c.startsWith('~~')).length > 1) {
                throw Error('#Error: Multiple array recursion not allowed');
            }
            cols = cols.orderBy((c) => (c.startsWith('~~') ? 2 : 1));
            return cols;
        };

        const getObjVal = (row: any, prop: string | Function): any => {
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
        };

        const getObject = (row: any, clause: any, curItem: any, propPrefix?: string): any[] => {
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
                    let newVal;

                    if (value) {
                        if (!repeatOnVal) {
                            newVal = props ? getObject(value, props, spread ? curItem : {}, spread ? propName : '') : value;
                            if (!spread) {
                                curItem[propPrefix + propName] = newVal;
                            }
                        } else if (Array.isArray(value)) {
                            newVal = props ? value.flatten(props, undefined, spread ? curItem : null, spread ? propName : '') : value;
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
        };

        const resultArray: any[] = [];
        for (let i = 0; i < this.length; i++) {
            const row = this[i];
            const result = getObject(row, clause, templ ? { ...templ } : {}, propPrefix);
            result.forEach((r) => {
                if (!filter || filter(r)) {
                    resultArray.push(r);
                }
            });
        }
        return resultArray;
    };
}

export {};
