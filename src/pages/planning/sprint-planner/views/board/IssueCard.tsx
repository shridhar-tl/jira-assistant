import { memo, type MouseEvent } from 'react';

import classNames from 'classnames';

import { getContrastText, getParentColor, statusCategoryClassNames } from '../../../shared/colors';
import UserAvatar from '../../../shared/components/UserAvatar';
import type { EstimateUnit } from '../../../shared/capacity';
import { formatEstimate } from '../../../shared/format';
import type { PlannerIssue } from '../../../shared/types';
import type { CardField } from '../../planner-settings';

export interface CardWarnings {
    unestimated: boolean;
    unassigned: boolean;
    blocked: boolean;
    dueAfterEnd: boolean;
}

interface IssueCardProps {
    issue: PlannerIssue;
    parentSummary?: string;
    parentColor?: string | null;
    estimateUnit: EstimateUnit;
    compact: boolean;
    fields: CardField[];
    warnings: CardWarnings;
    selected: boolean;
    highlighted: boolean;
    dimmed: boolean;
    saving: boolean;
    subtaskCount: number;
    onSelect: (key: string, additive: boolean) => void;
    onOpen: (key: string) => void;
    onMenu: (key: string, event: MouseEvent) => void;
}

function IssueCard({
    issue,
    parentSummary,
    parentColor,
    estimateUnit,
    compact,
    fields,
    warnings,
    selected,
    highlighted,
    dimmed,
    saving,
    subtaskCount,
    onSelect,
    onOpen,
    onMenu,
}: IssueCardProps) {
    const show = (field: CardField) => fields.includes(field);
    const estimate = formatEstimate(issue.points, issue.remainingEstimate ?? issue.originalEstimate, estimateUnit);
    const parentKey = issue.epicKey || (issue.isSubtask ? null : issue.parentKey);
    const chipColor = parentKey ? getParentColor(parentKey, parentColor) : undefined;

    const handleClick = (e: MouseEvent) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
            e.preventDefault();
            onSelect(issue.key, true);
        }
    };

    const handleMenu = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onMenu(issue.key, e);
    };

    return (
        <div
            className={classNames(
                'relative flex w-full cursor-pointer flex-col gap-1 rounded-md border border-l-4 border-(--border-primary) bg-(--bg-primary) px-2 py-1.5 text-left text-xs shadow-sm',
                statusCategoryClassNames[issue.statusCategory],
                {
                    'ring-2 ring-(--color-primary-500)': selected,
                    'ring-2 ring-amber-400': highlighted && !selected,
                    'opacity-40': dimmed,
                    'opacity-60': saving,
                },
            )}
            onClick={handleClick}
            onDoubleClick={() => onOpen(issue.key)}
            onContextMenu={handleMenu}
            data-issue-key={issue.key}
        >
            {saving && <i className="fa fa-spinner fa-spin absolute right-1.5 top-1.5 text-(--text-tertiary)" />}
            <div className="flex items-start gap-1.5">
                {issue.issueTypeIconUrl && <img src={issue.issueTypeIconUrl} alt={issue.issueType} title={issue.issueType} className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                <span className={classNames('min-w-0 flex-1 text-(--text-primary)', compact ? 'truncate' : 'line-clamp-2')} title={issue.summary}>
                    {issue.summary}
                </span>
                <button
                    type="button"
                    className="-mr-1 shrink-0 cursor-pointer rounded px-1 text-(--text-tertiary) hover:bg-(--bg-hover) hover:text-(--text-primary)"
                    onClick={handleMenu}
                    aria-label={`Actions for ${issue.key}`}
                    title="Actions"
                >
                    <i className="fa fa-ellipsis-h" />
                </button>
            </div>

            <div className="flex min-w-0 items-center gap-1.5 text-(--text-secondary)">
                <a
                    href={issue.url}
                    target="_blank"
                    rel="noreferrer"
                    className={classNames('shrink-0 cursor-pointer font-medium hover:underline', { 'line-through': issue.statusCategory === 'done' })}
                    onClick={(e) => e.stopPropagation()}
                >
                    {issue.key}
                </a>
                {show('status') && !compact && <span className="truncate text-[11px]">{issue.status}</span>}
                {subtaskCount > 0 && (
                    <span className="shrink-0 text-[11px]" title={`${subtaskCount} subtasks rolled up`}>
                        <i className="fa fa-sitemap me-0.5" />
                        {subtaskCount}
                    </span>
                )}
                <span className="flex-1" />
                {show('flags') && (
                    <span className="flex shrink-0 items-center gap-1 text-[11px]">
                        {issue.flagged && <i className="fa fa-flag text-red-500" title="Flagged" />}
                        {warnings.blocked && <i className="fa fa-ban text-red-500" title="Blocked by an open dependency" />}
                        {warnings.dueAfterEnd && <i className="fa fa-calendar-times-o text-amber-500" title="Due date is after the sprint end" />}
                        {warnings.unestimated && <i className="fa fa-question-circle text-amber-500" title="Not estimated" />}
                        {warnings.unassigned && <i className="fa fa-user-times text-amber-500" title="Unassigned" />}
                    </span>
                )}
                {show('priority') && issue.priorityIconUrl && <img src={issue.priorityIconUrl} alt={issue.priority} title={issue.priority} className="h-3.5 w-3.5 shrink-0" />}
                {show('estimate') && estimate && (
                    <span className="shrink-0 rounded-full bg-(--bg-tertiary) px-1.5 text-[11px] font-semibold text-(--text-primary)" title="Estimate">
                        {estimate}
                    </span>
                )}
                {show('assignee') &&
                    (issue.assignee ? (
                        <UserAvatar name={issue.assignee.displayName} avatarUrl={issue.assignee.avatarUrl} size="xs" />
                    ) : (
                        <span className="h-4 w-4 shrink-0 rounded-full border border-dashed border-(--border-primary)" title="Unassigned" />
                    ))}
            </div>

            {!compact && (show('epic') || show('labels')) && (
                <div className="flex min-w-0 flex-wrap items-center gap-1">
                    {show('epic') && parentKey && chipColor && (
                        <span
                            className="max-w-full truncate rounded px-1.5 text-[10px] font-medium"
                            style={{ backgroundColor: chipColor, color: getContrastText(chipColor) }}
                            title={`${parentKey} ${parentSummary || ''}`}
                        >
                            {parentSummary || parentKey}
                        </span>
                    )}
                    {show('labels') &&
                        issue.labels.slice(0, 3).map((label) => (
                            <span key={label} className="rounded bg-(--bg-tertiary) px-1.5 text-[10px] text-(--text-secondary)">
                                {label}
                            </span>
                        ))}
                </div>
            )}
        </div>
    );
}

export default memo(IssueCard);
