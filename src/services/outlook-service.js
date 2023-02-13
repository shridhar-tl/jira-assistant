import { prepareUrlWithQueryString } from "../common/utils";
import { buildMode, isWebBuild } from "../constants/build-info";
import OutlookCalendarBase from "./outlook-service-base";

const client_id = "a8efd8fc-0657-490e-a622-7b2aaa4f4f46";
const scope = "Calendars.Read profile offline_access openid"; //"User.Read"

const authApiBasePath = "https://login.microsoftonline.com/common/oauth2/v2.0/";
const authEndPoint = `${authApiBasePath}authorize`;
//const tokenEndPoint = `${authApiBasePath}token`;

const redirect_uri = 'https://www.jiraassistant.com/oauth/outlook';

export default class OutlookCalendar extends OutlookCalendarBase {
    static dependencies = ["AjaxRequestService", "AnalyticsService", "MessageService", "OutlookOAuthService", "SessionService", "AppBrowserService"];

    constructor($request, $analytics, $message, $msoAuth, $session, $browser) {
        super($analytics, $message);
        this.$request = $request;
        this.$msoAuth = $msoAuth;
        this.$session = $session;
        this.$jaBrowserExtn = $browser;
    }

    getAddlProps(response_type) {
        const state = btoa(JSON.stringify({
            initSource: buildMode,
            authType: isWebBuild && localStorage.getItem('authType') !== '1' ? 'mso' : '1',
            userId: this.$session.userId
        }));

        const nonce = "8ad55dab-93d4-4456-99c8-fcc2f0d09b80";

        return { response_type, state, nonce, response_mode: 'query' };
    }

    async authenticate() {
        return new Promise(async (resolve, reject) => {
            const params = this.getAddlProps('code');
            const authParams = {
                ...params,
                client_id,
                redirect_uri,
                scope,
            };

            const url = prepareUrlWithQueryString(authEndPoint, authParams);
            const handler = (event) => {
                if (!event.origin?.endsWith('.jiraassistant.com')) {
                    return;
                }
                const data = event.data;
                if (data?.type !== 'mso_auth') { return; }

                window.removeEventListener('message', handler);
                if (data.result) {
                    resolve(data.result);
                } else {
                    reject(data.result);
                }
            };
            window.addEventListener("message", handler, false);

            this.$jaBrowserExtn.openTab(url, "oAuthHandler", "height=610,width=500");
        });
    }

    async getToken() {
        try {
            return await this.$msoAuth.getActiveToken(this.$session.userId);
        } catch (err) {
            console.error('Unable to get Outlook Access Token', err);
            return false;
        }
    }

    async fetchEvents(eventsUrl) {
        const authToken = await this.getToken();

        if (!authToken) {
            this.$message.error("Unable to authenticate with Outlook. You will have to reauthenticate from settings page.");
            return [];
        }

        const result = await this.$request.execute("GET", eventsUrl, {}, {
            withCredentials: false,
            'Authorization': `Bearer ${authToken}`
        });

        return result;
    }
}