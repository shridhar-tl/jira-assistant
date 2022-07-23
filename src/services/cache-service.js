import { set, get } from '../common/storage-helpers';

export default class CacheService {
    constructor() {
        this.varStorage = {};
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
            get: (key) => this.varStorage[key],
            getPromise: (key) => new Promise((resolve, reject) => resolve(this.session.get(key))),
            clear: () => { this.varStorage = {}; }
        };
        this.storage = localStorage;
    }
    set(key, value, expires, raw) { set(this.storage, key, value, expires, raw); }
    get(key, raw) { return get(this.storage, key, raw); }
    remove(key) { this.set(key, null, null); }
    clear() { this.storage.clear(); }
}
