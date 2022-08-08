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

        this._executeSvc = function (m) { return function () { return executeService(svcName, m, Array.from(arguments)); }; };
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

    // This function should be removed once users starts using v2.41 of extension
    filterReports = async (filter) => {
        try {
            return await this._executeSvc('filterReports')(filter);
        } catch (err) {
            const reports = await this._executeSvc('getReportsByUserId')(filter.createdBy);
            const allKeys = Object.keys(filter);
            return reports.filter(u => allKeys.every(k => u[k] === filter[k]));
        }
    };

    // This function should be removed once users starts using v2.41 of extension
    filterUsers = async (filter) => {
        try {
            return await this._executeSvc('filterUsers')(filter);
        } catch (err) {
            const users = await this._executeSvc('getAllUsers')();
            const allKeys = Object.keys(filter);
            return users.filter(u => allKeys.every(k => u[k] === filter[k]));
        }
    };
}