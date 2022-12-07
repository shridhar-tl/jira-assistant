import { prepareUrlWithQueryString } from "../common/utils";
import { AnalyticsUrl } from "../constants/urls";
import { AppVersionNo, AnalyticsTrackingId } from "../constants/common";
import { isWebBuild } from "../constants/build-info";

export default class AnalyticsService {
    constructor() {
        this.enableLogging = true;
        this.enableExceptionLogging = true;
        //this.gtag = window.gtag;
        this.gtag = function () { /* Do nothing */ };
        this.temp = { prepareUrlWithQueryString, AnalyticsUrl, AnalyticsTrackingId, removeImageOnLoad }; // Temp: ToDo: remove this
    }

    send(obj) {
        //const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        //const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const origin = document.location.origin;
        const { availHeight, availWidth, height, width, pixelDepth } = window.screen;

        const data = {
            v: 2,
            tid: AnalyticsTrackingId,
            uid: this.JAInstId,
            _p: Math.round(2147483647 * Math.random()),
            cid: this.JAInstId,
            ul: navigator?.language?.toLowerCase(),
            sr: `${availWidth}x${availHeight}`,
            _s: 1,
            sid: new Date() * 1,
            dl: origin,
            dt: document.title,
            en: 'page_view',
            _ee: 1,
            //dr: origin, Use to send referrer url
            //gtm:'2oe7r0', //Container Hash: need to check
            //sct:1, // Session Count: need to check
            //seg:1, // Session Engagement: need to check
            //aip:1, // to anonymize the ip address
            //_z:'ccd.v9B', // need to check

            // not available in latest version necessary
            vp: `${width}x${height}`,
            //de: document.charset,
            sd: `${pixelDepth}-bit`,
            //dh: origin,

            // t:  'pageview', 'screenview', 'event', 'transaction', 'item', 'social', 'exception', 'timing'.
            ...this.getPageView(this.currentPage),
            ...obj
        };

        const url = prepareUrlWithQueryString(AnalyticsUrl, data);
        if (typeof document !== 'undefined') {
            const imgTag = document.createElement('img');
            imgTag.onload = removeImageOnLoad;
            imgTag.onerror = removeImageOnLoad;
            imgTag.width = 1;
            imgTag.height = 1;
            imgTag.src = url;
            document.body.append(imgTag);
        } else {
            console.log('Analytics not hit:', url);
        }
    }

    getPageView(path) {
        return { t: "pageview", dp: path, dl: path };
    }

    getEventObject(category, action, label, value) {
        const obj = { en: category, 'ep.event': action, _et: new Date().getTime() };
        if (label) {
            obj['ep.label'] = label;
        }
        if (value) {
            obj['ep.value'] = value;
        }
        return obj;
    }

    setIfEnabled(enableLogging, enableException) {
        this.enableLogging = enableLogging;
        this.enableExceptionLogging = enableException;
    }

    setUserId(uid) {
        if (uid) {
            this.JAInstId = uid;
            this.gtag('set', 'userId', uid);
        }
    }

    trackEvent(event, category, label, value) {
        if (!this.enableLogging) {
            return false;
        }

        label = label || this.getCurrentRouteUrl();

        this.gtag('event', category, { event, label, value });
        this.send(this.getEventObject(category, event, label, value));
    }

    trackError(err, fatal) {
        if (!this.enableExceptionLogging) {
            return false;
        }

        const exd = this.getExceptionDetails(err);

        this.gtag('event', 'exception', {
            'description': exd,
            'fatal': fatal || false
        });

        this.send({ en: "exception", 'ep.description': exd, 'ep.fatal': fatal ? 'true' : 'false' });
    }

    getExceptionDetails(err) {
        if (err) {
            if (typeof err === "object") {
                if (err.promise && err.reason) {
                    const { status, response, error } = err.reason;
                    err = { status, response, error };
                }

                try {
                    return JSON.stringify(err);
                }
                catch (e) {
                    return this.searilizeObj(err);
                }
            }
            else {
                return this.searilizeObj(err);
            }
        }
        else {
            return `Error occured:- ${typeof err}`;
        }
    }

    searilizeObj(obj, depth) {
        depth = depth || 0;

        try {
            const result = Object.keys(obj).reduce((res, key) => {
                let val = obj[key];
                if (typeof val === "object") {
                    if (key.startsWith("_") || depth > 0) {
                        return res;
                    }
                    val = this.searilizeObj(val, depth + 1);
                }

                res[key] = val;
                return res;
            }, {});

            if (!depth) {
                return JSON.stringify(result);
            }
            else {
                return result;
            }
        }
        catch (e) { return "Unknown error: Unable to searilize"; }
    }

    getCurrentRouteUrl() {
        let page = (isWebBuild ? document.location.pathname : document.location.hash).substring(1);
        if (isWebBuild && !page) {
            page = document.location.hash;
        }

        if (page === "/") {
            page = "/dashboard";
        }

        return page;
    }

    trackPageView(page) {
        if (!this.enableLogging) {
            return;
        }

        if (!page) {
            page = this.getCurrentRouteUrl();
        }

        try {
            const parts = page.split("/");
            if (!isNaN(parts[1])) {
                page = page.substring(parts[1].length + 1);
            }
        } catch (e) {
            console.error("Error tracking", e);
        }

        page = getVirtualUrl(AppVersionNo, page);
        this.currentPage = page;

        this.gtag('set', 'page', page);
        this.gtag('send', 'pageview', page);
        this.send(this.getPageView(page));
    }
}

function removeImageOnLoad() {
    this.remove();
}

function getVirtualUrl(versionNo, path) {
    const url = new URL(document.location.href);
    const origin = url.protocol.startsWith('http') ? url.origin : `v${versionNo}`;
    return `${origin}${path}${url.search}`;
}