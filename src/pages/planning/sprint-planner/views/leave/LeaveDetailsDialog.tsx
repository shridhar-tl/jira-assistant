import { Button, Modal } from '@components';

import { formatDateRange } from '../../../shared/format';
import { parseDateKey } from '../../../shared/segments';
import type { LeaveEntry, LeaveSourceConfig, TeamMember } from '../../../shared/types';
import { getLeaveWho, leaveSourceLabels } from './leave-display';

interface LeaveDetailsDialogProps {
    entry: LeaveEntry;
    members: TeamMember[];
    sources: LeaveSourceConfig[];
    onHide: () => void;
}

export default function LeaveDetailsDialog({ entry, members, sources, onHide }: LeaveDetailsDialogProps) {
    const source = sources.find((s) => s.id === entry.sourceId);
    const rows: { label: string; value: string }[] = [
        { label: 'Who', value: entry.memberId || entry.memberIds?.length ? getLeaveWho(entry, members) : 'Everyone (holiday)' },
        { label: 'When', value: formatDateRange(parseDateKey(entry.start), parseDateKey(entry.end)) },
        { label: 'Hours off', value: entry.hours === null ? 'Full day' : `${entry.hours} h per day` },
        { label: 'Title', value: entry.title },
        { label: 'Calendar', value: source ? `${source.name} (${leaveSourceLabels[entry.source]})` : leaveSourceLabels[entry.source] },
    ];

    return (
        <Modal isOpen onClose={onHide} title="Calendar leave" size="sm" footer={<Button label="Close" onClick={onHide} />}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {rows.map((row) => (
                    <div key={row.label} className="contents">
                        <dt className="text-(--text-secondary)">{row.label}</dt>
                        <dd className="min-w-0 break-words">{row.value}</dd>
                    </div>
                ))}
            </dl>
            <p className="mt-3 text-xs text-(--text-tertiary)">This leave is read from the calendar. Change it in the calendar, then refresh the calendars here.</p>
        </Modal>
    );
}
