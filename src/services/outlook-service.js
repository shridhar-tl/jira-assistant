import moment from "moment";
import OAuthClient from '../common/OAuthClient';
import { parseJwt } from "../common/utils";
import { EventCategory } from "../_constants";

// https://docs.microsoft.com/en-us/graph/api/resources/calendar?view=graph-rest-1.0

const client_id = "a8efd8fc-0657-490e-a622-7b2aaa4f4f46";
const scope = "Calendars.Read profile offline_access openid"; //"User.Read"

const authApiBasePath = "https://login.microsoftonline.com/common/oauth2/v2.0/";
const authEndPoint = `${authApiBasePath}authorize`;
const tokenEndPoint = `${authApiBasePath}authorize`;
//const tokenEndPoint = `${authApiBasePath}token`;

const apiBasePath = "https://graph.microsoft.com/v1.0/me/";
const calendarUrl = `${apiBasePath}/calendar/calendarView?startDateTime={0}&endDateTime={1}&top=100`;
//const calendarListUrl = `${apiBasePath}calendars`;
//const eventsListUrl = `${apiBasePath}calendar/events?$top=200&$expand=&$filter=&$orderby=&$select=`;
//const groupEventsListUrl = `${apiBasePath}/calendarGroup/calendars/{0}/events`;

export default class OutlookCalendar {
    static dependencies = ["AjaxService", "AnalyticsService", "MessageService", "CacheService", "AppBrowserService", "SessionService"];

    constructor($ajax, $analytics, $message, $cache, $jaBrowserExtn, $session) {
        this.$ajax = $ajax;
        this.$analytics = $analytics;
        this.$message = $message;
        this.$cache = $cache;
        this.$jaBrowserExtn = $jaBrowserExtn;
        this.$session = $session;

        this.initConfigs();
    }

    async initConfigs() {
        if (!this.oauth && this.$session.CurrentUser?.outlookIntegration) {
            let redirect_uri = null;
            if (process.env.NODE_ENV === "production") {
                if (!await this.$jaBrowserExtn.requestPermission(["identity"])) {
                    return false;
                }
                redirect_uri = this.$jaBrowserExtn.getRedirectUrl('outlook-auth');
            }
            else {
                redirect_uri = document.location.href;
                const tildIndex = redirect_uri.indexOf("#");

                if (~tildIndex) {
                    redirect_uri = redirect_uri.substring(0, tildIndex);
                }

                const qmIndex = redirect_uri.indexOf("?");
                if (~qmIndex) {
                    redirect_uri = redirect_uri.substring(0, qmIndex);
                }
            }

            this.oauth = new OAuthClient({
                authEndPoint,
                tokenEndPoint,
                client_id,
                redirect_uri,
                scope
            });
            return true;
        }

        return !!this.oauth;
    }

    getAddlProps(response_type) {
        const state = "c455eb5d-cc14-4539-ad51-59612035c260";
        const nonce = "8ad55dab-93d4-4456-99c8-fcc2f0d09b80";

        return { response_type, state, nonce, response_mode: 'fragment' };
    }

    async authenticate() { // ToDo:implement interactive param
        await this.initConfigs();

        const addlParam = this.getAddlProps('id_token token'); //'code'

        const result = await this.oauth.authenticate(addlParam);

        const { access_token, id_token } = result || {};

        if (access_token && this.setAuthToken(result)) {
            const outlookInfo = parseJwt(id_token);
            console.log("Outlook: ID Token Value: ", outlookInfo);
            const { name, preferred_username, tid, oid } = outlookInfo || {};

            return { name, preferred_username, tid, oid, access_token };
        }
        else {
            return Promise.reject(result);
        }
    }

    setAuthToken(result) {
        const { token_type, access_token, expires_in } = result || {};

        if (access_token) {
            if (token_type === "bearer") {
                this.bearerToken = access_token;
            }

            this.tokenExpiresAt = moment().add(expires_in - 10, "seconds");

            this.$cache.set("olbt", access_token, this.tokenExpiresAt);

            return access_token;
        }
    }

    async getToken() {
        if (this.bearerToken && this.tokenExpiresAt && moment().isBefore(this.tokenExpiresAt)) {
            return this.bearerToken;
        }

        const storedToken = this.$cache.get("olbt");
        if (storedToken) { return storedToken; }

        this.bearerToken = null;
        this.tokenExpiresAt = null;

        await this.initConfigs();

        const addlParam = { ...this.getAddlProps('token'), prompt: "none", ...this.getOptionalHints() };

        const result = await this.oauth.getToken(addlParam, true);
        console.log("getToken:Access Token response: ", result);
        const access_token = this.setAuthToken(result);

        if (!access_token) {
            console.log("getToken:Access token request params: ", addlParam);
            this.$cache.remove("olbt");
        }

        return access_token;
    }

    getOptionalHints() {
        const { preferred_username, tid } = this.$session.CurrentUser.outlookStore || {};

        const result = { login_hint: preferred_username || "" };

        if (tid) {
            result.domain_hint = tid === "9188040d-6c67-4c5b-b112-36a304b66dad" ? "consumers" : "organizations";
        }

        return result;
    }

    async getEvents(startDate, endDate, options) {
        await this.initConfigs();
        options = options || {};
        const authToken = await this.getToken();

        if (!authToken) {
            this.$message.warning("Unable to authenticate with Outlook. You will have to reauthenticate from settings page.");
            return [];
        }

        if (!startDate) {
            startDate = moment().startOf('month').add(-1, "days");
        }

        if (!endDate) {
            endDate = moment().endOf('month').add(1, "days");
        }

        startDate = encodeURIComponent(moment(startDate).toDate().toISOString());
        endDate = encodeURIComponent(moment(endDate).toDate().toISOString());

        try {
            // https://docs.microsoft.com/en-us/graph/api/resources/event?view=graph-rest-1.0
            const result = await this.$ajax.request("GET", calendarUrl.format(startDate, endDate), {}, { 'Authorization': `Bearer ${authToken}` });
            this.$analytics.trackEvent("Outlook - fetched data", EventCategory.DataFetch);

            const events = result.value.map((e) => {
                if (e.start.dateTime) {
                    e.start.dateTime = moment.tz(e.start.dateTime, e.start.timeZone).toDate();
                }

                if (e.end.dateTime) {
                    e.end.dateTime = moment.tz(e.end.dateTime, e.end.timeZone).toDate();
                }

                const obj = {
                    id: e.id,
                    start: e.start.dateTime,
                    end: e.end.dateTime,
                    title: e.subject,
                    url: e.onlineMeetingUrl,
                    entryType: 2,
                    sourceObject: e,
                    source: "outlook",
                    editable: false,
                    allDay: e.isAllDay
                };
                //obj.totalTime = obj.end - obj.start;
                return obj;
            });

            return events;
        } catch (error) {
            this.$analytics.trackEvent(`Authentication error :-${(error || "").status || ""}`, EventCategory.DataFetch);
            if (error && error.status === 401) {
                this.$message.warning("Authenticated session with the Outlook Calendar has expired. You will have to reauthenticate.");
                //return svc.getEvents(startDate, endDate, options);
            }
            else {
                this.$message.error("Unknown error occured while trying to fetch the calendar data.");
            }
        }
    }
}