import browser from '../common/browsers';

export default class AjaxRequestService {
    // This class gets proxied when accessed as webapp
    // When new method is added or method name is changed in this class, this list has to be updated with the method name
    static availableMethods = ["execute"];
    static dependencies = ["AppBrowserService"];

    constructor($browser) {
        this.$browser = $browser;

        const headerObj = { 'Content-Type': 'application/json' };

        // Jira has issue with some user agent. Hence always customize it for Firefox
        if (browser.isFirefox || browser.isEdge) {
            headerObj["User-Agent"] = "Chrome";
        }

        this.httpOptions = {
            headers: headerObj
        };
        //// Jira has issue with user agent of firefox
        //if (typeof window['InstallTrigger'] !== 'undefined') {
        //  $.ajaxSetup({
        //    beforeSend: function (request) {
        //      console.log("chrome setting user agent");
        //      request.setRequestHeader("User-Agent", "Chrome");
        //    }
        //  });
        //}
    }

    async execute(method, url, params, customHeaders) {
        let body = params;

        if ((method || "GET").toUpperCase() === "GET") {
            body = undefined;
        }
        else {
            params = undefined;
        }

        const { withCredentials, needsPermission, json, ...remainingHeaders } = customHeaders || {};

        if (needsPermission !== false && withCredentials !== false && !await this.$browser.requestPermission(null, url)) {
            console.warn(`Permission not granted for ${url}.`);
        }

        const headers = { ...this.httpOptions.headers, ...remainingHeaders };
        if (json !== false) {
            headers['Content-Type'] = 'application/json';
        }
        try {
            const result = await fetch(url, {
                method,
                body: JSON.stringify(body),
                credentials: withCredentials !== false ? 'include' : undefined,
                referrerPolicy: 'no-referrer',
                headers,
            });

            if (result.ok) {
                try {
                    return await result.json();
                } catch (err) {
                    return Promise.reject({ status: -1, statusText: err.message, error: err });
                }
            } else {
                const { status, statusText, headers } = result;
                const type = headers.get('content-type');
                let error;
                if (type?.includes('json')) {
                    error = await result.json();
                }
                return Promise.reject({ status, statusText, error });
            }
        } catch (err) {
            console.error(err);
            return Promise.reject({ status: 0, statusText: err.message, error: err });
        }
    }
}