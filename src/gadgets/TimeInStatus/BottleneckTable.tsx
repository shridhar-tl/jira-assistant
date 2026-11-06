import { memo, useCallback, useState, type MouseEvent, type ReactNode } from 'react';

import classNames from 'classnames';

import { statusCategoryLabels } from './constants';
import { formatDuration } from './format-utils';
import IssueKeyLink from './IssueKeyLink';
import type { GroupSummary, StatusStats, TimeInStatusModel } from './types';

export interface OpenStatusIssues {
    (target: HTMLElement, stats: StatusStats, groupName: string | null): void;
}

interface BottleneckTableProps {
    model: TimeInStatusModel;
    onOpenIssues: OpenStatusIssues;
}

interface StatusRowProps {
    stats: StatusStats;
    maxAvg: number;
    color: string;
    dayLength: number;
    groupName: string | null;
    onOpenIssues: OpenStatusIssues;
}

const headClass = 'sticky top-0 z-2 border-b border-(--border-primary) bg-(--bg-secondary) px-2 py-1.5 font-semibold text-(--text-primary)';
const cellClass = 'border-b border-(--border-primary) px-2 py-1.5 tabular-nums';

const StatusRow = memo(function StatusRow({ stats, maxAvg, color, dayLength, groupName, onOpenIssues }: StatusRowProps) {
    const { status, currentCount, visitedCount, avg, median, max, total, issues, isBottleneck } = stats;
    const longest = issues[0]?.metrics.issue;
    const barWidth = maxAvg > 0 ? Math.max(2, (avg * 100) / maxAvg) : 0;

    const openIssues = (e: MouseEvent<HTMLElement>) => onOpenIssues(e.currentTarget, stats, groupName);

    return (
        <tr
            className={classNames('cursor-pointer hover:bg-(--bg-hover)', { 'bg-amber-50/60 dark:bg-amber-900/15': isBottleneck })}
            onClick={openIssues}
            title="Click to see the issues"
        >
            <td className={classNames(cellClass, 'min-w-40')} data-export-data={isBottleneck ? `${status.name} (bottleneck)` : status.name}>
                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="truncate font-medium text-(--text-primary)">{status.name}</span>
                    {isBottleneck && (
                        <span
                            className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-100 px-1.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                        >
                            <i className="fa fa-exclamation-triangle" /> Bottleneck
                        </span>
                    )}
                </div>
            </td>
            <td className={classNames(cellClass, 'text-(--text-secondary)')}>{statusCategoryLabels[status.category]}</td>
            <td className={classNames(cellClass, 'text-right text-(--text-primary)')}>{currentCount || ''}</td>
            <td className={classNames(cellClass, 'text-right text-(--text-primary)')}>{visitedCount}</td>
            <td className={classNames(cellClass, 'min-w-36')}>
                <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-right font-semibold text-(--text-primary)">{formatDuration(avg, dayLength)}</span>
                    <span className="h-2 min-w-12 flex-1 overflow-hidden rounded-full bg-(--bg-tertiary)">
                        <span className="block h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: color }} />
                    </span>
                </div>
            </td>
            <td className={classNames(cellClass, 'text-right text-(--text-primary)')}>{formatDuration(median, dayLength)}</td>
            <td className={classNames(cellClass, 'text-right text-(--text-primary)')} data-export-data={formatDuration(max, dayLength)}>
                <div className="flex flex-col items-end">
                    <span>{formatDuration(max, dayLength)}</span>
                    {longest && max > 0 && (
                        <span className="text-[11px]" onClick={(e) => e.stopPropagation()}>
                            <IssueKeyLink issue={longest} />
                        </span>
                    )}
                </div>
            </td>
            <td className={classNames(cellClass, 'text-right text-(--text-secondary)')}>{formatDuration(total, dayLength)}</td>
        </tr>
    );
});

interface GroupHeaderRowProps {
    group: GroupSummary;
    dayLength: number;
    isCollapsed: boolean;
    onToggle: (name: string) => void;
}

function GroupHeaderRow({ group, dayLength, isCollapsed, onToggle }: GroupHeaderRowProps) {
    const parts = [`${group.issueCount} issue(s)`];
    if (group.cycleTime.median !== null) {
        parts.push(`median cycle ${formatDuration(group.cycleTime.median, dayLength)}`);
    }
    if (group.leadTime.median !== null) {
        parts.push(`median lead ${formatDuration(group.leadTime.median, dayLength)}`);
    }

    return (
        <tr className="cursor-pointer bg-(--bg-secondary) hover:bg-(--bg-hover)" onClick={() => onToggle(group.name)}>
            <td colSpan={8} className="border-b border-(--border-primary) px-2 py-1.5">
                <div className="flex flex-wrap items-center gap-x-2 text-[13px]">
                    <i className={classNames('fa w-3 text-xs text-(--text-secondary)', isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down')} />
                    <span className="font-semibold text-(--text-primary)">{group.name}</span>
                    <span className="text-xs text-(--text-secondary)">{parts.join(' · ')}</span>
                </div>
            </td>
        </tr>
    );
}

function getMaxAvg(group: GroupSummary): number {
    return group.statuses.reduce((max, s) => Math.max(max, s.avg), 0);
}

function BottleneckTable({ model, onOpenIssues }: BottleneckTableProps) {
    const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
    const { dayLength, statusColors, groups, overall } = model;
    const isGrouped = groups.length > 0;

    const toggleGroup = useCallback((name: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }
            return next;
        });
    }, []);

    const renderRows = (group: GroupSummary, groupName: string | null) => {
        const maxAvg = getMaxAvg(group);
        return group.statuses.map((stats) => (
            <StatusRow
                key={`${groupName ?? ''}_${stats.status.id}`}
                stats={stats}
                maxAvg={maxAvg}
                color={statusColors[stats.status.id]}
                dayLength={dayLength}
                groupName={groupName}
                onOpenIssues={onOpenIssues}
            />
        ));
    };

    return (
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-(--border-primary)">
            <table className="exportable w-full border-separate border-spacing-0 text-xs" data-export-sheet-name="Time in status">
                <thead>
                    <tr>
                        <th className={classNames(headClass, 'text-left')}>Status</th>
                        <th className={classNames(headClass, 'text-left')}>Category</th>
                        <th className={classNames(headClass, 'text-right')} title="Issues that are currently in this status">
                            Currently in
                        </th>
                        <th className={classNames(headClass, 'text-right')} title="Issues that spent time in this status">
                            Issues
                        </th>
                        <th className={classNames(headClass, 'text-left')}>Average time</th>
                        <th className={classNames(headClass, 'text-right')}>Median</th>
                        <th className={classNames(headClass, 'text-right')} title="Longest time spent by a single issue">
                            Max
                        </th>
                        <th className={classNames(headClass, 'text-right')}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {!isGrouped && renderRows(overall, null)}
                    {isGrouped &&
                        groups.map((group) => (
                            <GroupRows
                                key={group.name}
                                group={group}
                                dayLength={dayLength}
                                isCollapsed={collapsed.has(group.name)}
                                onToggle={toggleGroup}
                            >
                                {renderRows(group, group.name)}
                            </GroupRows>
                        ))}
                </tbody>
            </table>
        </div>
    );
}

interface GroupRowsProps extends GroupHeaderRowProps {
    children: ReactNode;
}

function GroupRows({ group, dayLength, isCollapsed, onToggle, children }: GroupRowsProps) {
    return (
        <>
            <GroupHeaderRow group={group} dayLength={dayLength} isCollapsed={isCollapsed} onToggle={onToggle} />
            {!isCollapsed && children}
        </>
    );
}

export default memo(BottleneckTable);
