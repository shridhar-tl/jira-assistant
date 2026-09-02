import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import classNames from 'classnames';
import type {
    CalendarApi,
    CalendarViewMode,
    DateRange,
    DragInfo,
    EntryCreateInfo,
    EntryRenderContext,
    ResizeInfo,
    ResolvedCalendarEntry,
    ToolbarEndRenderProps,
} from 'fluxo-ui';
import { Calendar as FluxoCalendar } from 'fluxo-ui';

import { useService } from '@/services/injector';

import type { Meeting, Worklog } from '@types';

import { GadgetActionType, type GadgetActionTypeValue } from '@constants';

import { DefaultEndOfDay, DefaultStartOfDay, DefaultWorkingDays, sett_page_calendar } from '@constants/settings';

import AddWorklog from '@dialogs/AddWorklog';

import { parseTimeToHours, resolveViewMode } from './calendar-utils';
import './Calendar.css';
import CalendarEventContent from './CalendarEventContent';
import CalendarSettingsDialog from './CalendarSettings';
import CalendarToolbar from './CalendarToolbar';
import { useCalendarContextMenu, useCalendarData, useMeetingDetails, useWorklogOperations } from './hooks';
import MeetingDetails from './MeetingDetails';
import type { CalendarEntryData, CalendarEvent, CalendarSettings } from './types';

interface CalendarProps {
    isGadget?: boolean;
    viewMode?: string;
    settings?: CalendarSettings;
    refreshKey?: number;
    onWorklogChange?: (actionType: GadgetActionTypeValue) => void;
    headerSlotEl?: HTMLElement | null;
    onTitleChange?: (title: string) => void;
}

