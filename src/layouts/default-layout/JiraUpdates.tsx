import { useRef, useState, useEffect, useCallback } from 'react';

import { Icons } from '@/constants/icons';
import { Link } from '@/controls';
import { DateDisplay, UserDisplay } from '@/display-controls';

import { inject } from '@services';

interface JiraUpdate {
    key: string;
    summary: string;
    href: string;
    updates: Array<{
        date: Date;
        author: any;
        field: string;
        fromString: string;
        toString: string;
    }>;
}

interface UpdatesState {
    list?: JiraUpdate[];
    total?: number;
    ticketCount?: number;
}

export default function JiraUpdates() {
    const panelRef = useRef<HTMLDivElement>(null);
    const [state, setState] = useState<UpdatesState>({});
    const [showPanel, setShowPanel] = useState(false);
    const { list, total, ticketCount } = state;

    const { $utils } = inject('UtilsService');

    useEffect(() => {
        getUpdates().then(setState);
    }, []);

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

    const togglePanel = useCallback(() => {
        setShowPanel((prev) => !prev);
        if (total) {
            trackViewList(total);
        }
    }, [total]);

    if (!list || !list.length) {
        return null;
    }

    return (
        <li className="nav-item relative list-none">
            <span
                className="relative cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-(--text-secondary) hover:bg-(--bg-hover) hover:text-(--text-primary)"
                onClick={togglePanel}
                title="Notification updates from Jira"
            >
                {Icons.bellNotification}
                {total! > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center bg-amber-400 text-black text-[10px] font-bold rounded-full w-4 h-4 leading-none">
                        {total! > 9 ? '9+' : total}
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
                            You have {total} updates on {ticketCount} issues
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {list.map((msg, i) => (
                                <Message key={i} message={msg} cut={$utils.cut} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </li>
    );
}

interface MessageProps {
    message: JiraUpdate;
    cut: (text: string, length: number, addDots?: boolean) => string;
}

function Message({ message: msg, cut }: MessageProps) {
    return (
        <Link
            className="block p-3 rounded border border-(--border-primary) no-underline hover:bg-(--bg-hover)"
            title="Click to view this ticket in jira"
            href={msg.href}
        >
            <div className="truncate text-sm font-semibold text-primary" title={msg.summary}>
                {msg.key} - {cut(msg.summary, 100, true)}
            </div>
            {msg.updates.map(({ date, author, field, fromString, toString }, i) => (
                <div key={i} className="text-xs text-secondary mt-1">
                    <UserDisplay tag="span" className="inline" user={author} />
                    <span>
                        {' '}
                        updated {field} from {fromString} to {toString}{' '}
                    </span>
                    <DateDisplay tag="span" className="inline" date={date} quick={true} />
                </div>
            ))}
        </Link>
    );
}

async function getUpdates(): Promise<UpdatesState> {
    const { $jupdates } = inject('JiraUpdatesService');
    return await $jupdates.getRescentUpdates();
}

function trackViewList(total: number): void {
    const { $analytics } = inject('AnalyticsService');
    $analytics.trackEvent('Jira Updates: List viewed', 'Updates', `Updates: Total: ${total}`);
}
