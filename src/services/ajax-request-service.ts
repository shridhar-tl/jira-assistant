import { executeService } from '@/common/proxy';
import { isAppBuild } from '@/constants/build-info';

import type AppBrowserService from './app-browser-service';

export interface HttpOptions {
    headers: Record<string, string>;
}

export interface CustomHeaders {
    withCredentials?: boolean;
    needsPermission?: boolean;
    json?: boolean;
    [key: string]: any;
}

export interface HttpRequest {
    method: string;
    body?: string;
    headers: Record<string, string>;
    credentials: 'include' | 'omit';
    referrerPolicy: string;
}

const browser = {
    isFirefox: navigator.userAgent.toLowerCase().includes('firefox'),
    isEdge: navigator.userAgent.toLowerCase().includes('edg/'),
};

export default class AjaxRequestService {
    static availableMethods = ['execute'];
    static dependencies = ['AppBrowserService'];

    protected $browser: AppBrowserService;
    protected httpOptions: HttpOptions;

    constructor($browser: AppBrowserService) {
        this.$browser = $browser;

        const headerObj: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Jira has issue with some user agent. Hence always customize it for Firefox
        if (browser.isFirefox || browser.isEdge) {
            headerObj['User-Agent'] = 'Chrome';
        }

        this.httpOptions = {
            headers: headerObj,
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

    async execute<T = any>(method: string, url: string, params?: any, customHeaders?: CustomHeaders): Promise<T> {
        let body = params;

        if ((method || 'GET').toUpperCase() === 'GET') {
            body = undefined;
        } else {
            params = undefined; // eslint-disable-line
        }

        const { withCredentials, needsPermission, json, ...remainingHeaders } = customHeaders || {};

        if (needsPermission !== false && withCredentials !== false && !(await this.$browser.requestPermission(null, url))) {
            console.warn(`Permission not granted for ${url}.`);
        }

        const headers = { ...this.httpOptions.headers, ...remainingHeaders };
        if (json !== false) {
            headers['Content-Type'] = 'application/json';
        }

        try {
            const request: HttpRequest = {
                method,
                body: JSON.stringify(body),
                headers,
                credentials: withCredentials !== false && needsPermission !== false ? 'include' : 'omit',
                referrerPolicy: 'no-referrer',
            };

            if (isAppBuild) {
                return executeService('AjaxRequestService', 'execute', [url, request]);
            } else {
                const result = await this.httpFetch(url, request);
                return this._processResult(result);
            }
        } catch (err: any) {
            console.error(err);
            return Promise.reject({ status: 0, statusText: err.message, error: err });
        }
    }

    httpFetch(url: string, request: HttpRequest): Promise<Response> {
        return fetch(url, request as RequestInit);
    }

    async _processResult(result: Response): Promise<any> {
        if (result.ok) {
            try {
                if (result.status === 204) {
                    return {};
                }

                const responseText = await result.text();
                if (!responseText) {
                    return {};
                }

                try {
                    return JSON.parse(responseText);
                } catch {
                    return responseText;
                }
            } catch (err: any) {
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
