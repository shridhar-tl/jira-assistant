import { useCallback, useMemo } from 'react';

import classNames from 'classnames';

import { Checkbox, EditableGrid, type GridColumn } from '@components';

import type { ImportCell, ImportColumn, ImportRow } from '../types';
import { canImportRow, rowHasError } from '../validator';

import CellEditor from './CellEditor';
import CellView from './CellView';
import ColumnHeader from './ColumnHeader';
import RowStatusCell from './RowStatusCell';

interface ImportGridProps {
    columns: ImportColumn[];
    rows: ImportRow[];
    readOnly: boolean;
    removableFields: Set<string>;
    getTicketUrl: (key: string) => string | undefined;
    onChange: (rows: ImportRow[], columns: ImportColumn[]) => void;
    onToggleSelection: (row: ImportRow) => void;
    onSelectAll: (selected: boolean) => void;
    onToggleClone: (row: ImportRow) => void;
    onToggleDelete: (row: ImportRow) => void;
    onRemoveColumn: (field: string) => void;
}

interface CellModProps {
    className?: string;
}

const gridHeight = 'calc(100vh - 340px)';

function getCellValue(row: ImportRow, field: string): ImportCell | undefined {
    return row.cells[field];
}

function setCellValue(row: ImportRow, field: string, value: ImportCell | undefined): ImportRow {
    const cells = { ...row.cells };
    if (value && (value.input || value.clear)) {
        cells[field] = value;
    } else {
        delete cells[field];
    }
    return { ...row, cells, revision: row.revision + 1 };
}

function isSameInput(cell: ImportCell | undefined, next: ImportCell | undefined): boolean {
    return (cell?.input || '') === (next?.input || '') && !!cell?.clear === !!next?.clear;
}

function canEditRow(row: ImportRow): boolean {
    return row.status.state === 'ready' || row.status.state === 'failed';
}

function getRowHeaderClassName(row: ImportRow): string {
    if (row.status.state === 'imported') {
        return 'text-emerald-600';
    }
    return rowHasError(row) ? 'text-red-500' : '';
}

function getFieldCellClass(row: ImportRow, column: ImportColumn): string {
    if (column.invalid) {
        return 'bg-(--bg-tertiary) text-(--text-tertiary)';
    }
    const cell = row.cells[column.field];
    if (cell?.error) {
        return 'bg-red-50 dark:bg-red-950/40';
    }
    if (row.status.state === 'imported') {
        return 'text-(--text-secondary)';
    }
    if (cell && !cell.unchanged && (cell.payload !== undefined || cell.clear)) {
        return 'bg-blue-50 dark:bg-blue-950/30';
    }
    return '';
}

function ImportGrid({
    columns,
    rows,
    readOnly,
    removableFields,
    getTicketUrl,
    onChange,
    onToggleSelection,
    onSelectAll,
    onToggleClone,
    onToggleDelete,
    onRemoveColumn,
}: ImportGridProps) {
    const importableRows = rows.filter(canImportRow);
    const allSelected = importableRows.length > 0 && importableRows.every((r) => r.selected);
    const someSelected = importableRows.some((r) => r.selected);

    const renderActionCell = useCallback(
        (row: ImportRow, checked: boolean, onToggle: (row: ImportRow) => void) => {
            const key = row.cells.issuekey;
            if (!key?.input || !canEditRow(row)) {
                return null;
            }
            return (
                <span className="flex justify-center">
                    <Checkbox checked={checked} disabled={readOnly || !!key.error} onChange={() => onToggle(row)} />
                </span>
            );
        },
        [readOnly],
    );

    const gridColumns = useMemo<GridColumn[]>(
        () =>
            columns.map((column) => {
                const base: GridColumn = { ...column };

                switch (column.role) {
                    case 'selector':
                        return {
                            ...base,
                            headerTemplate: () => (
                                <span className="flex justify-center">
                                    <Checkbox
                                        checked={allSelected}
                                        indeterminate={!allSelected && someSelected}
                                        disabled={readOnly || !importableRows.length}
                                        onChange={() => onSelectAll(!allSelected)}
                                    />
                                </span>
                            ),
                            cellTemplate: (_c, row: ImportRow) => (
                                <span className="flex justify-center">
                                    <Checkbox
                                        checked={row.selected}
                                        disabled={readOnly || !canImportRow(row)}
                                        onChange={() => onToggleSelection(row)}
                                    />
                                </span>
                            ),
                        };
                    case 'rowStatus':
                        return { ...base, cellTemplate: (_c, row: ImportRow) => <RowStatusCell row={row} getTicketUrl={getTicketUrl} /> };
                    case 'clone':
                        return {
                            ...base,
                            headerTemplate: () => <ColumnHeader column={column} />,
                            cellTemplate: (_c, row: ImportRow) => renderActionCell(row, row.clone, onToggleClone),
                        };
                    case 'delete':
                        return {
                            ...base,
                            headerTemplate: () => <ColumnHeader column={column} />,
                            cellTemplate: (_c, row: ImportRow) => renderActionCell(row, row.delete, onToggleDelete),
                        };
                    default:
                        return {
                            ...base,
                            headerTemplate: () => (
                                <ColumnHeader
                                    column={column}
                                    onRemove={
                                        !readOnly && removableFields.has(column.field) ? () => onRemoveColumn(column.field) : undefined
                                    }
                                />
                            ),
                            cellTemplate: (_c, row: ImportRow, _i, _ri, modProps?: CellModProps) => {
                                if (modProps) {
                                    modProps.className = classNames(modProps.className, getFieldCellClass(row, column));
                                }
                                return (
                                    <CellView
                                        cell={row.cells[column.field]}
                                        existing={row.existingDisplay[column.field]}
                                        getTicketUrl={getTicketUrl}
                                    />
                                );
                            },
                            cellEditorTemplate: (row: ImportRow, _c, _ri, _i, setNewValue, cancelEdit) => (
                                <CellEditor
                                    column={column}
                                    row={row}
                                    disabled={readOnly || !canEditRow(row)}
                                    onCancel={cancelEdit}
                                    onCommit={(cell) => (isSameInput(row.cells[column.field], cell) ? cancelEdit() : setNewValue(cell))}
                                />
                            ),
                        };
                }
            }),
        [
            columns,
            allSelected,
            someSelected,
            readOnly,
            importableRows.length,
            removableFields,
            getTicketUrl,
            renderActionCell,
            onSelectAll,
            onToggleSelection,
            onToggleClone,
            onToggleDelete,
            onRemoveColumn,
        ],
    );

    const handleChange = useCallback(
        (newRows: ImportRow[], newColumns: GridColumn[]) => {
            const updatedColumns =
                newColumns === gridColumns
                    ? columns
                    : columns.map((c, i) => (newColumns[i].width !== c.width ? { ...c, width: newColumns[i].width } : c));
            onChange(newRows, updatedColumns);
        },
        [gridColumns, columns, onChange],
    );

    return (
        <EditableGrid
            columns={gridColumns}
            rows={rows}
            height={gridHeight}
            className="rounded-lg border border-(--border-primary) bg-(--bg-primary)"
            getRowHeaderClassName={getRowHeaderClassName}
            getCellValue={getCellValue}
            setCellValue={setCellValue}
            onChange={readOnly ? undefined : handleChange}
        />
    );
}

export default ImportGrid;
