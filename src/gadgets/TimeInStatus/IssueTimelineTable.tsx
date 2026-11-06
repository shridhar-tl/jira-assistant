import { useCallback, useMemo, useState, type ReactNode } from 'react';

import classNames from 'classnames';

import { Multiselect, SelectButton, TextInput } from '@components';
import { Column, ScrollableTable, TBody, THead, TRow } from '@components/shared';

import { DateDisplay, TicketDisplay, TimeSpentDisplay } from '../../display-controls';

import { optionalIssueColumns, timelineScaleOptions } from './constants';
import { formatDuration } from './format-utils';
import StatusTimelineBar from './StatusTimelineBar';
import type { IssueStatusMetrics, IssueUser, TimeInStatusModel, TimeInStatusSettings, TimelineScale } from './types';

interface IssueTimelineTableProps {
    model: TimeInStatusModel;
    settings: TimeInStatusSettings;
    onSettingsChange: (changes: Partial<TimeInStatusSettings>) => void;
    onAddWorklog?: (ticketKey: string) => void;
}

type SortValue = string | number | null;

type EstimateField = 'originalEstimate' | 'aggregateOriginalEstimate' | 'timeEstimate' | 'aggregateTimeEstimate';

interface IssueColumn {
    id: string;
    label: string;
    sortValue: (m: IssueStatusMetrics) => SortValue;
    render: (m: IssueStatusMetrics) => ReactNode;
    exportValue?: (m: IssueStatusMetrics) => string;
    className?: string;
    optionalId: string;
}

const statusColumnPrefix = 'status_';
const columnOptions = optionalIssueColumns.map(({ id, label }) => ({ value: id, label }));
const headClass = 'px-2 py-1.5 text-left text-xs font-semibold text-(--text-primary) border-b border-(--border-primary) bg-(--bg-secondary)';

function UserCell({ user }: { user: IssueUser | null }) {
    if (!user) {
        return <span className="text-(--text-tertiary)">Unassigned</span>;
    }
    return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            {user.avatarUrl && <img src={user.avatarUrl} alt="" className="h-5 w-5 rounded-full" />}
            {user.displayName}
        </span>
    );
}

function compareValues(a: SortValue, b: SortValue, isDesc: boolean): number {
    if (a === b) {
        return 0;
    }
    if (a === null) {
        return 1;
    }
    if (b === null) {
        return -1;
    }
    const result = typeof a === 'string' && typeof b === 'string' ? a.localeCompare(b) : a < b ? -1 : 1;
    return isDesc ? -result : result;
}

function matchesSearch(m: IssueStatusMetrics, text: string): boolean {
    const { issue } = m;
    return (
        issue.key.toLowerCase().includes(text) ||
        issue.summary.toLowerCase().includes(text) ||
        !!issue.assignee?.displayName.toLowerCase().includes(text)
    );
}

