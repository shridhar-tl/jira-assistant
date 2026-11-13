import moment from 'moment-timezone';

import { EventCategory } from '@/constants';

import type { Meeting, MeetingCalendarEntry, MeetingDateTime } from '@types';

import type AnalyticsService from './analytics-service';
import type MessageService from './message-service';

// https://docs.microsoft.com/en-us/graph/api/resources/calendar?view=graph-rest-1.0
// https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow

const apiBasePath = 'https://graph.microsoft.com/v1.0/me/';
const calendarUrl = `${apiBasePath}/calendar/calendarView?startDateTime={0}&endDateTime={1}&top=100`;
//const calendarListUrl = `${apiBasePath}calendars`;
//const eventsListUrl = `${apiBasePath}calendar/events?$top=200&$expand=&$filter=&$orderby=&$select=`;
//const groupEventsListUrl = `${apiBasePath}/calendarGroup/calendars/{0}/events`;

type ScheduledMeeting = Meeting & Required<Pick<Meeting, 'start' | 'end'>>;

function isScheduled(meeting: Meeting): meeting is ScheduledMeeting {
    return !!meeting.start?.dateTime && !!meeting.end?.dateTime;
}

// Graph returns dateTime as wall clock time of timeZone (UTC by default) without offset
function parseGraphDateTime({ dateTime, timeZone }: MeetingDateTime): Date {
    return timeZone ? moment.tz(dateTime, timeZone).toDate() : new Date(dateTime);
}

export default class OutlookCalendarBase {
    protected $analytics: AnalyticsService;
    protected $message: MessageService;

    constructor($analytics: AnalyticsService, $message: MessageService) {
        this.$analytics = $analytics;
        this.$message = $message;
    }

    async getEvents(startDate?: Date, endDate?: Date, options?: any): Promise<MeetingCalendarEntry[]> {
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

            const events = (result.value as Meeting[]).filter(isScheduled).map((e): MeetingCalendarEntry => {
                const start = parseGraphDateTime(e.start);
                const end = parseGraphDateTime(e.end);

                const sourceObject: Meeting = {
                    ...e,
                    start: { dateTime: start.toISOString() },
                    end: { dateTime: end.toISOString() },
                    source: 'outlook',
                };

                return {
                    id: e.id,
                    start,
                    end,
                    title: e.subject,
                    url: e.onlineMeetingUrl,
                    entryType: 2,
                    sourceObject,
                    source: 'outlook',
                    editable: false,
                    allDay: !!e.isAllDay,
                };
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
