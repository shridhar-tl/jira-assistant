import { useCallback, useState } from 'react';

import { format } from 'date-fns';

import { useService } from '@/services/injector';

import type { Worklog, WorklogCalendarEntry } from '@types';

import { createInfoEvent, createWorklogEvent, snapTimeToGrid } from '../calendar-utils';
import type { CalendarEvent } from '../types';

type SetEvents = React.Dispatch<React.SetStateAction<CalendarEvent[]>>;

function buildWorklogCalendarEntry(sourceEvent: CalendarEvent, worklog: Worklog, newStart: Date, durationMs: number): WorklogCalendarEntry {
    return {
        entryType: 1,
        id: sourceEvent.id as string,
        start: newStart,
        end: new Date(newStart.getTime() + durationMs),
        title: sourceEvent.title,
        url: '',
        editable: sourceEvent.editable ?? true,
        sourceObject: { ...worklog, dateStarted: newStart },
    };
}

function getUpdatedAllDayEvents(date: Date, eventsList: CalendarEvent[], settings: any, currentUser: any): CalendarEvent[] {
    const dateKey = format(date, 'yyyy-MM-dd');

    // Remove existing info event for this date
    let result = eventsList.filter((e) => !(e.id === dateKey && e.data.entryType === 3));

    const worklogs = result
        .filter((e) => e.data.entryType === 1)
        .map((e) => e.data.sourceObject as Worklog)
        .filter((wl) => format(new Date(wl.dateStarted), 'yyyy-MM-dd') === dateKey);

    if (worklogs.length > 0 && settings.showInfo) {
        const infoEvent = createInfoEvent(new Date(dateKey), worklogs, currentUser.maxHours, currentUser.minHours, settings);
        result = [...result, infoEvent];
    }

    return result;
}

