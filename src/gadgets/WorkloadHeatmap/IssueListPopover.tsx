import { formatHours, formatShortDate } from './format-utils';
import IssueLink from './IssueLink';
import type { HeatmapIssue } from './types';

interface IssueListPopoverProps {
    hint: string;
    issues: HeatmapIssue[];
}

function getIssueDetail(issue: HeatmapIssue): string {
    const estimate = issue.remainingEstimate ?? issue.originalEstimate;
    const parts: string[] = [];
    if (estimate !== null) {
        parts.push(`${formatHours(estimate)} remaining`);
    }
    if (issue.dueDate) {
        parts.push(`due ${formatShortDate(issue.dueDate)}`);
    }
    return parts.join(' · ');
}

export default function IssueListPopover({ hint, issues }: IssueListPopoverProps) {
    return (
        <div className="flex flex-col gap-3">
            <p className="m-0 text-xs text-(--text-secondary)">{hint}</p>
            <ul className="-mx-2 flex flex-col">
                {issues.map((issue) => {
                    const detail = getIssueDetail(issue);
                    return (
                        <li key={issue.key} className="min-w-0 rounded-md px-2 py-1.5 hover:bg-(--bg-hover)">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <IssueLink issue={issue} />
                                <span className="rounded bg-(--bg-tertiary) px-1.5 text-[10px] font-medium text-(--text-secondary)">
                                    {issue.status}
                                </span>
                            </div>
                            <div className="truncate text-xs text-(--text-primary)" title={issue.summary}>
                                {issue.summary}
                            </div>
                            {detail && <div className="text-[11px] text-(--text-secondary)">{detail}</div>}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
