import $ from 'jquery';

export default class AjaxService {
    static dependencies = ["SessionService", "MessageService"];

    constructor($session, $message) {
        this.$session = $session;
        this.$message = $message;

        // Jira has issue with some user agent. Hence always customize it
        const headerObj = { 'Content-Type': 'application/json' };

        //headerObj["User-Agent"] = "Chrome"; //ToDo: Add it only for firefox browser.

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
    prepareUrl(url, params) {
        this._basePath = this.$session.rootUrl;
        if (!this._basePath.endsWith('/')) {
            this._basePath += '/';
        }
        let urlStr = url.toString();
        if (params && params.length > 0) {
            urlStr = urlStr.format(params);
        }
        if (urlStr.startsWith('~/')) {
            return this._basePath + urlStr.substring(2);
        }
        return urlStr;
    }
    handler(req) {
        return req.then(null, (e) => {
            if (e.status === 0) {
                this.$message.error("Unable to connect to server. Please check your network connectivity.", "Network error");
            }
            const { responseJSON: error, responseText: response, status } = e;
            return Promise.reject({ error, response, status, ref: e });
        });
    }

    request(method, url, body, headers) {
        return this.handler(this.execute(method, this.prepareUrl(url, []), body, headers));
    }

    async execute(method, url, params) {
        let body = params;
        if ((method || "GET").toUpperCase() === "GET") {
            body = undefined;
        }
        else {
            params = undefined;
        }
        return new Promise((resolve, reject) => {
            $.ajax({
                type: method,
                url: url,
                data: JSON.stringify(body),
                success: resolve,
                error: reject,
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                },
                beforeSend: (request) => {
                    const { headers } = this.httpOptions;
                    Object.keys(headers).forEach(h => request.setRequestHeader(h, headers[h]));
                }
            });
        });
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