export default function Calendar({
    isGadget = false,
    viewMode: propViewMode,
    settings: propSettings,
    refreshKey,
    onWorklogChange,
    headerSlotEl,
    onTitleChange,
}: CalendarProps) {
    const apiRef = useRef<CalendarApi | null>(null);
    const dateRangeRef = useRef<DateRange | null>(null);
    const [fullView, setFullView] = useState(false);
    const [zoomIn, setZoomIn] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showAddWorklogPopup, setShowAddWorklogPopup] = useState(false);
    const [showSettingsPopup, setShowSettingsPopup] = useState(false);
    const [worklogItem, setWorklogItem] = useState<Partial<Worklog> | null>(null);

    const { $session, $config, $analytics, $message, $worklog } = useService(
        'SessionService',
        'ConfigService',
        'AnalyticsService',
        'MessageService',
        'WorklogService',
    );

    const currentUser = $session.CurrentUser;
    const pageSettings = $session.pageSettings?.calendar;

    const [settings, setSettings] = useState<CalendarSettings>(() => {
        const s = { ...sett_page_calendar, ...(propSettings || pageSettings) };
        return { ...s, viewMode: resolveViewMode(s.viewMode) || 'timeGridWeek' };
    });

    const [currentViewMode, setCurrentViewMode] = useState<CalendarViewMode>(
        resolveViewMode(propViewMode) || settings.viewMode || 'timeGridWeek',
    );

    const { events, setEvents, isLoading, fetchEvents } = useCalendarData(settings, currentUser);

    const {
        loadingEventIds,
        handleWorklogDrop,
        handleWorklogResize,
        uploadWorklog,
        uploadAllWorklogs,
        deleteWorklog,
        cloneWorklog,
        addWorklog,
        editWorklog,
    } = useWorklogOperations(setEvents, settings, currentUser);

    const { showMeetingDetails, currentMeetingItem, showMeetingDetailsPopup, hideMeetingDetails } = useMeetingDetails();

    useEffect(() => {
        if (refreshKey && dateRangeRef.current) {
            fetchEvents(dateRangeRef.current.start, dateRangeRef.current.end);
        }
    }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const pendingWorklogCount = useMemo(() => {
        return events.filter((e) => e.data.entryType === 1 && !(e.data.sourceObject as Worklog).isUploaded).length;
    }, [events]);

    useEffect(() => {
        if (propViewMode) {
            const resolved = resolveViewMode(propViewMode);
            if (resolved && resolved !== currentViewMode) {
                setCurrentViewMode(resolved);
                apiRef.current?.changeView(resolved);
            }
        }
    }, [propViewMode, currentViewMode]);

    const [defaultMeetingTicket, setDefaultMeetingTicket] = useState<string>('');
    useEffect(() => {
        const meetingTicket = (currentUser.meetingTicket || '')
            .trim()
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean);

        if (meetingTicket.length === 1) {
            setDefaultMeetingTicket(meetingTicket[0]);
        }
    }, [currentUser.meetingTicket]);

    const saveSettings = useCallback(
        (newSettings: CalendarSettings, noRefresh?: boolean) => {
            if (isGadget) {
                if (!noRefresh && dateRangeRef.current) {
                    fetchEvents(dateRangeRef.current.start, dateRangeRef.current.end);
                }
                return;
            }

            $session.setPageSettings({ ...$session.pageSettings, calendar: newSettings });
            setSettings(newSettings);

            if (!noRefresh && dateRangeRef.current) {
                fetchEvents(dateRangeRef.current.start, dateRangeRef.current.end);
            }

            $config.saveSettings('calendar', newSettings);
        },
        [isGadget, $session, $config, fetchEvents],
    );

    // Meeting worklog creation
    const createWorklogFromMeeting = useCallback(
        async (meeting: Meeting, ticketNo?: string) => {
            if (!meeting.start?.dateTime) {
                return;
            }

            const start = new Date(meeting.start.dateTime);
            const end = meeting.end?.dateTime ? new Date(meeting.end.dateTime) : new Date(start.getTime() + 3600000);
            const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
            const hours = Math.floor(diff / 60);
            const minutes = diff % 60;

            const obj: Partial<Worklog> = {
                dateStarted: start,
                timeSpent: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
                description: meeting.subject || meeting.summary,
                parentId: parseInt(meeting.id) || undefined,
            };

            if (ticketNo) {
                try {
                    const entry = await $worklog.saveWorklog(obj as Worklog);
                    addWorklog(entry);
                    $analytics.trackEvent('Quick add WL', 'User actions');
                } catch (error: any) {
                    if (typeof error === 'string') {
                        $message.error(error);
                    } else {
                        console.error(error);
                    }
                }
            } else {
                setWorklogItem(obj);
                setShowAddWorklogPopup(true);
            }
        },
        [$worklog, $analytics, $message, addWorklog],
    );

    // Context menu
    const handleContextMenu = useCalendarContextMenu({
        onEditWorklog: (wl) => {
            setWorklogItem(wl);
            setShowAddWorklogPopup(true);
        },
        onCopyWorklog: (wl) => {
            setWorklogItem({ ...wl, id: undefined as any, worklogId: undefined });
            setShowAddWorklogPopup(true);
        },
        onUploadWorklog: async (id) => {
            await uploadWorklog(id);
            onWorklogChange?.(GadgetActionType.WorklogModified);
        },
        onDeleteWorklog: async (wl) => {
            await deleteWorklog(wl);
            onWorklogChange?.(GadgetActionType.DeletedWorklog);
        },
        onCreateWorklogFromMeeting: (meeting) => createWorklogFromMeeting(meeting),
        onShowMeetingDetails: showMeetingDetailsPopup,
    });

    // Entry creation handler (user drags on empty time slot or double-clicks)
    const handleEntryCreate = useCallback(
        (info: EntryCreateInfo) => {
            const isMonthMode = info.view === 'dayGridMonth' && !isGadget;

            if (!isMonthMode && info.allDay) {
                return;
            }

            $analytics.trackEvent('Worklog drag', 'User actions');

            const timeSpent = Math.floor((info.end.getTime() - info.start.getTime()) / 1000 / 60);
            const hours = Math.floor(timeSpent / 60);
            const minutes = timeSpent % 60;

            const worklogObj: Partial<Worklog> = {
                timeSpent: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
                dateStarted: isMonthMode
                    ? new Date(`${info.start.toISOString().split('T')[0]} ${currentUser.startOfDay || DefaultStartOfDay}`)
                    : info.start,
            };

            setWorklogItem(worklogObj);
            setShowAddWorklogPopup(true);
        },
        [isGadget, $analytics, currentUser.startOfDay],
    );

    const handleEntryClick = useCallback(
        (entry: ResolvedCalendarEntry, event: React.MouseEvent) => {
            if ((event.target as HTMLElement).hasAttribute('data-event-icon')) {
                return;
            }

            const data = (entry.data || entry.originalEntry?.data) as unknown as CalendarEntryData;

            if (data.entryType === 1) {
                const worklog = data.sourceObject as Worklog;
                setWorklogItem(worklog);
                setShowAddWorklogPopup(true);
            } else if (data.entryType === 2) {
                showMeetingDetailsPopup(data.sourceObject as Meeting);
            }
        },
        [showMeetingDetailsPopup],
    );

    const handleEntryContextMenu = useCallback(
        (entry: ResolvedCalendarEntry, event: React.MouseEvent) => {
            const data = (entry.data || entry.originalEntry?.data) as unknown as CalendarEntryData;
            if (data.entryType === 1 || data.entryType === 2) {
                handleContextMenu(event, data.sourceObject as Worklog | Meeting, data.entryType);
            }
        },
        [handleContextMenu],
    );

    const handleEntryDrop = useCallback(
        async (info: DragInfo) => {
            const entry = info.entry.originalEntry || info.entry;
            const data = entry.data as unknown as CalendarEntryData;
            if (data?.entryType === 1) {
                const calEvent: CalendarEvent = {
                    ...entry,
                    data,
                } as CalendarEvent;
                const isCopy = info.modifiers.ctrl || info.modifiers.alt;
                await handleWorklogDrop(calEvent, info.newStart, info.newEnd, undefined, isCopy, zoomIn);
                onWorklogChange?.(GadgetActionType.WorklogModified);
            }
        },
        [handleWorklogDrop, zoomIn, onWorklogChange],
    );

    const handleEntryResize = useCallback(
        async (info: ResizeInfo) => {
            const entry = info.entry.originalEntry || info.entry;
            const data = entry.data as unknown as CalendarEntryData;
            if (data?.entryType === 1) {
                const calEvent: CalendarEvent = {
                    ...entry,
                    data,
                } as CalendarEvent;
                await handleWorklogResize(calEvent, info.newStart, info.newEnd, zoomIn);
                onWorklogChange?.(GadgetActionType.WorklogModified);
            }
        },
        [handleWorklogResize, zoomIn, onWorklogChange],
    );

    const handleDateRangeChange = useCallback(
        (range: DateRange) => {
            const prev = dateRangeRef.current;
            const datesChanged = !prev || range.start.getTime() !== prev.start.getTime() || range.end.getTime() !== prev.end.getTime();

            if (datesChanged) {
                dateRangeRef.current = range;
                fetchEvents(range.start, range.end);
            }
        },
        [fetchEvents],
    );

    const handleVisibleRangeChange = useCallback(
        (range: DateRange) => {
            const navRange = dateRangeRef.current;
            if (!navRange) {
                dateRangeRef.current = range;
                fetchEvents(range.start, range.end);
                return;
            }
            const expandsStart = range.start.getTime() < navRange.start.getTime();
            const expandsEnd = range.end.getTime() > navRange.end.getTime();
            if (expandsStart || expandsEnd) {
                fetchEvents(range.start, range.end, 'merge');
            }
        },
        [fetchEvents],
    );

    const handleViewChange = useCallback(
        (mode: CalendarViewMode) => {
            if (mode !== currentViewMode) {
                setCurrentViewMode(mode);
                saveSettings({ ...settings, viewMode: mode }, true);
            }
        },
        [currentViewMode, settings, saveSettings],
    );

    const handleWorklogDone = useCallback(
        (result: any) => {
            if (result.type === 0) {
                setShowAddWorklogPopup(false);
                return;
            }

            if (result.removed) {
                const worklog = result.deletedObj as Worklog;
                const worklogId = worklog.id + (worklog.worklogId ? `#${worklog.worklogId}` : '');
                setEvents((prev) => prev.filter((e) => !(e.id === worklogId && e.data.entryType === 1)));
                onWorklogChange?.(GadgetActionType.DeletedWorklog);
            } else if (result.added) {
                addWorklog(result.added);
                onWorklogChange?.(GadgetActionType.WorklogModified);
            } else if (result.edited) {
                editWorklog(result.edited, result.previousTime);
                onWorklogChange?.(GadgetActionType.WorklogModified);
            }

            setShowAddWorklogPopup(false);
        },
        [setEvents, addWorklog, editWorklog, onWorklogChange],
    );

    const handleUploadAll = useCallback(async () => {
        setUploading(true);
        const pending = events.filter((e) => e.data.entryType === 1 && !(e.data.sourceObject as Worklog).isUploaded);

        const success = await uploadAllWorklogs(pending);
        setUploading(false);

        if (success && dateRangeRef.current) {
            fetchEvents(dateRangeRef.current.start, dateRangeRef.current.end);
            onWorklogChange?.(GadgetActionType.WorklogModified);
        }
    }, [events, uploadAllWorklogs, fetchEvents, onWorklogChange]);

    // Custom entry renderer
    const renderEntry = useCallback(
        (entry: ResolvedCalendarEntry, context: EntryRenderContext) => {
            return (
                <CalendarEventContent
                    entry={entry}
                    context={context}
                    settings={settings}
                    events={events}
                    defaultMeetingTicket={defaultMeetingTicket}
                    loadingEventIds={loadingEventIds}
                    onContextMenu={handleContextMenu}
                    onUploadWorklog={async (id) => {
                        await uploadWorklog(id);
                        onWorklogChange?.(GadgetActionType.WorklogModified);
                    }}
                    onCloneWorklog={async (wl) => {
                        await cloneWorklog(wl);
                        onWorklogChange?.(GadgetActionType.WorklogModified);
                    }}
                    onCreateWorklog={(e, meeting, ticket) => {
                        e.stopPropagation();
                        e.preventDefault();
                        createWorklogFromMeeting(meeting, ticket);
                    }}
                />
            );
        },
        [
            settings,
            events,
            defaultMeetingTicket,
            loadingEventIds,
            handleContextMenu,
            uploadWorklog,
            cloneWorklog,
            createWorklogFromMeeting,
            onWorklogChange,
        ],
    );

    const useEmbeddedHeader = isGadget && !!headerSlotEl;

    const toolbarEndContent = useCallback(
        (components: ToolbarEndRenderProps) => (
            <CalendarToolbar
                viewMode={currentViewMode}
                pendingWorklogCount={pendingWorklogCount}
                isLoading={isLoading}
                uploading={uploading}
                fullView={fullView}
                zoomIn={zoomIn}
                isGadget={isGadget}
                onToggleDisplayHours={() => setFullView(!fullView)}
                onToggleZoom={() => setZoomIn(!zoomIn)}
                onUploadAll={handleUploadAll}
                onRefresh={() => dateRangeRef.current && fetchEvents(dateRangeRef.current.start, dateRangeRef.current.end)}
                onSettings={() => setShowSettingsPopup(true)}
                injectedComponents={!isGadget && components}
            />
        ),
        [currentViewMode, pendingWorklogCount, isLoading, uploading, fullView, zoomIn, isGadget, handleUploadAll, fetchEvents],
    );

    const embeddedToolbar = useEmbeddedHeader ? toolbarEndContent({ viewSwitcher: null, pluginActions: null }) : null;

    // Compute calendar config from user settings
    const calendarConfig = useMemo(() => {
        const { startOfDay: rawStartOfDay, endOfDay: rawEndOfDay, startOfWeek, workingDays: rawWorkingDays, timeFormat } = currentUser;

        const startOfDay = rawStartOfDay || DefaultStartOfDay;
        const endOfDay = rawEndOfDay || DefaultEndOfDay;
        const workingDays = rawWorkingDays?.length ? rawWorkingDays : DefaultWorkingDays;

        const { hideWeekends } = settings;
        const { startOfDayDisp, endOfDayDisp } = fullView
            ? { startOfDayDisp: '00:00', endOfDayDisp: '23:59' }
            : { startOfDayDisp: currentUser.startOfDayDisp || startOfDay, endOfDayDisp: currentUser.endOfDayDisp || endOfDay };

        let firstDay = startOfWeek;
        if (firstDay && firstDay > 0) {
            firstDay = firstDay - 1;
        } else {
            firstDay = 0;
        }

        const hour12 = (timeFormat || '').includes('tt');

        const allWeekDays = [0, 1, 2, 3, 4, 5, 6];
        let hiddenDays = hideWeekends ? allWeekDays.filter((v: any) => !workingDays.includes(v)) : [];
        if (hiddenDays?.length === 7) {
            hiddenDays = [];
        }

        return {
            visibleHoursStart: parseTimeToHours(startOfDayDisp || DefaultStartOfDay),
            visibleHoursEnd: parseTimeToHours(endOfDayDisp || DefaultEndOfDay),
            scrollTime: startOfDayDisp || startOfDay,
            firstDayOfWeek: firstDay,
            hiddenDays,
            timeFormat: (hour12 ? '12h' : '24h') as '12h' | '24h',
            businessHours: {
                daysOfWeek: workingDays,
                startTime: startOfDay,
                endTime: endOfDay,
            },
            slotDuration: zoomIn ? 5 : 15,
            snapDuration: zoomIn ? 5 : 15,
            minEntryHeight: settings.readableEvents ? 40 : 20,
            rowBanding: settings.rowBanding || false,
            fixedWeekCount: false,
            allDayText: 'total',
        };
    }, [currentUser, settings, fullView, zoomIn]);

    const calendarClasses = classNames('calendar-view', {
        'cal-row-banding': settings.rowBanding,
    });

    return (
        <div className={calendarClasses}>
            {useEmbeddedHeader && headerSlotEl && createPortal(embeddedToolbar, headerSlotEl)}
            <div className="calendar-container flex-1">
                <FluxoCalendar
                    apiRef={apiRef}
                    entries={events}
                    initialView={currentViewMode}
                    height="100%"
                    editable
                    selectable
                    creatable
                    nowIndicator
                    navLinks
                    showNavigationPicker={!isGadget}
                    navigationPickerIconOnly
                    hideToolbar={useEmbeddedHeader}
                    hideToolbarNavigation={isGadget}
                    hideToolbarViewSwitcher={isGadget}
                    dayHeaderLayout="inline"
                    dayHeaderFormat="EEE, dd/MM"
                    slotLabelInterval={zoomIn ? 15 : 30}
                    hideEmptyDays
                    emptyMessage="No worklogs or meetings in this period"
                    showAllDayRow="always"
                    longPressDelay={600}
                    {...calendarConfig}
                    onEntryCreate={handleEntryCreate}
                    onEntryDrop={handleEntryDrop}
                    onEntryResize={handleEntryResize}
                    onEntryClick={handleEntryClick}
                    onEntryContextMenu={handleEntryContextMenu}
                    onDateRangeChange={handleDateRangeChange}
                    onVisibleRangeChange={handleVisibleRangeChange}
                    onViewChange={handleViewChange}
                    onTitleChange={onTitleChange}
                    renderEntry={renderEntry}
                    renderToolbarEnd={useEmbeddedHeader ? undefined : toolbarEndContent}
                />
            </div>

            {showAddWorklogPopup && worklogItem && (
                <AddWorklog worklog={worklogItem as Worklog} onDone={handleWorklogDone} onHide={() => setShowAddWorklogPopup(false)} />
            )}

            {showSettingsPopup && (
                <CalendarSettingsDialog
                    settings={settings}
                    onDone={(newSettings: CalendarSettings) => {
                        saveSettings(newSettings);
                        setShowSettingsPopup(false);
                    }}
                    onHide={() => setShowSettingsPopup(false)}
                />
            )}

            {showMeetingDetails && currentMeetingItem && (
                <div
                    className="meeting-details-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={hideMeetingDetails}
                >
                    <div
                        className="rounded-lg p-4 max-w-2xl max-h-[80vh] overflow-auto bg-(--bg-primary) border border-(--border-primary) shadow-(--shadow-xl)"
                        onClick={(e: any) => e.stopPropagation()}
                    >
                        <MeetingDetails eventDetails={currentMeetingItem} />
                    </div>
                </div>
            )}
        </div>
    );
}
