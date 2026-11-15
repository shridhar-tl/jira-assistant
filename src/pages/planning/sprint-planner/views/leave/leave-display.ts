import type { CalendarEntry } from '@components';

import type { LeaveEntry, TeamMember } from '../../../shared/types';

export const leaveSourceLabels: Record<LeaveEntry['source'], string> = {
    manual: 'Manual',
    outlook: 'Outlook',
    google: 'Google',
    ics: '.ics',
    confluence: 'Confluence',
};

const memberColors = ['#2563eb', '#7c3aed', '#db2777', '#0d9488', '#ea580c', '#4f46e5', '#0891b2', '#65a30d', '#c026d3', '#be123c', '#0369a1', '#a16207'];
const holidayColor = '#b45309';
const textColor = '#ffffff';

export interface LeaveCalendarData extends Record<string, unknown> {
    leave: LeaveEntry;
}

export function getLeaveIcon(entry: LeaveEntry): string {
    if (entry.source !== 'manual') {
        return 'fa fa-calendar';
    }
    return entry.memberId ? 'fa fa-plane' : 'fa fa-flag';
}

export function getMemberName(members: TeamMember[], id: string): string {
    return members.find((m) => m.id === id)?.displayName || id;
}

export function getLeaveWho(entry: LeaveEntry, members: TeamMember[]): string {
    if (entry.memberId) {
        return getMemberName(members, entry.memberId);
    }
    if (entry.memberIds?.length) {
        return entry.memberIds.length === 1 ? getMemberName(members, entry.memberIds[0]) : `${entry.memberIds.length} people`;
    }
    return 'Everyone';
}

export function appliesToMembers(entry: LeaveEntry, memberIds: Set<string>): boolean {
    if (!memberIds.size) {
        return true;
    }
    if (entry.memberId) {
        return memberIds.has(entry.memberId);
    }
    return !entry.memberIds?.length || entry.memberIds.some((id) => memberIds.has(id));
}

export function toCalendarEntry(entry: LeaveEntry, members: TeamMember[], editable: boolean, parseDate: (key: string) => Date): CalendarEntry {
    const memberIndex = entry.memberId ? members.findIndex((m) => m.id === entry.memberId) : -1;
    const isHoliday = !entry.memberId;
    const hours = entry.hours !== null ? ` (${entry.hours} h)` : '';
    return {
        id: `${entry.source}:${entry.id}`,
        title: `${isHoliday && !entry.memberIds?.length ? '' : `${getLeaveWho(entry, members)} · `}${entry.title}${hours}`,
        start: parseDate(entry.start),
        end: parseDate(entry.end),
        allDay: true,
        color: isHoliday ? holidayColor : memberColors[(memberIndex < 0 ? 0 : memberIndex) % memberColors.length],
        textColor,
        editable: editable && entry.source === 'manual',
        data: { leave: entry } satisfies LeaveCalendarData,
    };
}
