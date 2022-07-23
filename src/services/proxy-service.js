import AjaxRequestService from "./ajax-request-service";
import BrowserBase from "../common/BrowserBase";
import StorageService from "./storage-service";
import { executeService } from "../common/proxy";
import { AppVersionNo } from "../_constants";

class BaseProxyService {
    constructor(svcName, methods) {
        if (typeof methods === 'string') {
            methods = methods.split(',');
        }
        this.svcName = svcName;

        methods.forEach(m => {
            this[m] = function () { return executeService(svcName, m, Array.from(arguments)); };
        });
    }
}

export class AjaxRequestProxyService extends BaseProxyService {
    constructor() { super("AjaxRequestService", AjaxRequestService.availableMethods); }
}

export class BrowserProxyService extends BaseProxyService {
    constructor() {
        super("AppBrowserService", BrowserBase.availableMethods);
        /* ToDo: Needto remove if everything is working well
        this.localCache = {};
        // This would pull all the tiny local storage data from extension and store it in this object
        $storage.getAllCachedValues().then(data => {
            this.localCache = data;
            // Future: if length property is required, that has to be implemented
        });

        // Mock the local storage so that WebApp can continue to use proxied localStorage
        this.localStorageProxy = {
            setItem: (key, value, expires, raw) => {
                if (moment.isMoment(expires)) {
                    expires = expires.toDate();
                }

                $storage.setItem(key, value, expires, raw);
                this.localCache[key] = convertToStorableValue(value, expires, raw);
            },
            getItem: (key, raw) => convertToUsableValue(this.localCache[key], raw),
            removeItem: (key) => {
                delete this.localCache[key];
                $storage.removeItem(key);
            },
            clear: () => {
                this.localCache = {};
                $storage.clear();
            }
        };*/
    }

    async getAppVersion() { return AppVersionNo; }
    async hasUpdates() { return false; }
    openTab(url) { window.open(url); }
}

export class StorageProxyService extends BaseProxyService {
    constructor() { super("StorageService", StorageService.availableMethods); }
}