import { useMemo, useState } from 'react';

import { Column, ScrollableTable, TBody, THead, TRow } from '@components/shared';

import {
    DateDisplay,
    IssueDisplay,
    ItemDisplay,
    ProjectDisplay,
    TicketDisplay,
    TimeSpentDisplay,
    UserDisplay,
} from '../../display-controls';

import type { ColumnDefinition, GridSettings, StatusInfo, StatusWiseTicket } from './types';

interface StatusWiseTimeSpentTableProps {
    data: StatusWiseTicket[];
    statusList: StatusInfo[];
    settings?: GridSettings;
    onSettingsChanged?: (settings: GridSettings) => void;
    onAddWorklog?: (ticketKey: string) => void;
}

export function StatusWiseTimeSpentTable({ data, statusList, settings, onSettingsChanged, onAddWorklog }: StatusWiseTimeSpentTableProps) {
    const [sortField, setSortField] = useState<string | null>(settings?.sortField || null);
    const [isDesc, setIsDesc] = useState(settings?.isDesc || false);

    const columns = useMemo<ColumnDefinition[]>(() => {
        const baseColumns: ColumnDefinition[] = [
            {
                field: 'key',
                displayText: 'Ticket No',
                type: 'string',
                viewComponent: TicketDisplay,
                props: { onAddWorklog },
                sortable: true,
                width: '120px',
            },
            {
                field: 'summary',
                displayText: 'Summary',
                type: 'string',
                sortable: true,
                width: '300px',
            },
            {
                field: 'project',
                fieldKey: 'project.key',
                displayText: 'Project',
                type: 'string',
                viewComponent: ProjectDisplay,
                sortable: true,
                width: '120px',
            },
            {
                field: 'issuetype',
                fieldKey: 'issuetype.name',
                displayText: 'Issue Type',
                type: 'string',
                viewComponent: ItemDisplay,
                sortable: true,
                width: '130px',
            },
            {
                field: 'epic',
                displayText: 'Epic',
                type: 'string',
                viewComponent: TicketDisplay,
                props: { hideWorklog: true },
                sortable: true,
                width: '120px',
            },
            {
                field: 'storyPoint',
                displayText: 'Story Points',
                type: 'number',
                sortable: true,
                width: '110px',
            },
            {
                field: 'timeestimate',
                displayText: 'Time Estimate',
                type: 'number',
                viewComponent: TimeSpentDisplay,
                sortable: true,
                width: '130px',
            },
            {
                field: 'aggregatetimeestimate',
                displayText: 'Σ Time Estimate',
                type: 'number',
                viewComponent: TimeSpentDisplay,
                sortable: true,
                width: '140px',
            },
            {
                field: 'timeoriginalestimate',
                displayText: 'Original Estimate',
                type: 'number',
                viewComponent: TimeSpentDisplay,
                sortable: true,
                width: '150px',
            },
            {
                field: 'aggregatetimeoriginalestimate',
                displayText: 'Σ Original Estimate',
                type: 'number',
                viewComponent: TimeSpentDisplay,
                sortable: true,
                width: '160px',
            },
            {
                field: 'parent',
                fieldKey: 'parent.key',
                displayText: 'Parent',
                type: 'string',
                viewComponent: IssueDisplay,
                props: { onAddWorklog },
                sortable: true,
                width: '120px',
            },
            {
                field: 'status',
                fieldKey: 'status.name',
                displayText: 'Status',
                type: 'string',
                viewComponent: ItemDisplay,
                sortable: true,
                width: '120px',
            },
            {
                field: 'created',
                displayText: 'Created',
                type: 'datetime',
                viewComponent: DateDisplay,
                sortable: true,
                width: '140px',
            },
            {
                field: 'assignee',
                fieldKey: 'assignee.displayName',
                displayText: 'Assignee',
                type: 'string',
                viewComponent: UserDisplay,
                sortable: true,
                width: '140px',
            },
            {
                field: 'reporter',
                fieldKey: 'reporter.displayName',
                displayText: 'Reporter',
                type: 'string',
                viewComponent: UserDisplay,
                sortable: true,
                width: '140px',
            },
        ];

        // Add status columns
        const statusColumns: ColumnDefinition[] = statusList.map((status) => ({
            field: `statusData.${status.name}`,
            displayText: `Spent on ${status.name}`,
            type: 'number' as const,
            viewComponent: TimeSpentDisplay,
            props: { inputType: 'ticks', days: true },
            sortable: true,
            width: '150px',
        }));

        return [...baseColumns, ...statusColumns];
    }, [statusList, onAddWorklog]);

    const sortedData = useMemo(() => {
        if (!sortField || !data) return data;

        return [...data].sort((a, b) => {
            const getNestedValue = (obj: any, path: string) => {
                return path.split('.').reduce((curr, key) => curr?.[key], obj);
            };

            let aVal = getNestedValue(a, sortField);
            let bVal = getNestedValue(b, sortField);

            // Handle null/undefined
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return isDesc ? -1 : 1;
            if (bVal == null) return isDesc ? 1 : -1;

            // Compare
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return isDesc ? 1 : -1;
            if (aVal > bVal) return isDesc ? -1 : 1;
            return 0;
        });
    }, [data, sortField, isDesc]);

    const handleSort = (field: string, newIsDesc: boolean) => {
        setSortField(field);
        setIsDesc(newIsDesc);

        if (onSettingsChanged) {
            onSettingsChanged({
                ...settings,
                sortField: field,
                isDesc: newIsDesc,
            });
        }

        return true; // Indicate we handled sorting
    };

    const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((curr, key) => curr?.[key], obj);
    };

    const renderCell = (row: StatusWiseTicket, column: ColumnDefinition) => {
        const value = getNestedValue(row, column.field);

        if (column.viewComponent) {
            const Component = column.viewComponent;
            return <Component value={value} {...(column.props || {})} />;
        }

        if (value == null || value === '') {
            return <span className="text-[var(--text-tertiary)]">—</span>;
        }

        if (column.type === 'number') {
            return <span>{typeof value === 'number' ? value.toLocaleString() : value}</span>;
        }

        return <span>{String(value)}</span>;
    };

    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">No ticket details available</div>;
    }

    return (
        <div className="statuswise-ts-table h-full">
            <ScrollableTable
                dataset={sortedData}
                sortBy={sortField}
                isDesc={isDesc}
                onSort={handleSort}
                exportable={true}
                exportSheetName="Status wise time spent"
            >
                <THead>
                    <TRow>
                        {columns.map((column) => (
                            <Column
                                key={column.field}
                                sortBy={column.sortable !== false ? column.field : undefined}
                                style={{ width: column.width }}
                                className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] bg-[var(--bg-secondary)]"
                            >
                                {column.displayText}
                            </Column>
                        ))}
                    </TRow>
                </THead>
                <TBody>
                    {sortedData.map((row, idx) => (
                        <TRow
                            key={row.key || idx}
                            className="hover:bg-[var(--bg-hover)] border-b border-[var(--border-color)] transition-colors"
                        >
                            {columns.map((column) => (
                                <td
                                    key={column.field}
                                    className="px-3 py-2 text-sm text-[var(--text-primary)]"
                                    style={{ width: column.width }}
                                >
                                    {renderCell(row, column)}
                                </td>
                            ))}
                        </TRow>
                    ))}
                </TBody>
            </ScrollableTable>
        </div>
    );
}
