import { memo, type ReactNode } from 'react';

import { formatDuration } from './format-utils';
import type { DurationStats, GroupSummary } from './types';

interface SummaryCardsProps {
    summary: GroupSummary;
    dayLength: number;
    statusColors: Record<string, string>;
}

interface StatTileProps {
    label: string;
    value: ReactNode;
    detail?: ReactNode;
    title?: string;
}

function StatTile({ label, value, detail, title }: StatTileProps) {
    return (
        <div className="min-w-0 rounded-lg border border-(--border-primary) bg-(--bg-primary) px-3 py-2" title={title}>
            <div className="truncate text-[11px] font-medium uppercase tracking-wide text-(--text-secondary)">{label}</div>
            <div className="truncate text-lg font-semibold tabular-nums text-(--text-primary)">{value}</div>
            {detail && <div className="truncate text-[11px] text-(--text-secondary)">{detail}</div>}
        </div>
    );
}

function getDurationDetail(stats: DurationStats, dayLength: number): string {
    if (!stats.count) {
        return 'No resolved issues';
    }
    return `avg ${formatDuration(stats.avg, dayLength)} · ${stats.count} issue(s)`;
}

function SummaryCards({ summary, dayLength, statusColors }: SummaryCardsProps) {
    const { issueCount, wipCount, resolvedCount, leadTime, cycleTime, statuses } = summary;
    const bottleneck = statuses.find((s) => s.isBottleneck);

    return (
        <div className="grid shrink-0 grid-cols-2 gap-2 md:grid-cols-4">
            <StatTile label="Issues" value={issueCount} detail={`${wipCount} in progress · ${resolvedCount} resolved`} />
            <StatTile
                label="Lead time (median)"
                value={leadTime.median !== null ? formatDuration(leadTime.median, dayLength) : '—'}
                detail={getDurationDetail(leadTime, dayLength)}
                title="Time taken from the creation of an issue until it is resolved"
            />
            <StatTile
                label="Cycle time (median)"
                value={cycleTime.median !== null ? formatDuration(cycleTime.median, dayLength) : '—'}
                detail={getDurationDetail(cycleTime, dayLength)}
                title='Time taken from the first move into an "In Progress" category status until the issue is resolved'
            />
            <StatTile
                label="Bottleneck"
                title="In progress status where issues spend the most time on average"
                value={
                    bottleneck ? (
                        <span className="inline-flex max-w-full items-center gap-1.5">
                            <span
                                className="h-3 w-3 shrink-0 rounded-sm"
                                style={{ backgroundColor: statusColors[bottleneck.status.id] }}
                            />
                            <span className="truncate">{bottleneck.status.name}</span>
                        </span>
                    ) : (
                        '—'
                    )
                }
                detail={bottleneck ? `avg ${formatDuration(bottleneck.avg, dayLength)} per issue` : 'No in progress statuses'}
            />
        </div>
    );
}

export default memo(SummaryCards);
