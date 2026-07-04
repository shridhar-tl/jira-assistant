import { isAppBuild, isWebBuild } from '../constants/build-info';

import AjaxRequestService from './ajax-request-service';
import DevService from './browser-dev-service';
import { inject, injectable, injectProdBrowserServices } from './index-common';
import registerServices from './index-register';
import { AjaxRequestProxyService, BrowserProxyService, StorageProxyService } from './proxy-service';
import StorageService from './storage-service';

export { inject };

let _isReady: boolean | string = false;

export default registerServices;

export function registerDepnServices(authType?: string | boolean) {
    if (!authType) {
        authType = true;
    }

    if (_isReady === authType) {
        return;
    }

    registerServices();

    const injectProxy = isWebBuild && authType === '1';

    injectable(injectProxy ? AjaxRequestProxyService : (AjaxRequestService as any), 'AjaxRequestService', '$request', {
        isSingleton: true,
    });
    injectable(injectProxy ? StorageProxyService : (StorageService as any), 'StorageService', '$storage', { isSingleton: true });

    if (injectProxy || isAppBuild) {
        console.log('Proxy Browser service injected');
        injectable(BrowserProxyService, 'AppBrowserService', '$jaBrowserExtn', { isSingleton: true });
    } else if (!isWebBuild && import.meta.env.PROD) {
        injectProdBrowserServices();
    } else {
        console.log('Web Browser service injected');
        injectable(DevService, 'AppBrowserService', '$jaBrowserExtn', { isSingleton: true });
    }

    _isReady = authType;
}

export function readyToInject() {
    return !!_isReady;
}
