import AjaxRequestService from './ajax-request-service';
import DevService from './browser-dev-service';
import StorageService from './storage-service';
import { injectable, inject } from './index.common';
import registerServices from './index.register';

export { inject };

let _isReady = false;

export default registerServices;

export function registerDepnServices() {
    if (_isReady) { return; }

    registerServices();

    injectable(AjaxRequestService, "AjaxRequestService", "$request", { isSingleton: true });
    injectable(StorageService, "StorageService", "$storage", { isSingleton: true });
    injectable(DevService, "AppBrowserService", "$jaBrowserExtn", { isSingleton: true });

    _isReady = true;
}

export function readyToInject() { return _isReady; }