export function useWorklogOperations(setEvents: SetEvents, settings: any, currentUser: any) {
    const { $worklog, $message, $analytics } = useService('WorklogService', 'MessageService', 'AnalyticsService');
    const [loadingEventIds, setLoadingEventIds] = useState<Set<string>>(new Set());

    const addLoadingEvent = useCallback((id: string) => {
        setLoadingEventIds((prev) => new Set(prev).add(id));
    }, []);

    const removeLoadingEvent = useCallback((id: string) => {
        setLoadingEventIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const handleWorklogDrop = useCallback(
        async (
            entry: CalendarEvent,
            newStart: Date,
            _newEnd: Date,
            _revert: (() => void) | undefined,
            isCopy: boolean,
            zoomIn: boolean,
        ) => {
            const worklog = entry.data.sourceObject as Worklog;
            const entryId = entry.id as string;
            addLoadingEvent(entryId);

            if (isCopy) {
                try {
                    const newEntry = await $worklog.copyWorklog(worklog, newStart);
                    const newEvent = createWorklogEvent(newEntry, settings);
                    setEvents((prev) => {
                        let updated = [...prev, newEvent];
                        updated = getUpdatedAllDayEvents(new Date(newEntry.start), updated, settings, currentUser);
                        return updated;
                    });
                    $analytics.trackEvent(
                        'Worklog quick copied',
                        'User actions',
                        worklog.isUploaded ? 'Uploaded worklog' : 'Pending worklog',
                    );
                } catch (error) {
                    console.error('Error copying worklog:', error);
                    $message.error('Failed to copy worklog');
                } finally {
                    removeLoadingEvent(entryId);
                }
            } else {
                const oldDate = new Date(worklog.dateStarted);
                const newTime = snapTimeToGrid(zoomIn ? 5 : 15, newStart);
                const durationMs = new Date(entry.end).getTime() - new Date(entry.start).getTime();

                const optimisticEntry = buildWorklogCalendarEntry(entry, worklog, newTime, durationMs);
                const optimisticEvent = createWorklogEvent(optimisticEntry, settings);

                setEvents((prev) => {
                    let updated = prev.map((e) => (e.id === entry.id && e.data.entryType === 1 ? optimisticEvent : e));
                    updated = getUpdatedAllDayEvents(oldDate, updated, settings, currentUser);
                    updated = getUpdatedAllDayEvents(newTime, updated, settings, currentUser);
                    return updated;
                });

                try {
                    const updatedEntry = await $worklog.changeWorklogDate(worklog, newTime);
                    const updatedEvent = createWorklogEvent(updatedEntry, settings);

                    setEvents((prev) => {
                        let updated = prev.map((e) => (e.id === entry.id && e.data.entryType === 1 ? updatedEvent : e));
                        updated = getUpdatedAllDayEvents(oldDate, updated, settings, currentUser);
                        updated = getUpdatedAllDayEvents(new Date(updatedEntry.start), updated, settings, currentUser);
                        return updated;
                    });
                    $analytics.trackEvent('Worklog moved', 'User actions', worklog.isUploaded ? 'Uploaded worklog' : 'Pending worklog');
                } catch (error) {
                    console.error('Error moving worklog:', error);
                    $message.error('Failed to move worklog');

                    const revertedEntry = buildWorklogCalendarEntry(entry, worklog, oldDate, durationMs);
                    const revertedEvent = createWorklogEvent(revertedEntry, settings);

                    setEvents((prev) => {
                        let updated = prev.map((e) => (e.id === entry.id && e.data.entryType === 1 ? revertedEvent : e));
                        updated = getUpdatedAllDayEvents(newTime, updated, settings, currentUser);
                        updated = getUpdatedAllDayEvents(oldDate, updated, settings, currentUser);
                        return updated;
                    });
                } finally {
                    removeLoadingEvent(entryId);
                }
            }
        },
        [setEvents, settings, currentUser, $worklog, $message, $analytics, addLoadingEvent, removeLoadingEvent],
    );

    const handleWorklogResize = useCallback(
        async (entry: CalendarEvent, newStart: Date, newEnd: Date, zoomIn: boolean) => {
            const worklog = entry.data.sourceObject as Worklog;
            const snappedEnd = snapTimeToGrid(zoomIn ? 5 : 15, newEnd);
            const diff = (snappedEnd.getTime() - newStart.getTime()) / 1000;
            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const timeSpent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

            const entryId = entry.id as string;
            addLoadingEvent(entryId);

            const startDate = new Date(newStart);
            const newDurationMs = snappedEnd.getTime() - startDate.getTime();
            const optimisticEntry = buildWorklogCalendarEntry(entry, worklog, startDate, newDurationMs);
            const optimisticEvent = createWorklogEvent(optimisticEntry, settings);

            setEvents((prev) => {
                let updated = prev.map((e) => (e.id === entry.id && e.data.entryType === 1 ? optimisticEvent : e));
                updated = getUpdatedAllDayEvents(startDate, updated, settings, currentUser);
                return updated;
            });

            try {
                const updatedEntry = await $worklog.changeWorklogTS(worklog, timeSpent);
                const updatedEvent = createWorklogEvent(updatedEntry, settings);

                setEvents((prev) => {
                    let updated = prev.map((e) => (e.id === entry.id && e.data.entryType === 1 ? updatedEvent : e));
                    updated = getUpdatedAllDayEvents(new Date(updatedEntry.start), updated, settings, currentUser);
                    return updated;
                });
                $analytics.trackEvent('Worklog resized', 'User actions', worklog.isUploaded ? 'Uploaded worklog' : 'Pending worklog');
            } catch (error) {
                console.error('Error resizing worklog:', error);
                $message.error('Failed to resize worklog');

                const originalDurationMs = new Date(entry.end).getTime() - new Date(entry.start).getTime();
                const originalDate = new Date(entry.start);
                const revertedEntry = buildWorklogCalendarEntry(entry, worklog, originalDate, originalDurationMs);
                const revertedEvent = createWorklogEvent(revertedEntry, settings);

                setEvents((prev) => {
                    let updated = prev.map((e) => (e.id === entry.id && e.data.entryType === 1 ? revertedEvent : e));
                    updated = getUpdatedAllDayEvents(originalDate, updated, settings, currentUser);
                    return updated;
                });
            } finally {
                removeLoadingEvent(entryId);
            }
        },
        [setEvents, settings, currentUser, $worklog, $message, $analytics, addLoadingEvent, removeLoadingEvent],
    );

    const uploadWorklog = useCallback(
        async (worklogId: number) => {
            const entryId = worklogId.toString();
            addLoadingEvent(entryId);

            try {
                const uploaded = await $worklog.uploadWorklogs([worklogId], true);
                const uploadedEntry = uploaded[0] as WorklogCalendarEntry;
                const updatedEvent = createWorklogEvent(uploadedEntry, settings);

                setEvents((prev) => {
                    let updated = prev.map((e) => (e.id === entryId && e.data.entryType === 1 ? updatedEvent : e));
                    updated = getUpdatedAllDayEvents(new Date(uploadedEntry.start), updated, settings, currentUser);
                    return updated;
                });

                $message.success('Worklog uploaded successfully!');
                $analytics.trackEvent('Worklog uploaded: Individual', 'User actions');
            } catch (error) {
                console.error('Error uploading worklog:', error);
                $message.error('Failed to upload worklog');
            } finally {
                removeLoadingEvent(entryId);
            }
        },
        [setEvents, settings, currentUser, $worklog, $message, $analytics, addLoadingEvent, removeLoadingEvent],
    );

    const uploadAllWorklogs = useCallback(
        async (pendingWorklogs: CalendarEvent[]) => {
            try {
                const worklogIds = pendingWorklogs.map((e) => (e.data.sourceObject as Worklog).id);
                await $worklog.uploadWorklogs(worklogIds);

                $message.success(`${worklogIds.length} worklog(s) uploaded successfully!`);
                $analytics.trackEvent('Worklog uploaded: All', 'User actions');
                return true;
            } catch (error: any) {
                if (error.message || error.response) {
                    $message.error(error.message || error.response);
                }
                return false;
            }
        },
        [$worklog, $message, $analytics],
    );

    const deleteWorklog = useCallback(
        async (worklog: Worklog) => {
            try {
                await $worklog.deleteWorklog(worklog);
                const worklogId = worklog.id + (worklog.worklogId ? `#${worklog.worklogId}` : '');

                setEvents((prev) => {
                    let updated = prev.filter((e) => !(e.id === worklogId && e.data.entryType === 1));
                    updated = getUpdatedAllDayEvents(new Date(worklog.dateStarted), updated, settings, currentUser);
                    return updated;
                });
                $analytics.trackEvent('Worklog deleted', 'User actions', worklog.isUploaded ? 'Uploaded worklog' : 'Pending worklog');
            } catch (error) {
                console.error('Error deleting worklog:', error);
                $message.error('Failed to delete worklog');
            }
        },
        [setEvents, settings, currentUser, $worklog, $message, $analytics],
    );

    const cloneWorklog = useCallback(
        async (worklog: Worklog) => {
            try {
                const clonedEntry = await $worklog.copyWorklog(worklog);
                const newEvent = createWorklogEvent(clonedEntry, settings);

                setEvents((prev) => {
                    let updated = [...prev, newEvent];
                    updated = getUpdatedAllDayEvents(new Date(clonedEntry.start), updated, settings, currentUser);
                    return updated;
                });
                $message.success('Worklog cloned!');
                $analytics.trackEvent('Worklog Cloned: Individual', 'User actions');
            } catch (error: any) {
                console.error('Error cloning worklog:', error);
                $message.error(error.message || 'Failed to clone worklog');
            }
        },
        [setEvents, settings, currentUser, $worklog, $message, $analytics],
    );

    const addWorklog = useCallback(
        (entry: WorklogCalendarEntry) => {
            const newEvent = createWorklogEvent(entry, settings);
            setEvents((prev) => {
                let updated = [...prev, newEvent];
                updated = getUpdatedAllDayEvents(new Date(entry.start), updated, settings, currentUser);
                return updated;
            });
        },
        [setEvents, settings, currentUser],
    );

    const editWorklog = useCallback(
        (entry: WorklogCalendarEntry, previousTime?: Date) => {
            const updatedEvent = createWorklogEvent(entry, settings);

            setEvents((prev) => {
                let updated = prev.map((e) => (e.id === entry.id && e.data.entryType === 1 ? updatedEvent : e));
                if (previousTime) {
                    updated = getUpdatedAllDayEvents(previousTime, updated, settings, currentUser);
                }
                updated = getUpdatedAllDayEvents(new Date(entry.start), updated, settings, currentUser);
                return updated;
            });
        },
        [setEvents, settings, currentUser],
    );

    return {
        loadingEventIds,
        handleWorklogDrop,
        handleWorklogResize,
        uploadWorklog,
        uploadAllWorklogs,
        deleteWorklog,
        cloneWorklog,
        addWorklog,
        editWorklog,
    };
}
