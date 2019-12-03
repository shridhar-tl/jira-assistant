export default class AnalyticsService {
    static dependencies = ["AppBrowserService"];

    constructor($jaBrowserExtn) {
        window['_gaq'] = window['_gaq'] || []; // Need to check if this line is required or not

        $jaBrowserExtn.getAppVersion().then((version) => {
            this.versionNumber = version || 0;
        }, () => this.versionNumber = 0.88);
    }

    setUserId(uid) {
        if (uid) {
            window.JAInstId = uid;
            window.ga('set', 'userId', uid);
        }
    }

    trackEvent(event, category, label, value) {
        window.ga('send', 'event', category, event, label || this.getCurrentRouteUrl(), value);

        ////_gaq.push(['_trackPageView', $location.url()]);
        //window['_gaq'].push(['_trackEvent', page, event]);
        ////ga('send', 'pageview', $location.path());
    }

    trackError(err, fatal) {
        window.ga('send', 'exception', {
            'exDescription': this.getExceptionDetails(err),
            'exFatal': fatal || false
        });
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

        window.ga('set', 'page', page);
        window.ga('send', 'pageview', page);
        //window['_gaq'].push(['_trackPageview', `v${this.versionNumber}/index.html${page}`]);
    }
}
