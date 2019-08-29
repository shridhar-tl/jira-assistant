import * as moment from 'moment';

export default class CacheService {
    static dependencies = ["AppBrowserService", "UtilsService"];

    constructor($jaBrowserExtn, $utils) {
        this.$jaBrowserExtn = $jaBrowserExtn;
        this.$utils = $utils;
        this.varStorage = {};
        this.reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/;
        this.session = {
            set: (key, value) => {
                if (!key) {
                    return;
                }
                if (value) {
                    this.varStorage[key] = value;
                }
                else {
                    delete this.varStorage[key];
                }
                return value;
            },
            get: (key) => {
                return this.varStorage[key];
            },
            getPromise: (key) => new Promise((resolve, reject) => resolve(this.session.get(key))),
            clear: () => { this.varStorage = {}; }
        };
        this.lob = {
            set: (key, value, expires) => {
                if (!key) {
                    return;
                }
                if (value) {
                    value = { value: value };
                    if (expires) {
                        if (typeof (expires) === "number" && expires > 0) {
                            value.expires = moment().add(expires, 'days').toDate();
                        }
                        else if (expires instanceof Date) {
                            value.expires = expires;
                        }
                        else if (moment.isMoment(expires)) {
                            value.expires = expires.toDate();
                        }
                    }
                    if (this.storage.set) {
                        const obj = {};
                        obj[key] = value;
                        this.storage.set(obj);
                    }
                    else {
                        this.storage[key] = value;
                    }
                }
                else {
                    this.storage.remove(key);
                }
                return value;
            },
            get: (key) => {
                return new Promise((resolve, reject) => {
                    const process = (data) => {
                        if (data && (data = data[key])) {
                            if (data.expires) {
                                const exp = moment(data.expires);
                                if (exp.diff(moment()) > 0) {
                                    data.value = null;
                                }
                            }
                            data = data.value;
                        }
                        resolve(data);
                    };
                    if (this.storage.get) {
                        this.storage.get(key, process);
                    }
                    else {
                        process(this.storage[key]);
                    }
                });
            },
            remove: (key) => { this.lob.set(key, null); },
            clear: () => { this.storage.clear(); }
        };
        this.storage = $jaBrowserExtn.getStorage();
    }
    set(key, value, expires, raw) {
        if (!key) {
            return;
        }
        if (value) {
            if (!raw) {
                value = { value: value };
                if (expires) {
                    if (typeof expires === "number" && expires > 0) {
                        value.expires = moment().add(expires, 'days').toDate();
                    }
                    else if (expires instanceof Date) {
                        value.expires = expires;
                    }
                    else if (moment.isMoment(expires)) {
                        value.expires = expires.toDate();
                    }
                }
                value = this.stringify(value);
            }
            if (typeof (value) === "object") {
                value = this.stringify(value);
            }
            localStorage.setItem(key, value);
        }
        else {
            localStorage.removeItem(key);
        }
        return value;
    }
    get(key, raw) {
        let data = localStorage.getItem(key);
        if (raw) {
            return data;
        }
        if (data) {
            data = this.parse(data);
            if (data.expires) {
                const exp = moment(data.expires);
                if (exp.diff(moment()) > 0) {
                    data.value = null;
                }
            }
            data = data.value;
        }
        return data;
    }
    remove(key) { this.set(key, null, null); }
    clear() { localStorage.clear(); }
    parse(value) {
        return JSON.parse(value, (key, val) => {
            if (val && typeof val === "string" && val.startsWith("/Date(")) {
                return this.$utils.convertDate(val);
            }
            return val;
        });
    }
    stringify(value) {
        return JSON.stringify(value, (key, val) => {
            if (val && val instanceof Date) {
                return `/Date(${val.getTime()})/`;
            }
            else if (val && typeof val === "string") {
                const a = this.reISO.test(val); //reISO.exec(val);
                if (a) {
                    return `/Date(${new Date(val).getTime()})/`; //Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6])
                    //this[key] = val;
                    //return val;
                }
            }
            return val;
        });
    }
}
