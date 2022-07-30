import AjaxRequestService from "./ajax-request-service";
import BrowserBase from "../common/BrowserBase";
import StorageService from "./storage-service";
import { executeService } from "../common/proxy";
import { AppVersionNo } from "../constants/common";

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
    }

    async getAppVersion() { return AppVersionNo; }
    async hasUpdates() { return false; }
    openTab(url) { window.open(url); }
}

export class StorageProxyService extends BaseProxyService {
    constructor() { super("StorageService", StorageService.availableMethods); }
}