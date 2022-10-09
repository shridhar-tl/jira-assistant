
import { prepareUrlWithQueryString } from '../common/utils';

export default class AjaxService {
    static dependencies = ["SessionService", "MessageService", "AjaxRequestService", "JiraAuthService"];

    constructor($session, $message, $request, $jAuth) {
        this.$session = $session;
        this.$message = $message;
        this.$request = $request;
        this.$jAuth = $jAuth;
    }

    prepareUrl(url, params) {
        let basePath = this.$session.apiRootUrl || this.$session.rootUrl;
        if (!basePath?.endsWith('/')) {
            basePath += '/';
        }

        let urlStr = url.toString();

        if (params && Array.isArray(params) && params.length === 1 && typeof params[0] === "object") {
            params = params[0];
        }

        const isArray = params && Array.isArray(params);
        if (isArray && params.length > 0) {
            urlStr = urlStr.format(params);
        }
        else if (!isArray && params && typeof params === "object") {
            urlStr = prepareUrlWithQueryString(urlStr, params);
        }

        if (urlStr.startsWith('~/')) {
            return basePath + urlStr.substring(2);
        }

        return urlStr;
    }

    handler(req, quiet) {
        return req.then(null, (e) => {
            if (!quiet && e.status === 0) {
                this.$message.error("Unable to connect to server. Please check your network connectivity.", "Network error");
            }
            const { error, status } = e;
            let { statusText: response } = e;

            if (!error && !response && status) {
                response = `Server response was ${status}`;
            }

            return Promise.reject({ error, response, status, ref: e });
        });
    }

    request(method, url, params, headers, quiet) {
        return this.handler(this.execute(method, this.prepareUrl(url, params), params, headers), quiet);
    }

    async execute(method, url, params, customHeaders) {
        customHeaders = await this.$jAuth.transformHeaders(this.$session.userId, customHeaders);
        return this.$request.execute(method, url, params, customHeaders);
    }

    get(url, ...params) {
        //return new Promise((resolve, reject) => {
        //  $.get(this.prepareUrl(url, params))
        //    .done((data) => {
        //      resolve(data);
        //    })
        //    .fail((err) => {
        //      reject(err);
        //    });
        //});
        let headers = params[params.length - 1];
        if (params.length > 1 && typeof headers === 'object') {
            params = params.slice(0, -1);
        } else {
            headers = undefined;
        }

        return this.handler(this.execute("GET", this.prepareUrl(url, params), null, headers));
    }

    post(url, data, ...params) {
        return this.handler(this.execute("POST", this.prepareUrl(url, params), data));
    }

    put(url, data, ...params) {
        return this.handler(this.execute("PUT", this.prepareUrl(url, params), data));
    }

    delete(url, ...params) {
        return this.handler(this.execute("DELETE", this.prepareUrl(url, params)));
    }
}
