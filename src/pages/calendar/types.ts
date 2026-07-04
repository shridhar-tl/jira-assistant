import type { CalendarEntry, CalendarViewMode } from 'fluxo-ui';

import type { Meeting, Worklog, WorklogCalendarEntry } from '@types';

export interface CalendarSettings {
    viewMode: CalendarViewMode;
    showMeetings: boolean;
    showWorklogs: boolean;
    showInfo: boolean;
    eventColor?: string;
    worklogColor?: string;
    infoColor_valid?: string;
    infoColor_less?: string;
    infoColor_high?: string;
    rowBanding?: boolean;
    hideWeekends?: boolean;
    readableEvents?: boolean;
    detailsMode?: '1' | '2' | '3';
}

export interface CalendarEntryData {
    entryType: 1 | 2 | 3; // 1 = worklog, 2 = meeting, 3 = info
    sourceObject: Worklog | Meeting | CalendarInfoEvent;
    source?: string;
    logged?: number;
    diff?: number;
    [key: string]: unknown;
}

export interface CalendarEvent extends CalendarEntry {
    data: CalendarEntryData;
    parentId?: string | number;
}

export interface CalendarInfoEvent {
    id: string;
    key: string;
    logged: number;
    diff: number;
}

export interface MeetingView {
    summary: string;
    htmlLink?: string;
    location?: string;
    description?: string;
    descrLimit: number;
    date: string;
    startTime: string;
    endTime?: string;
    remaining?: string;
    creator?: any;
    organizer?: string;
    attendees?: {
        total: number;
        yes: number;
        no: number;
        awaiting: number;
        tentative: number;
        list: Array<{
            email?: string;
            displayName?: string;
        }>;
    };
    videoCall?: {
        url: string;
        name: string;
    };
}

export interface WorklogAddResult {
    type: number;
    added?: WorklogCalendarEntry;
    edited?: WorklogCalendarEntry;
    removed?: number;
    deletedObj?: Worklog;
    previousTime?: Date;
}
