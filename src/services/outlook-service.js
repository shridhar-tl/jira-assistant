import moment from "moment";
import { prepareUrlWithQueryString } from "../common/utils";
import { buildMode, isWebBuild } from "../constants/build-info";
import { EventCategory } from "../constants/settings";

// https://docs.microsoft.com/en-us/graph/api/resources/calendar?view=graph-rest-1.0
// https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow

const client_id = "a8efd8fc-0657-490e-a622-7b2aaa4f4f46";
const scope = "Calendars.Read profile offline_access openid"; //"User.Read"

const authApiBasePath = "https://login.microsoftonline.com/common/oauth2/v2.0/";
const authEndPoint = `${authApiBasePath}authorize`;
//const tokenEndPoint = `${authApiBasePath}token`;

const apiBasePath = "https://graph.microsoft.com/v1.0/me/";
const calendarUrl = `${apiBasePath}/calendar/calendarView?startDateTime={0}&endDateTime={1}&top=100`;
const redirect_uri = 'https://www.jiraassistant.com/oauth/outlook';
//const calendarListUrl = `${apiBasePath}calendars`;
//const eventsListUrl = `${apiBasePath}calendar/events?$top=200&$expand=&$filter=&$orderby=&$select=`;
//const groupEventsListUrl = `${apiBasePath}/calendarGroup/calendars/{0}/events`;

export default class OutlookCalendar {
    static dependencies = ["AjaxRequestService", "AnalyticsService", "MessageService", "OutlookOAuthService", "SessionService", "AppBrowserService"];

    constructor($request, $analytics, $message, $msoAuth, $session, $browser) {
        this.$request = $request;
        this.$analytics = $analytics;
        this.$message = $message;
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

    async getEvents(startDate, endDate, options) {
        options = options || {};
        const authToken = await this.getToken();

        if (!authToken) {
            this.$message.error("Unable to authenticate with Outlook. You will have to reauthenticate from settings page.");
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
            const result = await this.$request.execute("GET", calendarUrl.format(startDate, endDate), {}, {
                withCredentials: false,
                'Authorization': `Bearer ${authToken}`
            });
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