import { AppVersionNo, AnalyticsTrackingId, AnalyticsUrl } from "../_constants";

export default class AnalyticsService {
    static dependencies = ["AppBrowserService", "AjaxService"];

    constructor($jaBrowserExtn, $ajax) {
        $jaBrowserExtn.getAppVersion().then((version) => {
            this.versionNumber = version || AppVersionNo;
        }, () => this.versionNumber = AppVersionNo);
        this.$ajax = $ajax;
    }

    send(obj) {
        //const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        //const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const origin = document.location.origin;
        const { availHeight, availWidth, height, width, pixelDepth } = window.screen;

        const data = {
            v: 1,
            tid: AnalyticsTrackingId,
            uid: this.JAInstId,
            //cid: "",// need to check
            //je: 0,
            ul: navigator?.language?.toLowerCase(),
            de: document.charset,
            sd: `${pixelDepth}-bit`,
            td: document.title,
            dh: origin,
            dl: origin,
            sr: `${availWidth}x${availHeight}`,
            vp: `${width}x${height}`,
            ...this.getPageView(this.currentPage),
            ...obj
        };

        const url = this.$ajax.prepareUrl(AnalyticsUrl, data);
        const imgTag = document.createElement('img');
        imgTag.onload = removeImageOnLoad;
        imgTag.onerror = removeImageOnLoad;
        imgTag.width = 1;
        imgTag.height = 1;
        imgTag.src = url;
        document.body.append(imgTag);
    }

    getPageView(path) {
        return { t: "pageview", dp: path };
    }

    getEventObject(category, action, label, value) {
        const obj = { t: "event", ec: category, ea: action };
        if (label) {
            obj.el = label;
        }
        if (value) {
            obj.ev = value;
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
            window.ga('set', 'userId', uid);
        }
    }

    trackEvent(event, category, label, value) {
        if (!this.enableLogging) {
            return false;
        }

        label = label || this.getCurrentRouteUrl();

        window.ga('send', 'event', category, event, label, value);
        this.send(this.getEventObject(category, event, label, value));
    }

    trackError(err, fatal) {
        if (!this.enableExceptionLogging) {
            return false;
        }

        const exd = this.getExceptionDetails(err);

        window.ga('send', 'exception', {
            'exDescription': exd,
            'exFatal': fatal || false
        });

        this.send({ t: "exception", exd, exf: fatal ? 1 : 0 });
    }

    getExceptionDetails(err) {
        if (err) {
            if (typeof err === "object") {
                if (err.promise && err.reason) {
                    const { status, response } = err.reason;
                    err = { status, response };
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
        let page = document.location.hash.substring(1);

        if (page === "/") {
            page = "/dashboard";
        }

        return page;
    }

    trackPageView(page) {
        if (!this.enableLogging) {
            return false;
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

        page = `v${this.versionNumber}/index.html${page}`;
        this.currentPage = page;

        window.ga('set', 'page', page);
        window.ga('send', 'pageview', page);
        this.send(this.getPageView(page));
    }
}

function removeImageOnLoad() {
    this.remove();
}