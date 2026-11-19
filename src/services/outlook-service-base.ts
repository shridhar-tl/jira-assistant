import moment from 'moment-timezone';

import { EventCategory } from '@/constants';

import type { CalendarInfo, CalendarLeaveEvent, CalendarShowAs, Meeting, MeetingCalendarEntry, MeetingDateTime } from '@types';

import type AnalyticsService from './analytics-service';
import type MessageService from './message-service';

// https://docs.microsoft.com/en-us/graph/api/resources/calendar?view=graph-rest-1.0
// https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow

const apiBasePath = 'https://graph.microsoft.com/v1.0/me/';
const calendarUrl = `${apiBasePath}/calendar/calendarView?startDateTime={0}&endDateTime={1}&top=100`;
const calendarListUrl = `${apiBasePath}calendars?$select=id,name&$top=200`;
const maxLeaveEventPages = 5;
const leaveEventsUrl = `${apiBasePath}calendars/{0}/calendarView?startDateTime={1}&endDateTime={2}&$top=500&$select=id,subject,start,end,isAllDay,showAs,categories,attendees,organizer`;

interface GraphPerson {
    emailAddress?: { name?: string; address?: string };
}

interface GraphLeaveEvent {
    id: string;
    subject?: string;
    start?: MeetingDateTime;
    end?: MeetingDateTime;
    isAllDay?: boolean;
    showAs?: string;
    categories?: string[];
    attendees?: GraphPerson[];
    organizer?: GraphPerson;
}

const graphShowAsMap: Record<string, CalendarShowAs> = { oof: 'oof', busy: 'busy', tentative: 'tentative', free: 'free', workingElsewhere: 'busy' };

function toCalendarPerson(person?: GraphPerson) {
    return { email: person?.emailAddress?.address, name: person?.emailAddress?.name };
}
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

    async getEvents(startDate?: Date, endDate?: Date): Promise<MeetingCalendarEntry[]> {
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

    async getCalendarList(): Promise<CalendarInfo[]> {
        const result = await this.fetchEvents(calendarListUrl);
        return ((result?.value || []) as CalendarInfo[]).map(({ id, name }) => ({ id, name }));
    }

    /** Events of the chosen calendar with the details needed to recognise leave (show as, categories and people). */
    async getLeaveEvents(calendarId: string, startDate: Date, endDate: Date): Promise<CalendarLeaveEvent[]> {
        const url = leaveEventsUrl
            .replace('{0}', encodeURIComponent(calendarId))
            .replace('{1}', encodeURIComponent(startDate.toISOString()))
            .replace('{2}', encodeURIComponent(endDate.toISOString()));
        const events: GraphLeaveEvent[] = [];
        let nextUrl: string | undefined = url;
        for (let page = 0; nextUrl && page < maxLeaveEventPages; page++) {
            const result: { value?: GraphLeaveEvent[]; '@odata.nextLink'?: string } = await this.fetchEvents(nextUrl);
            events.push(...(result?.value || []));
            nextUrl = result?.['@odata.nextLink'];
        }

        return events
            .filter((e) => e.start?.dateTime && e.end?.dateTime)
            .map((e) => {
                const attendees = (e.attendees || []).map(toCalendarPerson).filter((p) => p.email || p.name);
                return {
                    id: e.id,
                    title: e.subject || '',
                    start: parseGraphDateTime(e.start!),
                    end: parseGraphDateTime(e.end!),
                    allDay: !!e.isAllDay,
                    showAs: graphShowAsMap[e.showAs || ''] || null,
                    categories: e.categories || [],
                    people: attendees.length ? attendees : [toCalendarPerson(e.organizer)],
                };
            });
    }

    protected async fetchEvents(_eventsUrl: string): Promise<any> {
        throw new Error('fetchEvents must be implemented by subclass');
    }
}
