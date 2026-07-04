import browsers from '../utils/browsers';

import ChromeService from './browser-chrome-service';
import EdgeService from './browser-edge-service';
import FirefoxService from './browser-firefox-service';
import { inject, injectable } from './injector';

export function injectProdBrowserServices(): void {
    if (import.meta.env.PROD) {
        if (browsers.isEdge) {
            console.log('Edge Browser service injected');
            injectable(EdgeService, 'AppBrowserService', '$jaBrowserExtn', { isSingleton: true });
        } else if (browsers.isFirefox) {
            console.log('Firefox Browser service injected');
            injectable(FirefoxService, 'AppBrowserService', '$jaBrowserExtn', { isSingleton: true });
        } else {
            console.log('Chrome Browser service injected');
            injectable(ChromeService, 'AppBrowserService', '$jaBrowserExtn', { isSingleton: true });
        }
    }
}

export class AnalyticsServiceFake {
    setIfEnabled() {
        /* Fake service. Nothing to do here */
    }
    trackEvent() {
        /* Fake service. Nothing to do here */
    }
    trackError() {
        /* Fake service. Nothing to do here */
    }
    setUserId() {
        /* Fake service. Nothing to do here */
    }
    trackPageView() {
        /* Fake service. Nothing to do here */
    }
}

export { inject, injectable };
