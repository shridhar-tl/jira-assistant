import { useCallback, useRef, useState } from 'react';

import { endOfDay, startOfDay } from 'date-fns';

import { useService } from '@/services/injector';

import type { Meeting, Worklog, WorklogCalendarEntry } from '@types';

import { createInfoEvent, createMeetingEvent, createWorklogEvent, filterEvents, groupWorklogsByDate } from '../calendar-utils';
import type { CalendarEvent, CalendarSettings } from '../types';

export function useCalendarData(settings: CalendarSettings, currentUser: any) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const loadedRangesRef = useRef<Array<{ start: number; end: number }>>([]);
    const { $worklog, $calendar, $outlook, $message } = useService('WorklogService', 'CalendarService', 'OutlookService', 'MessageService');

    const fetchEvents = useCallback(
        async (start: Date, end: Date, mode: 'replace' | 'merge' = 'replace') => {
            const startDate = startOfDay(start);
            const endDate = endOfDay(end);

            if (mode === 'merge') {
                const startMs = startDate.getTime();
                const endMs = endDate.getTime();
                const alreadyLoaded = loadedRangesRef.current.some(
                    (r) => r.start <= startMs && r.end >= endMs,
                );
                if (alreadyLoaded) {
                    return;
                }
            } else {
                loadedRangesRef.current = [];
            }

            setIsLoading(true);

            try {
                const requests: Promise<any>[] = [$worklog.getWorklogsEntry(startDate, endDate, ['worklog', 'summary'])];

                if (currentUser.googleIntegration && currentUser.hasGoogleCredentials && settings.showMeetings) {
                    requests.push(
                        $calendar.getEvents(startDate, endDate).catch((err: any) => {
                            let msg = 'Unable to fetch Google meetings!';
                            if (err.error && err.error.message) {
                                msg += `<br /><br />Reason: ${err.error.message}`;
                            }
                            $message.warning(msg);
                            return [];
                        }),
                    );
                }

                if (currentUser.outlookIntegration && currentUser.hasOutlookCredentials && settings.showMeetings) {
                    requests.push(
                        $outlook.getEvents(startDate, endDate).catch((err: any) => {
                            let msg = 'Unable to fetch Outlook meetings!';
                            if (err.error && err.error.message) {
                                msg += `<br /><br />Reason: ${err.error.message}`;
                            }
                            $message.warning(msg);
                            return [];
                        }),
                    );
                }

                const results = await Promise.all(requests);
                const worklogs = results[0] as WorklogCalendarEntry[];
                const meetings: Meeting[] = [];

                if (results[1]) meetings.push(...results[1]);
                if (results[2]) meetings.push(...results[2]);

                const worklogEvents = worklogs.map((wl) => createWorklogEvent(wl, settings));
                const meetingEvents = meetings.map((m: any) => createMeetingEvent(m, settings));

                const groupedWorklogs = groupWorklogsByDate(worklogs);
                const infoEvents: CalendarEvent[] = [];

                if (settings.showInfo) {
                    groupedWorklogs.forEach((wls, dateKey) => {
                        const date = new Date(dateKey);
                        const sourceWorklogs = wls.map((wl) => wl.sourceObject);
                        const infoEvent = createInfoEvent(date, sourceWorklogs, currentUser.maxHours, currentUser.minHours, settings);
                        infoEvents.push(infoEvent);
                    });
                }

                const allEvents = [...worklogEvents, ...meetingEvents, ...infoEvents];
                const filtered = filterEvents(allEvents, settings.showMeetings, settings.showWorklogs, settings.showInfo);

                if (mode === 'merge') {
                    setEvents((prev) => {
                        const newIds = new Set(filtered.map((e) => `${e.data.entryType}:${e.id}`));
                        const surviving = prev.filter((e) => !newIds.has(`${e.data.entryType}:${e.id}`));
                        return [...surviving, ...filtered];
                    });
                    loadedRangesRef.current = [
                        ...loadedRangesRef.current,
                        { start: startDate.getTime(), end: endDate.getTime() },
                    ];
                } else {
                    setEvents(filtered);
                    loadedRangesRef.current = [{ start: startDate.getTime(), end: endDate.getTime() }];
                }
            } catch (error) {
                console.error('Error fetching calendar events:', error);
                $message.error('Failed to load calendar events');
            } finally {
                setIsLoading(false);
            }
        },
        [settings, currentUser, $worklog, $calendar, $outlook, $message],
    );

    const updateEvents = useCallback((newEvents: CalendarEvent[]) => {
        setEvents(newEvents);
    }, []);

    const addEvent = useCallback((event: CalendarEvent) => {
        setEvents((prev) => [...prev, event]);
    }, []);

    const removeEvent = useCallback((eventId: string) => {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
    }, []);

    const updateEvent = useCallback((eventId: string, updates: Partial<CalendarEvent>) => {
        setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, ...updates } : e)));
    }, []);

    return {
        events,
        setEvents,
        isLoading,
        fetchEvents,
        updateEvents,
        addEvent,
        removeEvent,
        updateEvent,
    };
}
