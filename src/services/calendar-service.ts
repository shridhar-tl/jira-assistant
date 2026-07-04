import { formatDate } from '@utils';

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
        } catch (err) {
            return false;
        }
    }

    async getEvents(startDate: Date, endDate: Date, options?: { calendar?: string; maxResults?: number }): Promise<any[]> {
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

                return data.items.map((e: any) => {
                    const obj: any = {
                        id: e.id,
                        start: e.start.dateTime ? new Date(e.start.dateTime) : new Date(formatDate(new Date(e.start.date), 'yyyy-MM-dd')),
                        end: e.end.dateTime ? new Date(e.end.dateTime) : new Date(formatDate(new Date(e.end.date), 'yyyy-MM-dd')),
                        title: e.summary,
                        url: e.hangoutLink,
                        entryType: 2,
                        sourceObject: e,
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
                    throw new Error('Re-authentication failed');
                }

                return await onAuthSuccess(authToken);
            }

            throw err;
        }
    }
}
