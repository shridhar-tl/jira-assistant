import { injectable, inject } from './injector-service';
import browsers from '../common/browsers';
import ChromeService from './browser-chrome-service';
import FirefoxService from './browser-firefox-service';
import EdgeService from './browser-edge-service';

function injectProdBrowserServices() {
    if (process.env.NODE_ENV === "production") {
        if (browsers.isEdge) {
            console.log("Edge Browser service injected");
            injectable(EdgeService, "AppBrowserService", "$jaBrowserExtn", { isSingleton: false });
        }
        else if (browsers.isFirefox) {
            console.log("Firefox Browser service injected");
            injectable(FirefoxService, "AppBrowserService", "$jaBrowserExtn", { isSingleton: false });
        }
        else {
            console.log("Chrome Browser service injected");
            injectable(ChromeService, "AppBrowserService", "$jaBrowserExtn", { isSingleton: false });
        }
    }
}

class AnalyticsServiceFake {
    setIfEnabled() { /* Fake service. Nothing to do here */ }
    trackEvent() { /* Fake service. Nothing to do here */ }
    trackError() { /* Fake service. Nothing to do here */ }
    setUserId() { /* Fake service. Nothing to do here */ }
}

export { AnalyticsServiceFake, injectable, inject, injectProdBrowserServices };