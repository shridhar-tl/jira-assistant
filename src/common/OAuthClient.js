//https://login.microsoftonline.com/common/oauth2/v2.0/authorize?response_type=id_token&&client_info=1&x-client-SKU=MSAL.JS&x-client-Ver=1.1.3&client-request-id=541a32dd-1ced-41e6-974d-3e3249b17853&response_mode=fragment

import { inject } from "../services";
import { prepareUrlWithQueryString } from "./utils";

class OAuthClient {
    constructor(settings) {
        this.settings = settings;
        inject(this, "AjaxService");
    }

    authenticate(params) {
        return new Promise((resolve) => {
            const { client_id, redirect_uri, scope } = this.settings;

            const authParams = {
                ...params,
                client_id,
                redirect_uri,
                scope,
            };

            const url = prepareUrlWithQueryString(this.settings.authEndPoint, authParams);

            window["oAuthHandler"] = (result) => {
                window["oAuthHandler"] = null;
                resolve(this.parseQueryString(result.clearStart("#")));
            };

            window.open(url, "oAuthHandler", "height=610,width=500");
        });
    }

    async getToken(params, useGetRequest) {
        const { client_id, redirect_uri, scope } = this.settings;

        const data = {
            ...params,
            client_id,
            redirect_uri,
            scope,
        };

        const url = this.settings.tokenEndPoint.clearEnd("?");

        const result = await this.$ajax.request(useGetRequest ? "GET" : "POST", url, data);
        console.log("Result from token request for outlook", result);
        return result;
    }

    parseQueryString(value) {
        const query = {};
        value.replace(/([^=]+)=([^&]*)&?/g, function (match, key, value) {
            query[key] = decodeURIComponent(value);
            return '';
        });
        return query;
    }
}
//https://docs.microsoft.com/en-us/outlook/rest/javascript-tutorial
export default OAuthClient;
