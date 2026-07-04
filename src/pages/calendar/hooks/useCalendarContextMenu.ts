import { useCallback } from 'react';

import { inject } from '@/services/injector';

import { useContextMenu } from '@components/shared/ContextMenu';

import type { Meeting, Worklog } from '@types';

interface UseCalendarContextMenuOptions {
    onEditWorklog: (worklog: Worklog) => void;
    onCopyWorklog: (worklog: Worklog) => void;
    onUploadWorklog: (id: number) => void;
    onDeleteWorklog: (worklog: Worklog) => void;
    onCreateWorklogFromMeeting: (meeting: Meeting) => void;
    onShowMeetingDetails: (meeting: Meeting) => void;
}

export function useCalendarContextMenu({
    onEditWorklog,
    onCopyWorklog,
    onUploadWorklog,
    onDeleteWorklog,
    onCreateWorklogFromMeeting,
    onShowMeetingDetails,
}: UseCalendarContextMenuOptions) {
    const contextMenu = useContextMenu();

    const handleContextMenu = useCallback(
        (event: React.MouseEvent, item: Worklog | Meeting, type: 1 | 2) => {
            event.preventDefault();
            event.stopPropagation();

            const { $userutils: $uu, $jaBrowserExtn } = inject('UserUtilsService', 'AppBrowserService');

            if (type === 1) {
                const wl = item as Worklog;
                contextMenu.show(event, [
                    {
                        label: 'Edit worklog',
                        icon: 'fa fa-edit',
                        command: () => onEditWorklog(wl),
                    },
                    {
                        label: 'Open ticket',
                        icon: 'fa fa-external-link',
                        command: () => {
                            const url = wl.ticketNo && $uu.getTicketUrl(wl.ticketNo);
                            if (url) {
                                $jaBrowserExtn.openTab(url);
                            }
                        },
                    },
                    {
                        label: 'Copy worklog',
                        icon: 'fa fa-copy',
                        command: () => onCopyWorklog(wl),
                    },
                    {
                        label: 'Upload worklog',
                        icon: 'fa fa-upload',
                        disabled: wl.isUploaded,
                        command: () => onUploadWorklog(wl.id),
                    },
                    {
                        label: 'Delete worklog',
                        icon: 'fa fa-times',
                        command: () => onDeleteWorklog(wl),
                    },
                ]);
            } else if (type === 2) {
                const meeting = item as Meeting;
                contextMenu.show(event, [
                    { label: 'Add worklog', icon: 'fa fa-clock', command: () => onCreateWorklogFromMeeting(meeting) },
                    { label: 'Show details', icon: 'fa fa-info-circle', command: () => onShowMeetingDetails(meeting) },
                ]);
            }
        },
        [contextMenu, onEditWorklog, onCopyWorklog, onUploadWorklog, onDeleteWorklog, onCreateWorklogFromMeeting, onShowMeetingDetails],
    );

    return handleContextMenu;
}
