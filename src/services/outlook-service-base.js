import moment from "moment";
import { EventCategory } from "../constants/settings";

// https://docs.microsoft.com/en-us/graph/api/resources/calendar?view=graph-rest-1.0
// https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow

const apiBasePath = "https://graph.microsoft.com/v1.0/me/";
const calendarUrl = `${apiBasePath}/calendar/calendarView?startDateTime={0}&endDateTime={1}&top=100`;
//const calendarListUrl = `${apiBasePath}calendars`;
//const eventsListUrl = `${apiBasePath}calendar/events?$top=200&$expand=&$filter=&$orderby=&$select=`;
//const groupEventsListUrl = `${apiBasePath}/calendarGroup/calendars/{0}/events`;

export default class OutlookCalendarBase {
    constructor($analytics, $message) {
        this.$analytics = $analytics;
        this.$message = $message;
    }

    async getEvents(startDate, endDate, options) {
        options = options || {};

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
            const eventsUrl = calendarUrl.format(startDate, endDate);
            const result = await this.fetchEvents(eventsUrl);
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