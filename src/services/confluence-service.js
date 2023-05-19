import { ApiUrls } from '../constants/api-urls';
import moment from 'moment';

export default class ConfluenceService {
    static dependencies = ["AjaxService", "CacheService", "MessageService", "SessionService"];

    constructor($ajax, $jaCache, $message, $session) {
        this.$ajax = $ajax;
        this.$jaCache = $jaCache;
        this.$message = $message;
        this.$session = $session;
        this.runningRequests = {};
    }

    async getSpaces() {
        let result = await this.$jaCache.session.getPromise('wiki_spaces');

        if (result) {
            return result;
        }

        let startAt = 0, maxLoop = 15;
        let data = null;

        do {
            data = await this.$ajax.get(ApiUrls.wiki_spaces, startAt);
            startAt = data.limit + data.start;

            if (!result) { result = data.results; }
            else {
                result.values.push(...data.results);
            }
        } while (result.length < data.size && --maxLoop > 0);

        result = result
            .map(({ id, key, name }) => ({ id, key, name })) // type, status
            .sortBy(s => s.name);

        this.$jaCache.session.set('wiki_spaces', result, 10);

        return result;
    }

    async getCalendars(workspaces) {
        const getCalendar = async (workspaceKey) => {
            let result = await this.$jaCache.session.getPromise(`wiki_calendars_${workspaceKey}`);

            if (result) {
                return result;
            }

            const { payload } = await this.$ajax.get(ApiUrls.wiki_calendars, workspaceKey);

            result = payload?.map(getCalendarData);

            this.$jaCache.session.set(`wiki_calendars_${workspaceKey}`, result, 10);

            return { key: workspaceKey, result };
        };

        if (Array.isArray(workspaces)) {
            return Promise.all(workspaces.map(getCalendar));
        } else if (workspaces && typeof workspaces === 'string') {
            return getCalendar(workspaces);
        }
    }

    async getCalendarEvents(calendarIds, start, end) {
        const getEvents = async (calendarId, index) => {
            let result = await this.$jaCache.session.getPromise(`wiki_events_${calendarId}`);

            if (result) {
                return result;
            }

            const { events } = await this.$ajax.get(ApiUrls.wiki_calendar_events, calendarId, start?.toISOString() || '', end?.toISOString() || '');

            result = events?.map(event => {
                const {
                    allDay, title, eventType,
                    start, end, originalStartDateTime, originalEndDateTime,
                    backgroundColor, invitees } = event;

                return {
                    allDay, title, eventType,
                    start: moment(start).toDate(),
                    end: moment(end).toDate(),
                    originalStartDateTime: moment(originalStartDateTime).toDate(),
                    originalEndDateTime: moment(originalEndDateTime).toDate(),
                    backgroundColor,
                    invitees: invitees?.map(({ id, ...prop }) => {
                        id = id.split('/');
                        id = id[id.length - 1];
                        return { ...prop, id };
                    })
                };
            });

            this.$jaCache.session.set(`wiki_events_${calendarId}`, result, 10);

            if (index === undefined) {
                return result;
            } else {
                return { key: calendarId, result };
            }
        };

        if (Array.isArray(calendarIds)) {
            return Promise.all(calendarIds.map(getEvents)).then(arr => arr.reduce((obj, cur) => {
                obj[cur.key] = cur.result;
                return obj;
            }, {}));
        } else if (calendarIds && typeof calendarIds === 'string') {
            return getEvents(calendarIds);
        }
    }
}

function getCalendarData(calendar) {
    const { subCalendar, childSubCalendars } = calendar;
    const { id, spaceKey, spaceName, timeZoneId, description } = subCalendar;

    const name = getCalendarName(subCalendar);

    const result = { id, name, spaceKey, spaceName, timeZoneId, description };

    const items = childSubCalendars?.map(getCalendarData);

    if (items?.length) {
        result.items = items;
    }

    return result;
}

function getCalendarName(calendar) {
    const { name, type, customEventTypes } = calendar;

    if (type === 'leaves') {
        return 'Leave';
    } else if (type === 'other') {
        return 'Events';
    } else if (type === 'custom') {
        return customEventTypes?.[0]?.title || 'Unknown';
    }

    return name;
}