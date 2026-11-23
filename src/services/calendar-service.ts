import type { CalendarInfo, CalendarLeaveEvent, MeetingCalendarEntry } from '@types';

interface GooglePerson {
    email?: string;
    displayName?: string;
}

interface GoogleLeaveEvent {
    id: string;
    summary?: string;
    start: { date?: string; dateTime?: string };
    end: { date?: string; dateTime?: string };
    transparency?: string;
    eventType?: string;
    attendees?: GooglePerson[];
    organizer?: GooglePerson;
    creator?: GooglePerson;
}

const calendarListApiUrl = 'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250';
const maxLeaveEventPages = 4;

function toGoogleDate(value: { date?: string; dateTime?: string }): Date {
    return value.dateTime ? new Date(value.dateTime) : new Date(`${value.date}T00:00:00`);
}

function toCalendarPerson(person?: GooglePerson) {
    return { email: person?.email, name: person?.displayName };
}

import type AjaxRequestService from './ajax-request-service';
import type AnalyticsService from './analytics-service';
import type AppBrowserService from './app-browser-service';
import type ConfigService from './config-service';
import type MessageService from './message-service';

export default class CalendarService {
    static dependencies = ['AppBrowserService', 'AnalyticsService', 'ConfigService', 'MessageService', 'AjaxRequestService'];

    private $jaBrowserExtn: AppBrowserService;
    private $analytics: AnalyticsService;
    private $config: ConfigService;
    private $message: MessageService;
    private $request: AjaxRequestService;
    private CALENDAR_EVENTS_API_URL = 'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events?';

    constructor(
        $jaBrowserExtn: AppBrowserService,
        $analytics: AnalyticsService,
        $config: ConfigService,
        $message: MessageService,
        $request: AjaxRequestService,
    ) {
        this.$jaBrowserExtn = $jaBrowserExtn;
        this.$analytics = $analytics;
        this.$config = $config;
        this.$message = $message;
        this.$request = $request;
    }

    async authenticate(interactive?: boolean): Promise<string | false> {
        if (!(await this.$jaBrowserExtn.requestPermission(['identity']))) {
            return false;
        }

        try {
            const accessToken = await this.$jaBrowserExtn.getAuthToken({
                interactive: interactive === true,
            });

            await this.$config.updateAuthCode({
                access_token: accessToken,
            });

            return accessToken || false;
        } catch {
            return false;
        }
    }

    async getEvents(startDate: Date, endDate: Date, options?: { calendar?: string; maxResults?: number }): Promise<MeetingCalendarEntry[]> {
        const opts = options || {};

        const calendarUrl =
            this.CALENDAR_EVENTS_API_URL.replace('{calendarId}', encodeURIComponent(opts.calendar || 'primary')) +
            [
                'showDeleted=false',
                'singleEvents=true',
                `timeMin=${encodeURIComponent(startDate.toISOString())}`,
                `timeMax=${encodeURIComponent(endDate.toISOString())}`,
                `maxResults=${opts.maxResults || 1000}`,
                'orderBy=startTime',
                'singleEvents=true',
            ].join('&');

        const onAuthSuccess = async (authToken: string) => {
            try {
                const data = await this.$request.execute('GET', calendarUrl, undefined, {
                    needsPermission: false,
                    Authorization: `Bearer ${authToken}`,
                });

                this.$analytics.trackEvent('Fetch calendar data', '', '', 0);

                return data.items.map((e: any): MeetingCalendarEntry => {
                    const obj: MeetingCalendarEntry = {
                        id: e.id,
                        start: toGoogleDate(e.start),
                        end: toGoogleDate(e.end),
                        title: e.summary,
                        url: e.hangoutLink,
                        entryType: 2,
                        sourceObject: { ...e, source: 'google' },
                        source: 'google',
                        editable: false,
                        allDay: !e.start.dateTime,
                    };

                    return obj;
                });
            } catch (error: any) {
                this.$analytics.trackEvent(`Authentication error :-${error?.status || ''}`, '', '', 0);

                if (error && error.status === 401) {
                    this.$message.warning('Authenticated session with the Google Calendar has expired. You will have to reauthenticate.');
                    this.$jaBrowserExtn.removeAuthToken(authToken);
                } else {
                    this.$message.error('Unknown error occurred while trying to fetch the calendar data.');
                }

                return Promise.reject(error);
            }
        };

        try {
            const authToken = await this.authenticate();
            if (!authToken) {
                throw new Error('Authentication failed');
            }

            return await onAuthSuccess(authToken);
        } catch (err: any) {
            if (err.error?.message?.toLowerCase().includes('invalid credentials')) {
                this.$message.warning('Authentication with google calendar has expired. You will have to reauthenticate to proceed!');
                this.$analytics.trackEvent('Calendar auto reauthenticate', '', '', 0);

                const authToken = await this.authenticate(true);
                if (!authToken) {
                    throw new Error('Re-authentication failed', { cause: err });
                }

                return await onAuthSuccess(authToken);
            }

            throw err;
        }
    }

    private async requestWithAuth<T>(url: string): Promise<T> {
        const authToken = await this.authenticate();
        if (!authToken) {
            throw new Error('Authentication with Google failed');
        }
        return this.$request.execute('GET', url, undefined, { needsPermission: false, Authorization: `Bearer ${authToken}` });
    }

    async getCalendarList(): Promise<CalendarInfo[]> {
        const data = await this.requestWithAuth<{ items?: { id: string; summary?: string; summaryOverride?: string }[] }>(calendarListApiUrl);
        return (data.items || []).map((c) => ({ id: c.id, name: c.summaryOverride || c.summary || c.id }));
    }

    /** Events of the chosen calendar with the details needed to recognise leave (out of office, free/busy and people). */
    async getLeaveEvents(calendarId: string, startDate: Date, endDate: Date): Promise<CalendarLeaveEvent[]> {
        const url =
            this.CALENDAR_EVENTS_API_URL.replace('{calendarId}', encodeURIComponent(calendarId)) +
            [
                'showDeleted=false',
                'singleEvents=true',
                `timeMin=${encodeURIComponent(startDate.toISOString())}`,
                `timeMax=${encodeURIComponent(endDate.toISOString())}`,
                'maxResults=2500',
            ].join('&');
        const items: GoogleLeaveEvent[] = [];
        let pageToken: string | undefined;
        for (let page = 0; page < maxLeaveEventPages; page++) {
            const data: { items?: GoogleLeaveEvent[]; nextPageToken?: string } = await this.requestWithAuth(pageToken ? `${url}&pageToken=${encodeURIComponent(pageToken)}` : url);
            items.push(...(data.items || []));
            pageToken = data.nextPageToken;
            if (!pageToken) {
                break;
            }
        }

        return items.map((e) => {
            const attendees = (e.attendees || []).map(toCalendarPerson).filter((p) => p.email || p.name);
            const owner = e.organizer || e.creator;
            return {
                id: e.id,
                title: e.summary || '',
                start: toGoogleDate(e.start),
                end: toGoogleDate(e.end),
                allDay: !e.start.dateTime,
                showAs: e.eventType === 'outOfOffice' ? 'oof' : e.transparency === 'transparent' ? 'free' : 'busy',
                categories: e.eventType ? [e.eventType] : [],
                people: attendees.length ? attendees : [toCalendarPerson(owner)],
            };
        });
    }
}
