import { memo, type MouseEvent } from 'react';

import { Button } from '@components';

import { unestimatedHint, unscheduledHint } from './constants';
import { useHeatmapOverlay } from './overlay-context';
import type { HeatmapIssue, UserLoadRow } from './types';

interface IssueCountBadgeProps {
    label: string;
    title: string;
    hint: string;
    issues: HeatmapIssue[];
    variant: 'warning' | 'secondary';
}

function IssueCountBadge({ label, title, hint, issues, variant }: IssueCountBadgeProps) {
    const { open, scheduleClose } = useHeatmapOverlay();
    const showIssues = (e: MouseEvent<HTMLElement>) => open(e.currentTarget, { kind: 'issues', title, hint, issues });

    return (
        <Button
            layout="outlined"
            size="xs"
            variant={variant}
            label={`+${issues.length} ${label}`}
            onMouseEnter={showIssues}
            onMouseLeave={scheduleClose}
            onClick={showIssues}
        />
    );
}

interface UserCellProps {
    row: UserLoadRow;
}

function UserCell({ row }: UserCellProps) {
    const { user, unestimated, unscheduled } = row;

    return (
        <td className="sticky left-0 z-1 min-w-36 max-w-56 border-b border-r border-(--border-primary) bg-(--bg-primary) px-2 py-1">
            <div className="flex items-center gap-2">
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-6 w-6 shrink-0 rounded-full" />
                ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--bg-tertiary) text-[10px] font-semibold">
                        {user.displayName.charAt(0).toUpperCase()}
                    </span>
                )}
                <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-(--text-primary)" title={user.displayName}>
                        {user.displayName}
                    </div>
                    {(!!unestimated.length || !!unscheduled.length) && (
                        <div className="mt-0.5 flex flex-wrap gap-1">
                            {!!unestimated.length && (
                                <IssueCountBadge
                                    label="unestimated"
                                    title={`Unestimated issues of ${user.displayName}`}
                                    hint={unestimatedHint}
                                    issues={unestimated}
                                    variant="warning"
                                />
                            )}
                            {!!unscheduled.length && (
                                <IssueCountBadge
                                    label="unscheduled"
                                    title={`Unscheduled issues of ${user.displayName}`}
                                    hint={unscheduledHint}
                                    issues={unscheduled}
                                    variant="secondary"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </td>
    );
}

export default memo(UserCell);
