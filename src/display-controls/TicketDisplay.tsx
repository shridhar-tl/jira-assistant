import { forwardRef, useImperativeHandle, type ElementType } from 'react';

import { Link } from '@/controls';
import { useWorklogStore } from '@/stores/worklog-store';

import { inject } from '@services';

import { showContextMenu } from '@components';

import BaseControl from './BaseControl';

interface TicketDisplayProps {
    value?: string;
    url?: string;
    hideContext?: boolean;
    hideWorklog?: boolean;
    onAddWorklog?: (ticketKey: string) => void;
    onBookmark?: () => void;
    tag?: ElementType | null;
    className?: string;
    [key: string]: any;
}

export interface TicketDisplayHandle {
    showContext: (event: React.MouseEvent) => void;
}

const TicketDisplay = forwardRef<TicketDisplayHandle, TicketDisplayProps>(function TicketDisplay(
    { value, url, hideContext = false, hideWorklog = false, onAddWorklog, onBookmark, tag, className, ...rest },
    ref,
) {
    const { $userutils, $bookmark } = inject('UserUtilsService', 'BookmarkService');
    const { getElapsedTimeInSecs, startTimer, pauseTimer, resumeTimer, stopTimer } = useWorklogStore();

    const ticketUrl = url || $userutils.getTicketUrl(value || '') || '';

    const handleAddWorklog = () => {
        if (onAddWorklog) {
            onAddWorklog(value!);
        }
    };

    const handleAddBookmark = async () => {
        await $bookmark.addBookmark([value!], !onBookmark);
        if (onBookmark) {
            onBookmark();
        }
    };

    const showContext = (event: React.MouseEvent) => {
        event.preventDefault();
        const menus = [
            ...(!hideWorklog ? [{ label: 'Add worklog', id: 'add-worklog', command: handleAddWorklog }] : []),
            { label: 'Bookmark', id: 'bookmark', command: handleAddBookmark },
        ];

        try {
            const result = getElapsedTimeInSecs();
            const isCurTicket = result?.key === value;
            const isRunning = result?.isRunning;

            if (!isCurTicket) {
                menus.push({ label: 'Start timer', id: 'start-timer', command: () => startTimer(value!) });
            } else {
                if (isRunning) {
                    menus.push({ label: 'Pause timer', id: 'pause-timer', command: () => pauseTimer() });
                } else {
                    menus.push({ label: 'Resume timer', id: 'resume-timer', command: () => resumeTimer() });
                }
                menus.push({ label: 'Stop timer', id: 'stop-timer', command: () => stopTimer() });
            }
        } catch {}

        showContextMenu(event, menus);
    };

    useImperativeHandle(ref, () => ({ showContext }));

    if (!value) return <BaseControl tag={tag} className={className} {...rest} />;

    return (
        <BaseControl tag={tag} className={className} {...rest}>
            {!hideContext && <i className="fa fa-ellipsis-v mr-2 cursor-pointer" onClick={showContext}></i>}
            <Link href={ticketUrl} className="text-blue-600 hover:underline">
                {value}
            </Link>
        </BaseControl>
    );
});

export default TicketDisplay;
