import { get, set } from '../common/storage-helpers';

export default class CacheService {
    private varStorage: Record<string, any> = {};
    private storage: Storage;

    constructor() {
        this.storage = localStorage;
    }

    session = {
        set: (key: string, value: any): any => {
            if (!key) {
                return;
            }
            if (value !== undefined && value !== null) {
                this.varStorage[key] = value;
            } else {
                delete this.varStorage[key];
            }
            return value;
        },
        get: (key: string): any => this.varStorage[key],
        getPromise: (key: string): Promise<any> => Promise.resolve(this.session.get(key)),
        clear: (): void => {
            this.varStorage = {};
        },
    };

    set(key: string, value: any, expires?: number | Date, raw?: boolean): void {
        set(this.storage, key, value, expires, raw);
    }

    get(key: string, raw?: boolean): any {
        return get(this.storage, key, raw);
    }

    remove(key: string): void {
        this.set(key, null);
    }

    clear(): void {
        this.storage.clear();
    }
}
