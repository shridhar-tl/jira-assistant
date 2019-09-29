import moment from "moment";
import OAuthClient from '../common/OAuthClient';
import { parseJwt } from "../common/utils";

// https://docs.microsoft.com/en-us/graph/api/resources/calendar?view=graph-rest-1.0

const client_id = "a8efd8fc-0657-490e-a622-7b2aaa4f4f46";
const scope = "Calendars.Read profile offline_access openid"; //"User.Read"

const authApiBasePath = "https://login.microsoftonline.com/common/oauth2/v2.0/";
const authEndPoint = `${authApiBasePath}authorize`;
const tokenEndPoint = `${authApiBasePath}authorize`;
//const tokenEndPoint = `${authApiBasePath}token`;

const apiBasePath = "https://graph.microsoft.com/v1.0/me/";
const calendarUrl = `${apiBasePath}/calendar/calendarView?startDateTime={0}&endDateTime={1}`;
//const calendarListUrl = `${apiBasePath}calendars`;
//const eventsListUrl = `${apiBasePath}calendar/events?$top=200&$expand=&$filter=&$orderby=&$select=`;
//const groupEventsListUrl = `${apiBasePath}/calendarGroup/calendars/{0}/events`;

export default class OutlookCalendar {
    static dependencies = ["AjaxService", "AnalyticsService", "MessageService", "CacheService", "AppBrowserService"];

    constructor($ajax, $analytics, $message, $cache, $jaBrowserExtn) {
        this.$ajax = $ajax;
        this.$analytics = $analytics;
        this.$message = $message;
        this.$cache = $cache;
        this.$jaBrowserExtn = $jaBrowserExtn;

        let redirect_uri = null;
        if (process.env.NODE_ENV === "production") {
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
    }

    getAddlProps(response_type) {
        const state = "c455eb5d-cc14-4539-ad51-59612035c260";
        const nonce = "8ad55dab-93d4-4456-99c8-fcc2f0d09b80";

        return { response_type, state, nonce, response_mode: 'fragment' };
    }

    async authenticate() { // ToDo:implement interactive param

        const addlParam = this.getAddlProps('id_token token'); //'code'

        const result = await this.oauth.authenticate(addlParam);

        const { token_type, access_token, expires_in, id_token } = result || {};

        if (access_token) {
            if (token_type === "bearer") {
                this.bearerToken = access_token;
            }

            this.tokenExpiresAt = moment().add(expires_in - 10, "seconds");

            const outlookInfo = parseJwt(id_token);
            const { name, preferred_username, tid, oid } = outlookInfo || {};

            this.$cache.set("olbt", access_token, this.tokenExpiresAt);

            return { name, preferred_username, tid, oid, access_token };
        }
        else {
            return Promise.reject(result);
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

        const addlParam = this.getAddlProps('token');

        return await this.oauth.getToken(addlParam, true);
    }

    async getEvents(startDate, endDate, options) {
        options = options || {};
        const authToken = await this.getToken();

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
            this.$analytics.trackEvent("Outlook - fetched data");

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
            this.$analytics.trackEvent(`Authentication error :-${(error || "").status || ""}`);
            if (error && error.status === 401) {
                this.$message.warning("Authenticated session with the Google Calendar has expired. You will have to reauthenticate.");
                this.$jaBrowserExtn.removeAuthTokken(authToken);
                //return svc.getEvents(startDate, endDate, options);
            }
            else {
                this.$message.error("Unknown error occured while trying to fetch the calendar data.");
            }
        }
    }
}