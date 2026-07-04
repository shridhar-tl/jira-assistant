import moment from 'moment';

import { EventCategory } from '@/constants';

import type AnalyticsService from './analytics-service';
import type MessageService from './message-service';

// https://docs.microsoft.com/en-us/graph/api/resources/calendar?view=graph-rest-1.0
// https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow

const apiBasePath = 'https://graph.microsoft.com/v1.0/me/';
const calendarUrl = `${apiBasePath}/calendar/calendarView?startDateTime={0}&endDateTime={1}&top=100`;
//const calendarListUrl = `${apiBasePath}calendars`;
//const eventsListUrl = `${apiBasePath}calendar/events?$top=200&$expand=&$filter=&$orderby=&$select=`;
//const groupEventsListUrl = `${apiBasePath}/calendarGroup/calendars/{0}/events`;

export default class OutlookCalendarBase {
    protected $analytics: AnalyticsService;
    protected $message: MessageService;

    constructor($analytics: AnalyticsService, $message: MessageService) {
        this.$analytics = $analytics;
        this.$message = $message;
    }

    async getEvents(startDate?: Date, endDate?: Date, options?: any): Promise<any[]> {
        options = options || {};

        if (!startDate) {
            startDate = moment().startOf('month').add(-1, 'days').toDate();
        }

        if (!endDate) {
            endDate = moment().endOf('month').add(1, 'days').toDate();
        }

        const startDateISO = encodeURIComponent(startDate.toISOString());
        const endDateISO = encodeURIComponent(endDate.toISOString());

        try {
            // https://docs.microsoft.com/en-us/graph/api/resources/event?view=graph-rest-1.0
            const eventsUrl = calendarUrl.replace('{0}', startDateISO).replace('{1}', endDateISO);
            const result = await this.fetchEvents(eventsUrl);
            this.$analytics.trackEvent('Outlook - fetched data', EventCategory.DataFetch);

            const events = result.value.map((e: any) => {
                let startDateTime = e.start.dateTime;
                let endDateTime = e.end.dateTime;

                if (e.start.dateTime) {
                    startDateTime = new Date(e.start.dateTime);
                }

                if (e.end.dateTime) {
                    endDateTime = new Date(e.end.dateTime);
                }

                const obj = {
                    id: e.id,
                    start: startDateTime,
                    end: endDateTime,
                    title: e.subject,
                    url: e.onlineMeetingUrl,
                    entryType: 2,
                    sourceObject: e,
                    source: 'outlook',
                    editable: false,
                    allDay: e.isAllDay,
                };
                return obj;
            });

            return events;
        } catch (error: any) {
            this.$analytics.trackEvent(`Authentication error :-${error?.status || ''}`, EventCategory.DataFetch);
            if (error && error.status === 401) {
                this.$message.warning('Authenticated session with the Outlook Calendar has expired. You will have to reauthenticate.');
            } else {
                this.$message.error('Unknown error occured while trying to fetch the calendar data.');
            }
            return [];
        }
    }

    protected async fetchEvents(eventsUrl: string): Promise<any> {
        throw new Error('fetchEvents must be implemented by subclass');
    }
}
