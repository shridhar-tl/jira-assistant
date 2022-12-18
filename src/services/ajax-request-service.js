import browser from '../common/browsers';
import { executeService } from '../common/proxy';
import { isAppBuild } from '../constants/build-info';

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
            const request = {
                method,
                body: JSON.stringify(body),
                headers,
                credentials: withCredentials !== false && needsPermission !== false ? 'include' : 'omit',
                referrerPolicy: 'no-referrer'
            };

            if (isAppBuild) {
                return executeService('AjaxRequestService', 'execute', [url, request]);
            } else {
                const result = await this.httpFetch(url, request);
                return this._processResult(result);
            }
        } catch (err) {
            console.error(err);
            return Promise.reject({ status: 0, statusText: err.message, error: err });
        }
    }

    httpFetch(url, request) {
        return fetch(url, request);
    }

    async _processResult(result) {
        if (result.ok) {
            try {
                if (result.status !== 204) {
                    return await result.json();
                } else {
                    return {};
                }
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
    }
}