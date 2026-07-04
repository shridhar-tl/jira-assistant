import { inject } from '../services';
import { prepareUrlWithQueryString } from '../utils/helpers';

interface OAuthSettings {
    client_id: string;
    redirect_uri: string;
    scope: string;
    authEndPoint: string;
    tokenEndPoint: string;
}

interface AuthParams {
    [key: string]: any;
}

class OAuthClient {
    private settings: OAuthSettings;
    private $ajax: any;
    private $jaBrowserExtn: any;

    constructor(settings: OAuthSettings) {
        this.settings = settings;
        inject(this, 'AjaxService', 'AppBrowserService');
    }

    authenticate(params: AuthParams): Promise<Record<string, string>> {
        return new Promise(async (resolve) => {
            const { client_id, redirect_uri, scope } = this.settings;

            const authParams = {
                ...params,
                client_id,
                redirect_uri,
                scope,
            };

            const url = prepareUrlWithQueryString(this.settings.authEndPoint, authParams);

            if (import.meta.env.MODE === 'production') {
                let result = await this.$jaBrowserExtn.launchWebAuthFlow({ interactive: true, url });
                result = new URL(result).hash;
                resolve(this.parseQueryString(result.clearStart('#')));
            } else {
                (window as any).oAuthHandler = (result: string) => {
                    (window as any).oAuthHandler = null;
                    resolve(this.parseQueryString(result.clearStart('#')));
                };

                this.$jaBrowserExtn.openTab(url, 'oAuthHandler', 'height=610,width=500');
            }
        });
    }

    async getToken(params: AuthParams, useGetRequest?: boolean): Promise<Record<string, string>> {
        const { client_id, redirect_uri, scope } = this.settings;

        const data = {
            ...params,
            client_id,
            redirect_uri,
            scope,
        };

        let url = this.settings.tokenEndPoint;

        let result: any = null;
        if (useGetRequest) {
            url = prepareUrlWithQueryString(url, data);
            result = await this.$jaBrowserExtn.launchWebAuthFlow({ interactive: false, url });
        } else {
            result = await this.$ajax.request(useGetRequest ? 'GET' : 'POST', url, data);
        }

        console.log('Client:getToken:Access Token response: ', result);

        result = new URL(result).hash;
        result = this.parseQueryString(result.clearStart('#'));
        return result;
    }

    private parseQueryString(value: string): Record<string, string> {
        const query: Record<string, string> = {};
        value.replace(/([^=]+)=([^&]*)&?/g, (match, key, value) => {
            query[key] = decodeURIComponent(value);
            return '';
        });
        return query;
    }
}

export default OAuthClient;
