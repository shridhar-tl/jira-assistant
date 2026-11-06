import { formatDuration } from './format-utils';
import IssueKeyLink from './IssueKeyLink';
import type { StatusStats } from './types';

interface StatusIssueListProps {
    stats: StatusStats;
    dayLength: number;
}

export default function StatusIssueList({ stats, dayLength }: StatusIssueListProps) {
    const currentIssues = stats.issues.filter(({ metrics }) => metrics.issue.status.id === stats.status.id);

    return (
        <div className="flex flex-col gap-2">
            <p className="m-0 text-xs text-(--text-secondary)">
                {stats.visitedCount} issue(s) spent time in this status. {currentIssues.length} of them are currently in it.
            </p>
            <ul className="-mx-2 flex flex-col">
                {stats.issues.map(({ metrics, duration }) => {
                    const { issue } = metrics;
                    const isCurrent = issue.status.id === stats.status.id;
                    return (
                        <li key={issue.key} className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-(--bg-hover)">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <IssueKeyLink issue={issue} />
                                    {isCurrent && (
                                        <span className="rounded bg-(--bg-tertiary) px-1.5 text-[10px] font-medium text-(--text-secondary)">
                                            Currently here
                                        </span>
                                    )}
                                    {metrics.isPartialHistory && (
                                        <span className="rounded bg-amber-100 px-1.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                            Partial history
                                        </span>
                                    )}
                                </div>
                                <div className="truncate text-xs text-(--text-primary)" title={issue.summary}>
                                    {issue.summary}
                                </div>
                                {issue.assignee && <div className="text-[11px] text-(--text-secondary)">{issue.assignee.displayName}</div>}
                            </div>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-(--text-primary)">
                                {formatDuration(duration, dayLength)}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