export default function IssueTimelineTable({ model, settings, onSettingsChange, onAddWorklog }: IssueTimelineTableProps) {
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const { dayLength, statusColors, statuses, issues, timelineStart, timelineEnd } = model;
    const { displayColumns, sortField, isDesc, timelineScale } = settings;

    const columns = useMemo<IssueColumn[]>(() => {
        const durationColumn = (id: string, label: string, getValue: (m: IssueStatusMetrics) => number | null): IssueColumn => ({
            id,
            label,
            optionalId: id,
            className: 'text-right tabular-nums whitespace-nowrap',
            sortValue: getValue,
            render: (m) => formatDuration(getValue(m), dayLength),
        });

        const estimateColumn = (id: EstimateField, label: string): IssueColumn => ({
            id,
            label,
            optionalId: id,
            className: 'whitespace-nowrap',
            sortValue: (m) => m.issue[id] ?? null,
            render: (m) => <TimeSpentDisplay value={m.issue[id]} />,
        });

        const all: IssueColumn[] = [
            {
                id: 'project',
                label: 'Project',
                optionalId: 'project',
                className: 'whitespace-nowrap',
                sortValue: (m) => m.issue.projectKey,
                render: (m) => <span title={m.issue.projectName}>{m.issue.projectKey}</span>,
            },
            {
                id: 'issuetype',
                label: 'Issue type',
                optionalId: 'issuetype',
                className: 'whitespace-nowrap',
                sortValue: (m) => m.issue.issueType.name,
                render: (m) => m.issue.issueType.name,
            },
            {
                id: 'status',
                label: 'Status',
                optionalId: 'status',
                className: 'whitespace-nowrap',
                sortValue: (m) => m.issue.status.name,
                render: (m) => (
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: statusColors[m.issue.status.id] }} />
                        {m.issue.status.name}
                    </span>
                ),
                exportValue: (m) => m.issue.status.name,
            },
            {
                id: 'assignee',
                label: 'Assignee',
                optionalId: 'assignee',
                sortValue: (m) => m.issue.assignee?.displayName ?? null,
                render: (m) => <UserCell user={m.issue.assignee} />,
                exportValue: (m) => m.issue.assignee?.displayName || '',
            },
            {
                id: 'reporter',
                label: 'Reporter',
                optionalId: 'reporter',
                sortValue: (m) => m.issue.reporter?.displayName ?? null,
                render: (m) => <UserCell user={m.issue.reporter} />,
                exportValue: (m) => m.issue.reporter?.displayName || '',
            },
            {
                id: 'created',
                label: 'Created',
                optionalId: 'created',
                className: 'whitespace-nowrap',
                sortValue: (m) => m.issue.created,
                render: (m) => <DateDisplay value={new Date(m.issue.created)} />,
            },
            {
                id: 'parent',
                label: 'Parent',
                optionalId: 'parent',
                sortValue: (m) => m.issue.parentKey ?? null,
                render: (m) => (m.issue.parentKey ? <TicketDisplay value={m.issue.parentKey} onAddWorklog={onAddWorklog} /> : null),
                exportValue: (m) => m.issue.parentKey || '',
            },
            {
                id: 'epic',
                label: 'Epic',
                optionalId: 'epic',
                sortValue: (m) => m.issue.epicKey ?? null,
                render: (m) => (m.issue.epicKey ? <TicketDisplay value={m.issue.epicKey} hideWorklog /> : null),
                exportValue: (m) => m.issue.epicKey || '',
            },
            {
                id: 'storyPoints',
                label: 'Story points',
                optionalId: 'storyPoints',
                className: 'text-right tabular-nums',
                sortValue: (m) => m.issue.storyPoints ?? null,
                render: (m) => m.issue.storyPoints ?? '',
            },
            estimateColumn('originalEstimate', 'Original estimate'),
            estimateColumn('aggregateOriginalEstimate', 'Σ Original estimate'),
            estimateColumn('timeEstimate', 'Remaining estimate'),
            estimateColumn('aggregateTimeEstimate', 'Σ Remaining estimate'),
            durationColumn('leadTime', 'Lead time', (m) => m.leadTime),
            durationColumn('cycleTime', 'Cycle time', (m) => m.cycleTime ?? m.wipAge),
            durationColumn('currentStatusAge', 'In current status', (m) => (m.currentStatusAge > 0 ? m.currentStatusAge : null)),
            {
                id: 'timeline',
                label: 'Status timeline',
                optionalId: 'timeline',
                className: 'min-w-56 w-[30%]',
                sortValue: (m) => m.segments.length,
                render: (m) => (
                    <StatusTimelineBar
                        metrics={m}
                        statusColors={statusColors}
                        dayLength={dayLength}
                        scale={timelineScale}
                        timelineStart={timelineStart}
                        timelineEnd={timelineEnd}
                    />
                ),
            },
            ...statuses.map<IssueColumn>((status) => ({
                id: `${statusColumnPrefix}${status.id}`,
                label: status.name,
                optionalId: 'statusColumns',
                className: 'text-right tabular-nums whitespace-nowrap',
                sortValue: (m) => m.timeInStatus[status.id] ?? null,
                render: (m) => formatDuration(m.timeInStatus[status.id], dayLength),
            })),
        ];

        const visible = new Set(displayColumns);
        return all.filter((c) => visible.has(c.optionalId));
    }, [displayColumns, statuses, statusColors, dayLength, timelineScale, timelineStart, timelineEnd, onAddWorklog]);

    const currentStatusOptions = useMemo(() => {
        const present = new Set(issues.map((m) => m.issue.status.id));
        return statuses.filter((s) => present.has(s.id)).map((s) => ({ value: s.id, label: s.name }));
    }, [issues, statuses]);

    const rows = useMemo(() => {
        const text = searchText.trim().toLowerCase();
        const statusSet = new Set(statusFilter);
        const filtered = issues.filter((m) => (!text || matchesSearch(m, text)) && (!statusSet.size || statusSet.has(m.issue.status.id)));

        const sortColumn =
            sortField === 'key'
                ? { sortValue: (m: IssueStatusMetrics) => m.issue.key }
                : sortField === 'summary'
                  ? { sortValue: (m: IssueStatusMetrics) => m.issue.summary }
                  : columns.find((c) => c.id === sortField);

        if (!sortColumn) {
            return filtered;
        }
        return [...filtered].sort((a, b) => compareValues(sortColumn.sortValue(a), sortColumn.sortValue(b), isDesc));
    }, [issues, searchText, statusFilter, sortField, isDesc, columns]);

    const handleSort = useCallback(
        (field: string, newIsDesc: boolean) => {
            onSettingsChange({ sortField: field, isDesc: newIsDesc });
            return true;
        },
        [onSettingsChange],
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex shrink-0 flex-wrap items-center gap-2">
                <TextInput
                    value={searchText}
                    onChange={(e) => setSearchText(e.value ?? '')}
                    placeholder="Search issues"
                    leftIcon={<i className="fa fa-search" />}
                    clearable
                    className="w-full sm:w-56"
                />
                <Multiselect
                    options={currentStatusOptions}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter((e.value as string[]) || [])}
                    placeholder="All current statuses"
                    searchable
                    className="w-full sm:w-56"
                    ariaLabel="Filter by current status"
                />
                <Multiselect
                    options={columnOptions}
                    value={displayColumns}
                    onChange={(e) => onSettingsChange({ displayColumns: (e.value as string[]) || [] })}
                    placeholder="Choose columns"
                    className="w-full sm:w-56"
                    ariaLabel="Columns to display"
                />
                {displayColumns.includes('timeline') && (
                    <SelectButton
                        items={timelineScaleOptions}
                        value={timelineScale}
                        onChange={(e) => onSettingsChange({ timelineScale: e.value as TimelineScale })}
                        variant="segmented"
                        size="sm"
                    />
                )}
                <span className="ms-auto text-xs text-(--text-secondary)">
                    {rows.length === issues.length ? `${issues.length} issue(s)` : `${rows.length} of ${issues.length} issue(s)`}
                </span>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-(--border-primary)">
                <ScrollableTable
                    dataset={rows}
                    sortBy={sortField}
                    isDesc={isDesc}
                    onSort={handleSort}
                    exportable
                    exportSheetName="Time in status - issues"
                    className="w-full text-xs"
                    containerStyle={{ height: '100%' }}
                >
                    <THead>
                        <TRow>
                            <Column sortBy="key" className={headClass}>
                                Issue
                            </Column>
                            <Column sortBy="summary" className={classNames(headClass, 'min-w-48')}>
                                Summary
                            </Column>
                            {columns.map((column) => (
                                <Column key={column.id} sortBy={column.id} className={headClass}>
                                    {column.label}
                                </Column>
                            ))}
                        </TRow>
                    </THead>
                    <TBody>
                        {rows.map((m) => (
                            <TRow key={m.issue.key} className="border-b border-(--border-primary) hover:bg-(--bg-hover)">
                                <td className="px-2 py-1.5 whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                        <TicketDisplay value={m.issue.key} url={m.issue.url} onAddWorklog={onAddWorklog} />
                                        {m.isPartialHistory && (
                                            <i
                                                className="fa fa-exclamation-triangle text-amber-500"
                                                title="Complete history could not be fetched for this issue"
                                            />
                                        )}
                                    </div>
                                </td>
                                <td className="max-w-80 truncate px-2 py-1.5 text-(--text-primary)" title={m.issue.summary}>
                                    {m.issue.summary}
                                </td>
                                {columns.map((column) => (
                                    <td
                                        key={column.id}
                                        className={classNames('px-2 py-1.5 text-(--text-primary)', column.className)}
                                        data-export-data={column.exportValue?.(m)}
                                    >
                                        {column.render(m)}
                                    </td>
                                ))}
                            </TRow>
                        ))}
                    </TBody>
                </ScrollableTable>
            </div>
        </div>
    );
}
