import { useCallback, useEffect, useRef, useState } from 'react';

import { Dialog } from '@dialogs';

import { Icons } from '@/constants/icons';

import { inject } from '@services';

import { TextParser } from '@components';

import UpdatesInfo from './UpdatesInfo';

interface NotificationMessage {
    id: string;
    type: string;
    title: string;
    message: string;
    read?: boolean;
    important?: boolean;
}

interface NotificationsState {
    updates_info?: any[];
    list: NotificationMessage[];
    total: number;
    unread: number;
}

interface NotificationsProps {
    notifications: NotificationsState;
}

export default function Notifications({ notifications }: NotificationsProps) {
    const [showPanel, setShowPanel] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const { $noti, $analytics, $utils } = inject('NotificationService', 'AnalyticsService', 'UtilsService');

    const { updates_info, list, total: initialTotal, unread: initialUnread } = notifications;
    const [unread, setUnread] = useState(initialUnread);
    const total = initialTotal;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setShowPanel(false);
            }
        };

        if (showPanel) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPanel]);

    const markRead = useCallback(
        (msg: NotificationMessage, viewed: boolean) => {
            if (!msg.read) {
                msg.read = true;
                $noti.markRead(msg);
                setUnread((u) => (u || 1) - 1);

                const event = viewed ? 'Viewed' : 'Mark as read';
                const eventName = (msg.type === 'versionInfo' ? 'Update Info: ' : 'Message: ') + event;
                $analytics.trackEvent(eventName, 'Messages', `Message Id: ${msg.id}`);
            }
        },
        [$noti, $analytics],
    );

    const readMessage = useCallback(
        (msg: NotificationMessage) => {
            let message: React.ReactNode = msg.message;
            let styles: React.CSSProperties | undefined;

            if (msg.type === 'versionInfo') {
                styles = { width: '90vw', maxWidth: '1000px' };
                message = <UpdatesInfo updates={updates_info || []} />;
            } else {
                message = <TextParser message={message as string} />;
            }

            Dialog.alert(message, msg.title, styles).then(
                () => markRead(msg, true),
                () => markRead(msg, true),
            );
        },
        [updates_info, markRead],
    );

    const viewList = useCallback(() => {
        setShowPanel((prev) => !prev);
        $analytics.trackEvent('Messages: List viewed', 'Messages', `Messages: Total: ${total}, Unread: ${unread}`);
    }, [total, unread, $analytics]);

    if (!list || !list.length) {
        return null;
    }

    return (
        <li className="nav-item relative list-none">
            <span
                className="relative cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-(--text-secondary) hover:bg-(--bg-hover) hover:text-(--text-primary)"
                title="Announcement / updates from developer"
                onClick={viewList}
            >
                {Icons.announcement}
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 leading-none">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </span>
            {showPanel && (
                <div
                    ref={panelRef}
                    className="absolute right-0 top-full mt-1 w-96 rounded-lg z-50 overflow-hidden bg-(--bg-primary) border border-(--border-primary) shadow-(--shadow-xl)"
                >
                    <div className="p-4">
                        <div className="text-center font-semibold text-sm mb-3 text-primary">
                            You have {unread || total} {unread ? 'unread' : ''} messages
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {list.map((msg, i) => (
                                <Message key={i} message={msg} onOpen={readMessage} onRead={markRead} cut={$utils.cut} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </li>
    );
}

interface MessageProps {
    message: NotificationMessage;
    onOpen: (msg: NotificationMessage) => void;
    onRead: (msg: NotificationMessage, viewed: boolean) => void;
    cut: (text: string, length: number, addDots?: boolean) => string;
}

function Message({ message, onOpen, onRead, cut }: MessageProps) {
    const readMessage = useCallback(() => onOpen(message), [message, onOpen]);
    const markRead = useCallback(() => onRead(message, false), [message, onRead]);

    return (
        <div
            className="p-3 rounded border border-(--border-primary) cursor-pointer hover:bg-(--bg-hover)"
            title="Click to view this message"
        >
            {!message.read && (
                <small className="float-right mt-0" onClick={markRead} title="Click to mark this message as read">
                    <i className="fa fa-eye text-blue-500 hover:text-blue-600" />
                </small>
            )}
            <div className={`truncate text-sm text-primary ${message.read ? '' : 'font-bold'}`} onClick={readMessage}>
                {message.important && <i className="fa fa-exclamation text-red-500 mr-1" />}
                {message.title}
            </div>
            <div className="text-xs text-secondary mt-1" onClick={readMessage}>
                <TextParser message={cut(message.message, 175, true)} />
            </div>
        </div>
    );
}
