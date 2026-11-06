/* eslint-disable @typescript-eslint/no-unused-vars */
import { executeService } from '@/common';
import { BROWSER_NAME } from '@/common/browsers';
import { CHROME_WS_URL, StoreUrls } from '@/constants';

import AjaxRequestService from './ajax-request-service';
import BrowserBase from './browser-base';
import StorageService from './storage-service';

class BaseProxyService {
    protected svcName: string;
    [key: string]: any;

    constructor(svcName: string, methods: string | string[]) {
        if (typeof methods === 'string') {
            methods = methods.split(',');
        }
        this.svcName = svcName;

        methods.forEach((m: string) => {
            this[m] = function (...args: any[]) {
                return executeService(svcName, m, args);
            };
        });
    }
}

export class AjaxRequestProxyService extends BaseProxyService {
    constructor() {
        super('AjaxRequestService', AjaxRequestService.availableMethods);
    }
}

export class BrowserProxyService extends BaseProxyService {
    constructor() {
        super('AppBrowserService', BrowserBase.availableMethods);
    }

    openTab(url: string, name?: string, opts?: string): void {
        window.open(url, name, opts);
    }

    getStoreUrl(): string {
        return StoreUrls[BROWSER_NAME] || CHROME_WS_URL;
    }

    connectAndKeepAlive(_onChange?: () => void): void {
        // ToDo: Keep alive function has to be added from content script for it to work
    }
}

export class StorageProxyService extends BaseProxyService {
    constructor() {
        super('StorageService', StorageService.availableMethods);
    }
}
