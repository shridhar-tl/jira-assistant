
import { prepareUrlWithQueryString } from '../common/utils';

export default class AjaxService {
    static dependencies = ["SessionService", "MessageService", "AjaxRequestService"];

    constructor($session, $message, $request) {
        this.$session = $session;
        this.$message = $message;
        this.$request = $request;
    }

    prepareUrl(url, params) {
        this._basePath = this.$session.rootUrl;
        if (!this._basePath?.endsWith('/')) {
            this._basePath += '/';
        }

        let urlStr = url.toString();

        if (params && Array.isArray(params) && params.length === 1 && typeof params[0] === "object") {
            params = params[0];
        }

        if (params && Array.isArray(params) && params.length > 0) {
            urlStr = urlStr.format(params);
        }
        else if (params && typeof params === "object") {
            urlStr = prepareUrlWithQueryString(urlStr, params);
        }

        if (urlStr.startsWith('~/')) {
            return this._basePath + urlStr.substring(2);
        }

        return urlStr;
    }

    handler(req, quiet) {
        return req.then(null, (e) => {
            if (!quiet && e.status === 0) {
                this.$message.error("Unable to connect to server. Please check your network connectivity.", "Network error");
            }
            const { error, statusText: response, status } = e;
            return Promise.reject({ error, response, status, ref: e });
        });
    }

    request(method, url, params, headers, quiet) {
        return this.handler(this.execute(method, this.prepareUrl(url, params), params, headers), quiet);
    }

    execute(method, url, params, customHeaders) {
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
        return this.handler(this.execute("GET", this.prepareUrl(url, params)));
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
