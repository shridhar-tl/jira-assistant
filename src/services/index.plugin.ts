import AjaxRequestService from './ajax-request-service';
import DevService from './browser-dev-service';
import { inject, injectable } from './index-common';
import registerServices from './index-register';
import StorageService from './storage-service';

export { inject };

let _isReady = false;

export default registerServices;

export function registerDepnServices(): void {
    if (_isReady) {
        return;
    }

    registerServices();

    injectable(AjaxRequestService, 'AjaxRequestService', '$request', { isSingleton: true });
    injectable(StorageService, 'StorageService', '$storage', { isSingleton: true });
    injectable(DevService, 'AppBrowserService', '$jaBrowserExtn', { isSingleton: true });

    _isReady = true;
}

export function readyToInject(): boolean {
    return _isReady;
}
