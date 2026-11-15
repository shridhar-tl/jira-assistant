import type { DragEvent } from 'react';

import classNames from 'classnames';

import { Button } from '@components';

import type { PlannerIssue } from '../../../shared/types';

export const issueDragType = 'application/x-ja-issue';

interface UnscheduledListProps {
    issues: PlannerIssue[];
    title: string;
    draggable?: boolean;
    onPlan?: (key: string) => void;
}

function handleDragStart(e: DragEvent<HTMLDivElement>, key: string) {
    e.dataTransfer.setData(issueDragType, key);
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
}

export default function UnscheduledList({ issues, title, draggable, onPlan }: UnscheduledListProps) {
    if (!issues.length) {
        return null;
    }

    return (
        <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-(--border-primary)">
            <div className="shrink-0 border-b border-(--border-primary) bg-(--bg-secondary) px-2 py-1.5 text-sm font-semibold">
                {title} <span className="font-normal text-(--text-secondary)">({issues.length})</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto p-1.5">
                {issues.map((issue) => (
                    <div
                        key={issue.key}
                        className={classNames('flex items-center gap-1.5 rounded border border-(--border-primary) bg-(--bg-primary) px-1.5 py-1 text-xs', {
                            'cursor-grab': draggable,
                        })}
                        draggable={!!draggable}
                        onDragStart={(e) => handleDragStart(e, issue.key)}
                        title={issue.summary}
                    >
                        {issue.issueTypeIconUrl && <img src={issue.issueTypeIconUrl} alt="" className="h-3.5 w-3.5 shrink-0" />}
                        <span className="shrink-0 font-medium">{issue.key}</span>
                        <span className="min-w-0 flex-1 truncate">{issue.summary}</span>
                        {onPlan && <Button size="xs" layout="plain" leftIcon={<i className="fa fa-calendar-plus-o" />} ariaLabel={`Plan ${issue.key}`} onClick={() => onPlan(issue.key)} />}
                    </div>
                ))}
            </div>
        </aside>
    );
}
