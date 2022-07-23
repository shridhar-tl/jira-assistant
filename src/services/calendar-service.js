import * as moment from 'moment';

export default class CalendarService {
    static dependencies = ["AppBrowserService", "AnalyticsService", "ConfigService", "MessageService", "AjaxRequestService"];

    constructor($jaBrowserExtn, $analytics, $config, $message, $request) {
        this.$jaBrowserExtn = $jaBrowserExtn;
        this.$analytics = $analytics;
        this.$config = $config;
        this.$message = $message;
        this.$request = $request;
        // Client ID and API key from the Developer Console
        //var CLIENT_ID = "692513716183-s97kv5slq5ihm410jq2kc4r8hr77rcku.apps.googleusercontent.com";
        //var API_KEY = "AIzaSyC6BS-Z_7E7ejv-nfJgq1KmrJ146xneenI";
        this.CALENDAR_EVENTS_API_URL = "https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events?";
    }

    async authenticate(interactive) {
        if (!await this.$jaBrowserExtn.requestPermission(["identity"])) {
            return false;
        }
        return this.$jaBrowserExtn.getAuthToken({ 'interactive': interactive === true }).then((accessToken) => this.$config.updateAuthCode({
            access_token: accessToken
        }).then(() => accessToken));
    }

    getEvents(startDate, endDate, options) {
        options = options || {};

        const calendarUrl = this.CALENDAR_EVENTS_API_URL.replace('{calendarId}', encodeURIComponent(options.calendar || 'primary')) + ([
            'showDeleted=false',
            'singleEvents=true',
            `timeMin=${encodeURIComponent(startDate.toDate().toISOString())}`,
            `timeMax=${encodeURIComponent(endDate.toDate().toISOString())}`,
            `maxResults=${options.maxResults || 1000}`,
            'orderBy=startTime',
            'singleEvents=true'
        ].join('&'));

        const onAuthSuccess = (authToken) => this.$request.execute('GET', calendarUrl, null,
            { needsPermission: false, 'Authorization': `Bearer ${authToken}` })
            .then(data => {
                this.$analytics.trackEvent("Fetch calendar data");
                return data.items.map((e) => {
                    const obj = {
                        id: e.id,
                        start: e.start.dateTime || moment(e.start.date, "yyyy-MM-dd").toDate(),
                        end: e.end.dateTime || moment(e.end.date, "yyyy-MM-dd").toDate(),
                        title: e.summary,
                        url: e.hangoutLink,
                        entryType: 2,
                        sourceObject: e,
                        source: "google",
                        editable: false,
                        allDay: !e.start.dateTime
                    };
                    //obj.totalTime = obj.end - obj.start;
                    return obj;
                });
            }, (error) => {
                this.$analytics.trackEvent(`Authentication error :-${(error || "").status || ""}`);
                if (error && error.status === 401) {
                    this.$message.warning("Authenticated session with the Google Calendar has expired. You will have to reauthenticate.");
                    this.$jaBrowserExtn.removeAuthTokken(authToken);
                    //return svc.getEvents(startDate, endDate, options);
                }
                else {
                    this.$message.error("Unknown error occured while trying to fetch the calendar data.");
                }
                return Promise.reject(error);
            });

        return this.authenticate().then(onAuthSuccess, (err) => {
            if (err.error && err.error.message && err.error.message.toLowerCase().indexOf("invalid credentials")) {
                this.$message.warning("Authentication with google calendar has expired. You will have to reauthenticate to proceed!");
                this.$analytics.trackEvent("Calendar auto reauthenticate");
                return this.authenticate(true).then(onAuthSuccess);
            }
        });
    }
}
