import AjaxRequestService from './ajax-request-service';
import DevService from './browser-dev-service';
import StorageService from './storage-service';
import { AjaxRequestProxyService, BrowserProxyService, StorageProxyService } from './proxy-service';
import { injectable, inject, injectProdBrowserServices } from './index.common';
import { isAppBuild, isWebBuild } from '../constants/build-info';
import registerServices from './index.register';

export { inject };

let _isReady = false;

export default registerServices;

export function registerDepnServices(authType) {
    if (!authType) { authType = true; }

    if (_isReady === authType) { return; }

    registerServices();

    const injectProxy = isWebBuild && authType === '1';

    injectable(injectProxy ? AjaxRequestProxyService : AjaxRequestService, "AjaxRequestService", "$request", { isSingleton: true });
    injectable(injectProxy ? StorageProxyService : StorageService, "StorageService", "$storage", { isSingleton: true });

    if (injectProxy || isAppBuild) {
        console.log("Proxy Browser service injected");
        injectable(BrowserProxyService, "AppBrowserService", "$jaBrowserExtn", { isSingleton: true });
    }
    else if (!isWebBuild && process.env.NODE_ENV === "production") {
        injectProdBrowserServices();
    }
    else {
        console.log("Web Browser service injected");
        injectable(DevService, "AppBrowserService", "$jaBrowserExtn", { isSingleton: true });
    }

    _isReady = authType;
}

export function readyToInject() { return !!_isReady; }