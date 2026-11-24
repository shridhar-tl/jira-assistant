import { useMemo, useState } from 'react';

import classNames from 'classnames';

import { Avatar, Button, Checkbox, Dropdown, SelectButton, TextInput } from '@components';

import { formatNumber } from '../../../shared/format';
import type { PlannerIssue, StatusCategory } from '../../../shared/types';
import IssueLink from '../common/IssueLink';
import StatusPill from '../common/StatusPill';

interface StoryPickListProps {
    stories: PlannerIssue[];
    excluded: Set<string>;
    onExcludedChange: (excluded: Set<string>) => void;
    sizeOf: (story: PlannerIssue) => number;
    unit: string;
    sprintName: (sprintId: number | null) => string;
}

type StatusFilter = 'all' | StatusCategory;

const allValue = '';
const unassignedValue = '__unassigned__';
const statusItems = [
    { label: 'All', value: 'all' },
    { label: 'To do', value: 'new' },
    { label: 'In progress', value: 'indeterminate' },
];

function matchesText(story: PlannerIssue, text: string): boolean {
    return !text || story.key.toLowerCase().includes(text) || story.summary.toLowerCase().includes(text) || story.labels.some((l) => l.toLowerCase().includes(text));
}

/** Stories of a feature to move, with filters by text, status, type and assignee. Filters only narrow the list; the choice is kept. */
export default function StoryPickList({ stories, excluded, onExcludedChange, sizeOf, unit, sprintName }: StoryPickListProps) {
    const [text, setText] = useState('');
    const [status, setStatus] = useState<StatusFilter>('all');
    const [type, setType] = useState(allValue);
    const [assignee, setAssignee] = useState(allValue);

    const typeOptions = useMemo(
        () => [{ label: 'All types', value: allValue }, ...[...new Set(stories.map((s) => s.issueType))].sort().map((name) => ({ label: name, value: name }))],
        [stories],
    );
    const assigneeOptions = useMemo(() => {
        const people = new Map(stories.filter((s) => s.assignee).map((s) => [s.assignee!.id, s.assignee!.displayName]));
        return [
            { label: 'Anyone', value: allValue },
            { label: 'Unassigned', value: unassignedValue },
            ...[...people.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => ({ label: name, value: id })),
        ];
    }, [stories]);

    const visible = useMemo(() => {
        const search = text.trim().toLowerCase();
        return stories.filter(
            (s) =>
                matchesText(s, search) &&
                (status === 'all' || s.statusCategory === status) &&
                (!type || s.issueType === type) &&
                (!assignee || (assignee === unassignedValue ? !s.assignee : s.assignee?.id === assignee)),
        );
    }, [stories, text, status, type, assignee]);

    const visibleSelected = visible.filter((s) => !excluded.has(s.key)).length;
    const setVisible = (include: boolean) => {
        const next = new Set(excluded);
        visible.forEach((s) => (include ? next.delete(s.key) : next.add(s.key)));
        onExcludedChange(next);
    };
    const toggle = (key: string, include: boolean) => {
        const next = new Set(excluded);
        if (include) {
            next.delete(key);
        } else {
            next.add(key);
        }
        onExcludedChange(next);
    };

    return (
        <div className="flex min-h-0 flex-col gap-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                <TextInput value={text} onChange={(e) => setText(e.value)} placeholder="Filter by key, summary or label" aria-label="Filter stories" leftIcon={<i className="fa fa-search" />} clearable />
                <SelectButton items={statusItems} value={status} onChange={(e) => setStatus(e.value as StatusFilter)} ariaLabel="Status" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Dropdown options={typeOptions} value={type} onChange={(e) => setType(e.value as string)} ariaLabel="Issue type" />
                <Dropdown options={assigneeOptions} value={assignee} onChange={(e) => setAssignee(e.value as string)} searchable={assigneeOptions.length > 8} ariaLabel="Assignee" />
            </div>
            <div className="flex items-center gap-2 text-xs text-(--text-secondary)">
                <span className="me-auto">
                    Showing {visible.length} of {stories.length} · {visibleSelected} of these selected
                </span>
                <Button size="xs" layout="plain" label="Select shown" disabled={!visible.length} onClick={() => setVisible(true)} />
                <Button size="xs" layout="plain" label="Clear shown" disabled={!visible.length} onClick={() => setVisible(false)} />
            </div>
            <ul className="flex max-h-80 min-h-0 flex-col divide-y divide-(--border-secondary) overflow-auto rounded-lg border border-(--border-primary)" aria-label="Stories">
                {visible.map((story) => {
                    const checked = !excluded.has(story.key);
                    return (
                        <li key={story.key} className={classNames('flex items-center gap-2 px-2 py-1.5 text-sm', checked ? 'bg-(--bg-primary)' : 'bg-(--bg-secondary) opacity-70')} data-story-key={story.key}>
                            <Checkbox checked={checked} onChange={(e) => toggle(story.key, e.value)} aria-label={`Move ${story.key}`} />
                            <div className="flex min-w-0 flex-1 flex-col">
                                <div className="flex min-w-0 items-center gap-2">
                                    <IssueLink issueKey={story.key} issue={story} />
                                    <span className="min-w-0 flex-1 truncate" title={story.summary}>
                                        {story.summary}
                                    </span>
                                </div>
                                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-(--text-secondary)">
                                    <StatusPill status={story.status} category={story.statusCategory} />
                                    <span className="truncate">
                                        <i className="fa fa-flag-checkered me-1" />
                                        {sprintName(story.currentSprintId)}
                                    </span>
                                    {story.priorityIconUrl && <img src={story.priorityIconUrl} alt={story.priority} title={story.priority} className="h-3.5 w-3.5" />}
                                </div>
                            </div>
                            {story.assignee ? (
                                <Avatar src={story.assignee.avatarUrl} name={story.assignee.displayName} size="xs" ariaLabel={story.assignee.displayName} />
                            ) : (
                                <span className="h-5 w-5 shrink-0 rounded-full border border-dashed border-(--border-primary)" title="Unassigned" />
                            )}
                            <span className="w-14 shrink-0 text-right text-xs font-semibold text-(--text-primary)">
                                {formatNumber(sizeOf(story))} {unit}
                            </span>
                        </li>
                    );
                })}
                {!visible.length && <li className="px-2 py-6 text-center text-xs text-(--text-tertiary)">No story matches the filters.</li>}
            </ul>
        </div>
    );
}
