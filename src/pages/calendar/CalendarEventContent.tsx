import type { EntryRenderContext, ResolvedCalendarEntry } from 'fluxo-ui';

import { useService } from '@/services/injector';

import type { Meeting, Worklog } from '@types';

import { getEntryTimeFormat, getEventDuration, isDayGridView, isListView, isTimeGridView } from './calendar-utils';
import type { CalendarEntryData, CalendarEvent, CalendarSettings } from './types';
import WorklogOptions from './WorklogOptions';

interface CalendarEventContentProps {
    entry: ResolvedCalendarEntry;
    context: EntryRenderContext;
    settings: CalendarSettings;
    events: CalendarEvent[];
    defaultMeetingTicket?: string;
    loadingEventIds?: Set<string>;
    onContextMenu: (event: React.MouseEvent, item: Worklog | Meeting, type: 1 | 2) => void;
    onUploadWorklog: (id: number) => void;
    onCloneWorklog: (worklog: Worklog) => void;
    onCreateWorklog: (event: React.MouseEvent, meeting: Meeting, ticket?: string) => void;
}

export default function CalendarEventContent({
    entry,
    context,
    settings,
    events,
    defaultMeetingTicket,
    loadingEventIds,
    onContextMenu,
    onUploadWorklog,
    onCloneWorklog,
    onCreateWorklog,
}: CalendarEventContentProps) {
    const { view } = context;
    const data = (entry.data || entry.originalEntry?.data) as unknown as CalendarEntryData;
    const { entryType, logged, diff, sourceObject } = data;
    const { $utils, $session } = useService('UtilsService', 'SessionService');

    const startTime = entry.start instanceof Date ? entry.start : new Date(entry.start);
    const timeText = $utils.formatDate(startTime, getEntryTimeFormat($session.CurrentUser?.timeFormat));
    const hourDiff = ` (${$utils.formatTs(getEventDuration(entry as any))})`;

    if (entryType === 3) {
        const timeSpent = $utils.formatSecs(logged!);
        const diffStr = diff ? ` (${diff > 0 ? '+' : ''}${$utils.formatSecs(Math.abs(diff))})` : '';
        return <span className="pad-l-5">{`Logged: ${timeSpent}${diffStr}`}</span>;
    }

    const srcObj = sourceObject as Worklog | Meeting;
    let evTitle = entry.title;
    let subTitle = '';
    let title = '';

    if (entryType === 1) {
        const wl = srcObj as Worklog;
        const { detailsMode } = settings;

        if (detailsMode === '2') {
            evTitle = `${wl.ticketNo} - ${wl.summary}`;
        } else if (detailsMode === '3') {
            subTitle = wl.summary || '';
        }

        title = `${timeText} ${hourDiff}\n${evTitle}`;
    }

    const isLoading = loadingEventIds?.has(String(entry.id));
    let leftIcon: React.ReactElement | null = null;

    if (entryType === 1) {
        const w = srcObj as Worklog;

        if (isLoading) {
            leftIcon = <i className="fa fa-refresh fa-spin float-start" data-event-icon="true" />;
        } else {
            const handleContextMenuClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                onContextMenu(e, w, 1);
            };

            leftIcon = (
                <i className="fa fa-ellipsis-v float-start" title="Show options" onClick={handleContextMenuClick} data-event-icon="true" />
            );
        }
    } else if (entryType === 2) {
        const m = srcObj as Meeting;
        const hasWorklog = events.some((e) => e.parentId === entry.id && e.data.entryType === 1);

        const handleContextMenuClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            onContextMenu(e, m, 2);
        };

        if (!hasWorklog) {
            leftIcon = (
                <i
                    className="fa fa-clock float-start"
                    title="Create worklog for this meeting"
                    data-event-icon="true"
                    onClick={(e: any) => {
                        e.stopPropagation();
                        onCreateWorklog(e, m, defaultMeetingTicket);
                    }}
                />
            );
        } else {
            leftIcon = (
                <i className="fa fa-ellipsis-v float-start" title="Show options" onClick={handleContextMenuClick} data-event-icon="true" />
            );
        }
    }

    if (isTimeGridView(view)) {
        const wl = entryType === 1 ? (srcObj as Worklog) : null;
        const lines = (evTitle ? 3 : 0) + (subTitle ? 3 : 0);
        const totalMins = wl?.totalMins || 0;
        const clsName = lines * 30 > totalMins ? ' short-desc' : '';

        return (
            <div className="cal-entry-content pad-8" title={title} data-jira-key={wl?.ticketNo} data-jira-wl-id={wl?.worklogId}>
                {entryType === 1 && wl && <WorklogOptions worklog={wl} onUpload={onUploadWorklog} onClone={onCloneWorklog} />}
                {leftIcon}
                <div className="cal-entry-time">
                    <span>{timeText}</span>
                    <span className="cal-entry-hour"> {hourDiff}</span>
                </div>
                <div className={`cal-entry-title${clsName}`}>{evTitle}</div>
                {!!subTitle && (
                    <div className={`cal-entry-subtitle${clsName}`} title={subTitle}>
                        {subTitle}
                    </div>
                )}
            </div>
        );
    }

    if (isDayGridView(view)) {
        const wl = entryType === 1 ? (srcObj as Worklog) : null;
        return (
            <div
                className="cal-entry-content cal-daygrid-content"
                title={title}
                data-jira-key={wl?.ticketNo}
                data-jira-wl-id={wl?.worklogId}
            >
                {evTitle}
            </div>
        );
    }

    if (isListView(view)) {
        const wl = entryType === 1 ? (srcObj as Worklog) : null;
        return (
            <div className="cal-entry-content cal-list-content" title={title} data-jira-key={wl?.ticketNo} data-jira-wl-id={wl?.worklogId}>
                <span className="cal-list-title">{evTitle}</span>
            </div>
        );
    }

    return null;
}
