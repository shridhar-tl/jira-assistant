import { inject } from '@services';

import { roundTimeSpentSecs } from '@utils';

import type { WorklogMergeGroup, WorklogRoundingInterval } from '@types';


import { formatSecs, getTotalSecs } from '../../services/utils-service';

interface WorklogMergeGroupCardProps {
    group: WorklogMergeGroup;
    roundingMins?: WorklogRoundingInterval;
}

export default function WorklogMergeGroupCard({ group, roundingMins }: WorklogMergeGroupCardProps) {
    const { $userutils } = inject('UserUtilsService');
    const roundedSecs = roundTimeSpentSecs(group.totalSecs, roundingMins);
    const isRounded = roundedSecs !== group.totalSecs;

    return (
        <li className="rounded-md border border-(--border-primary) bg-(--bg-secondary) overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-(--bg-tertiary)">
                <span className="font-mono text-xs font-semibold text-(--primary-color)">{group.ticketNo}</span>
                <span className="text-xs text-(--text-secondary) truncate">{$userutils.formatDate(group.dateStarted)}</span>
                <span className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full bg-(--primary-light) px-2 py-0.5 text-[11px] font-semibold text-(--primary-color)">
                    {group.worklogs.length} <i className="fa fa-long-arrow-right" /> 1
                </span>
            </div>
            <ul className="px-3 py-2 space-y-1">
                {group.worklogs.map((wl) => (
                    <li key={wl.id} className="flex items-baseline gap-2 text-xs">
                        <span className="shrink-0 w-12 tabular-nums text-(--text-tertiary)">{$userutils.formatTime(wl.dateStarted)}</span>
                        <span className="shrink-0 w-14 tabular-nums font-medium text-(--text-primary)">{formatSecs(getTotalSecs(wl))}</span>
                        <span className="min-w-0 truncate text-(--text-secondary)" title={wl.description}>
                            {wl.description || <em className="text-(--text-tertiary)">(no comment)</em>}
                        </span>
                    </li>
                ))}
            </ul>
            <div className="flex items-center gap-2 px-3 py-1.5 border-t border-dashed border-(--border-primary) text-xs">
                <i className="fa fa-check-circle text-(--color-success)" />
                <span className="text-(--text-secondary)">
                    Upload as{' '}
                    {isRounded && <span className="line-through text-(--text-tertiary) mr-1">{formatSecs(group.totalSecs)}</span>}
                    <span className="font-semibold text-(--text-primary)">{formatSecs(roundedSecs)}</span>
                    {isRounded && <span className="text-(--text-tertiary)"> (rounded)</span>} starting at{' '}
                    <span className="font-semibold text-(--text-primary)">{$userutils.formatTime(group.dateStarted)}</span>
                </span>
            </div>
        </li>
    );
}
