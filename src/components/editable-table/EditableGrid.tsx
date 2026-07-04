import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';

import './EditableGrid.css';
import { FooterCell, GridCell, HeaderCell } from './GridCell';
import { GridData } from './GridContext';
import { EditableGridProps, GridColumn } from './types';
import { clone } from './utils';

const defaultColumnWidth = 140;

interface EditableGridState {
    startRow: number;
    startCell: number;
    endRow: number;
    endCell: number;
    isSelecting?: boolean;
    editing?: boolean;
    editingRow?: number;
    editingCell?: number;
    copied?: {
        cut: boolean;
        startRow: number;
        startCell: number;
        endRow: number;
        endCell: number;
    };
}

function EditableGrid({
    tabIndex = 1,
    columns,
    rows,
    showFooter,
    width,
    height,
    noRowMessage,
    getRowHeaderClassName,
    className,
    onChange,
    onHeaderChange,
}: EditableGridProps) {
    const [state, setState] = useState<EditableGridState>({ startRow: 0, startCell: 0, endRow: 0, endCell: 0 });
    const resizingColumnRef = useRef<number | undefined>(undefined);
    const pageXRef = useRef<number | undefined>(undefined);
    const colWidthRef = useRef<number | undefined>(undefined);
    const tableRef = useRef<HTMLTableElement | null>(null);

    const handleDocumentMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!(resizingColumnRef.current! >= 0)) {
                return;
            }

            const diffX = e.pageX - pageXRef.current!;
            const newColumns = [...columns];
            const col = { ...newColumns[resizingColumnRef.current!] };
            newColumns[resizingColumnRef.current!] = col;
            col.width = colWidthRef.current! + diffX;
            if (col.width < 15) {
                col.width = 15;
            } else if (col.width > 800) {
                col.width = 800;
            }

            if (onChange) {
                onChange(rows, newColumns);
            }
        },
        [rows, columns, onChange],
    );

    const handleDocumentMouseUp = useCallback((e: MouseEvent) => {
        resizingColumnRef.current = undefined;
        pageXRef.current = undefined;
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleDocumentMouseMove);
        document.addEventListener('mouseup', handleDocumentMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleDocumentMouseMove);
            document.removeEventListener('mouseup', handleDocumentMouseUp);
        };
    }, [handleDocumentMouseMove, handleDocumentMouseUp]);

    const repeatRowData = useCallback((rowsData: any[], columnsData: GridColumn[], start: number, end: number, cell: number) => {
        const { field } = columnsData[cell];

        for (let i = end + 1, j = start; i < rowsData.length; i++) {
            rowsData[i] = { ...rowsData[i], [field]: clone(rowsData[j++][field]) };

            if (j > end) {
                j = start;
            } // If data cloned till last selected row, start from beginning
        }
    }, []);

    const getOrderedSelection = useCallback(
        (stateOrCopied?: EditableGridState | EditableGridState['copied']) => {
            const { startRow, startCell, endRow, endCell } = stateOrCopied || state;

            const rowStart = startRow <= endRow ? startRow : endRow;
            const cellStart = startCell <= endCell ? startCell : endCell;

            const rowEnd = startRow <= endRow ? endRow : startRow;
            const cellEnd = startCell <= endCell ? endCell : startCell;

            return { rowStart, cellStart, rowEnd, cellEnd };
        },
        [state],
    );

    const contextAPI = useMemo(
        () => ({
            beginSelect: (startRow: number, startCell: number) => {
                setState((prev) => {
                    if (prev.editing) {
                        return prev;
                    }
                    return { ...prev, isSelecting: true, startRow, startCell, endRow: startRow, endCell: startCell };
                });
            },
            endSelect: (endRow: number, endCell: number) => {
                setState((prev) => {
                    if (prev.isSelecting) {
                        return { ...prev, isSelecting: false, endRow, endCell };
                    }
                    return prev;
                });
            },
            onSelecting: (endRow: number, endCell: number) => {
                setState((prev) => {
                    if (prev.isSelecting) {
                        return { ...prev, endRow, endCell };
                    }
                    return prev;
                });
            },
            beginEdit: (editingRow: number, editingCell: number) => {
                setState((prev) => ({ ...prev, editing: true, editingRow, editingCell }));
            },
            endEdit: (value: any, rowIndex: number, cellIndex: number) => {
                if (rowIndex === -1) {
                    const col = { ...columns[cellIndex], field: value };
                    delete (col as any).displayText;

                    if (onHeaderChange) {
                        onHeaderChange(col, cellIndex);
                    }
                } else if (rowIndex >= 0) {
                    const newRows = [...rows];

                    const row = { ...newRows[rowIndex] };
                    newRows[rowIndex] = row;

                    const cell = columns[cellIndex];
                    row[cell.field] = value;

                    if (onChange) {
                        onChange(newRows, columns, rowIndex, cellIndex);
                    }
                }
                setState((prev) => ({ ...prev, editing: false, editingRow: -2, editingCell: -2 }));
                tableRef.current?.focus();
            },
            repeatSelectedCells: () => {
                const { rowStart, rowEnd, cellStart, cellEnd } = getOrderedSelection();

                if (rowEnd === rows.length - 1) {
                    return;
                } // Their are no rows below current to copy data

                const newRows = [...rows];
                for (let i = cellStart; i <= cellEnd; i++) {
                    repeatRowData(newRows, columns, rowStart, rowEnd, i);
                }

                if (onChange) {
                    onChange(newRows, columns);
                }

                setState((prev) => ({ ...prev, startRow: rowStart, endRow: rows.length - 1 }));
            },
            beginResize: (index: number, e: React.MouseEvent) => {
                resizingColumnRef.current = index;
                pageXRef.current = e.pageX;
                colWidthRef.current = columns[index].width || 140;
            },
        }),
        [rows, columns, onChange, onHeaderChange, getOrderedSelection, repeatRowData],
    );

    const clearSelectedCells = useCallback(
        (rowsData: any[], columnsData: GridColumn[]) => {
            const newRows = [...rowsData];

            const { rowStart, rowEnd, cellStart, cellEnd } = getOrderedSelection();

            for (let ri = rowStart; ri <= rowEnd; ri++) {
                const row = { ...newRows[ri] };
                newRows[ri] = row;

                for (let ci = cellStart; ci <= cellEnd; ci++) {
                    const { field } = columnsData[ci];
                    delete row[field];
                }
            }

            if (onChange) {
                onChange(newRows, columnsData);
            }
        },
        [getOrderedSelection, onChange],
    );

    const initCopyCells = useCallback((cut?: boolean) => {
        setState((prev) => ({
            ...prev,
            copied: { cut: !!cut, startRow: prev.startRow, startCell: prev.startCell, endRow: prev.endRow, endCell: prev.endCell },
        }));
    }, []);

    const pasteData = useCallback(
        (rowsData: any[], columnsData: GridColumn[], copiedRows: any[][]) => {
            const { rowStart: startRow, cellStart: startCell } = getOrderedSelection();
            let endCell = startCell + copiedRows[0].length - 1;
            if (endCell >= columnsData.length) {
                endCell = columnsData.length - 1;
            }

            const pasteCols = columnsData.slice(startCell, endCell + 1).map((c) => c.field);
            let endRow = startRow;

            for (let i = 0; i < copiedRows.length; i++, endRow++) {
                const row = { ...rowsData[endRow] };
                rowsData[endRow] = row;
                const copiedRow = copiedRows[i];
                for (let j = 0; j < copiedRow.length; j++) {
                    const field = pasteCols[j];
                    const value = copiedRow[j];
                    row[field] = value;
                }
            }

            if (onChange) {
                onChange(rowsData, columnsData);
            }

            setState((prev) => {
                const newState: Partial<EditableGridState> = { ...prev, startRow, startCell, endRow, endCell };
                if (prev.copied?.cut) {
                    newState.copied = undefined;
                }
                return newState as EditableGridState;
            });
        },
        [getOrderedSelection, onChange],
    );

    const beginPaste = useCallback(() => {
        if (!state.copied) {
            return;
        }

        const newRows = [...rows];

        const { rowStart, cellStart, rowEnd, cellEnd } = getOrderedSelection(state.copied);

        // If any of the selected cell is non editable, then paste operation is not allowed
        for (let i = cellStart; i <= cellEnd; i++) {
            const { editable, headerEditable, cellEditable, footerEditable } = columns[i];
            if (!editable) {
                return;
            }
            if (!headerEditable && cellStart === -1) {
                return;
            }
            if (!footerEditable && (cellStart === rows.length || cellEnd === rows.length)) {
                return;
            }
            if (!cellEditable && ((cellStart >= 0 && cellStart < rows.length) || (cellEnd >= 0 && cellEnd < rows.length))) {
                return;
            }
        }

        const { cut } = state.copied;
        const copiedRows: any[][] = [];

        for (let i = rowStart; i <= rowEnd; i++) {
            let row = newRows[i];
            if (cut) {
                row = { ...row };
                newRows[i] = row;
            }
            const copiedCells: any[] = [];
            for (let j = cellStart; j <= cellEnd; j++) {
                const { field } = columns[j];
                let value = row[field];
                if (cut) {
                    delete row[field];
                } else {
                    value = clone(value);
                }
                copiedCells.push(value);
            }
            copiedRows.push(copiedCells);
        }

        pasteData(newRows, columns, copiedRows);
    }, [state.copied, rows, columns, getOrderedSelection, pasteData]);

    const getSelectionState = useCallback(
        (row: number, cell: number, useCopied?: boolean) => {
            const { editing, copied } = state;

            if (useCopied && !copied) {
                return {};
            } // If user has not copied anything return empty object

            const { rowStart, cellStart, rowEnd, cellEnd: actCellEnd } = getOrderedSelection(useCopied ? copied : undefined);
            let cellEnd = actCellEnd;

            if (editing) {
                // If a field is being edited, then border should appear for next 2 cols
                cellEnd = cellEnd + 2;
                const colLen = columns.length;
                if (cellEnd >= colLen) {
                    cellEnd = colLen - 1;
                }
            }

            const isRowOnRange = row >= rowStart && row <= rowEnd;
            const isColOnRange = cell >= cellStart && cell <= cellEnd;
            const isSelected = isRowOnRange && isColOnRange;

            const isPrevRow = rowStart - 1 === row;
            const isNextRow = rowEnd + 1 === row;

            const isPrevCell = cellStart - 1 === cell;
            const isNextCell = cellEnd + 1 === cell;

            const { startRow, startCell } = useCopied ? copied! : state;
            const prefix = useCopied ? 'copy' : 'sel';
            const className =
                !isSelected && !(isPrevRow || isNextRow) && !(isPrevCell || isNextCell)
                    ? ''
                    : {
                          [useCopied ? 'copied' : 'selected']: isSelected,
                          [`${prefix}-start`]: row === startRow && cell === startCell,
                          [`${prefix}-top`]: isColOnRange && (rowStart === row || isNextRow),
                          [`${prefix}-right`]: isRowOnRange && (actCellEnd === cell || cellEnd === cell || isPrevCell),
                          [`${prefix}-bottom`]: isColOnRange && (rowEnd === row || isPrevRow),
                          [`${prefix}-left`]: isRowOnRange && (cellStart === cell || isNextCell),
                      };

            return { isSelected, className, isLastCell: cellEnd === cell && rowEnd === row };
        },
        [state, columns, getOrderedSelection],
    );

    const keyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (state.editing) {
                return;
            } // Return if a cell is in edit mode

            const { which, keyCode = which, ctrlKey, shiftKey } = e;
            let { startRow, startCell, endRow, endCell } = state;

            let updated = false;

            if (keyCode === 39) {
                // Move right
                if (startCell < columns.length - 1) {
                    if (shiftKey) {
                        endCell = ctrlKey ? columns.length - 1 : endCell + 1;
                    } else {
                        startCell = ctrlKey ? columns.length - 1 : startCell + 1;
                        endCell = startCell;
                        endRow = startRow;
                    }
                    updated = true;
                }
            } else if (keyCode === 37) {
                // Move left
                if (startCell > 0) {
                    if (shiftKey) {
                        endCell = ctrlKey ? 0 : endCell - 1;
                    } else {
                        startCell = ctrlKey ? 0 : startCell - 1;
                        endCell = startCell;
                        endRow = startRow;
                    }
                    updated = true;
                }
            } else if (keyCode === 38) {
                // Move up
                if (startRow > -1) {
                    if (shiftKey) {
                        endRow = ctrlKey ? 0 : endRow - 1;
                    } else {
                        startRow = ctrlKey ? 0 : startRow - 1;
                        endRow = startRow;
                        endCell = startCell;
                    }
                    updated = true;
                }
            } else if (keyCode === 40 || keyCode === 13) {
                // Move down with down arrow or enter key
                if (startRow < rows.length) {
                    if (shiftKey) {
                        endRow = ctrlKey ? rows.length - 1 : endRow + 1;
                    } else {
                        startRow = ctrlKey ? rows.length - 1 : startRow + 1;
                        endRow = startRow;
                        endCell = startCell;
                    }
                    updated = true;
                }
            } else if (keyCode === 46) {
                // Handle delete key press
                clearSelectedCells(rows, columns);
            } else if (ctrlKey && keyCode === 67) {
                initCopyCells();
            } else if (ctrlKey && keyCode === 88) {
                initCopyCells(true);
            } else if (ctrlKey && keyCode === 86) {
                beginPaste();
            }

            if (updated) {
                if (endRow < -1) {
                    endRow = -1;
                } else if (endRow > rows.length) {
                    endRow = rows.length;
                }
                if (endCell < 0) {
                    endCell = 0;
                } else if (endCell > columns.length - 1) {
                    endCell = columns.length - 1;
                }

                setState({ ...state, startRow, startCell, endRow, endCell });
            }
        },
        [state, rows, columns, clearSelectedCells, initCopyCells, beginPaste],
    );

    const getCellRenderer = useCallback(
        (CellTemplate: typeof GridCell | typeof HeaderCell | typeof FooterCell) => {
            return (r: any, ri: number) => {
                const { editingRow, editingCell } = state;
                let { editing } = state;
                if (editingRow !== ri) {
                    editing = false;
                }

                return (c: GridColumn, ci: number) => {
                    let domProps: React.TdHTMLAttributes<HTMLTableCellElement> | undefined;
                    if (editing) {
                        if (editingCell === ci) {
                            domProps = { colSpan: 3 };
                        } else if (ci > editingCell! && ci < editingCell! + 3) {
                            return null;
                        }
                    }

                    const selected = getSelectionState(ri, ci);
                    const copied = getSelectionState(ri, ci, true);

                    let combinedClassName: any = selected.className;
                    if (copied.isSelected && typeof selected.className === 'object' && typeof copied.className === 'object') {
                        combinedClassName = { ...selected.className, ...copied.className };
                    }

                    const finalClassName = classNames(combinedClassName);
                    selected.className = finalClassName;

                    if ((CellTemplate as any).setWidth) {
                        if (!domProps) {
                            domProps = {};
                        }
                        domProps.style = {
                            width: `${c.width || defaultColumnWidth}px`,
                            ...c.style,
                        };
                    }

                    return (
                        <CellTemplate
                            key={ci}
                            index={ci}
                            rowIndex={ri}
                            data={r}
                            column={c}
                            className={selected.className}
                            isLastCell={selected.isLastCell}
                            domProps={domProps}
                        />
                    );
                };
            };
        },
        [state, getSelectionState],
    );

    const cellRenderer = useMemo(() => getCellRenderer(GridCell), [getCellRenderer]);

    const tableWidth = columns.reduce((width, c) => width + (c.width || defaultColumnWidth) + 2, 19);

    return (
        <GridData value={contextAPI}>
            <div className={classNames('src-editable-grid-container', className)} style={{ width, height }}>
                <table
                    ref={tableRef}
                    className="src-editable-grid"
                    style={{ width: tableWidth }}
                    cellSpacing="0"
                    cellPadding="0"
                    onKeyDown={keyDown}
                    tabIndex={tabIndex}
                >
                    <thead>
                        <tr className="src-h-row">
                            <th className="src-status-cell">#</th>
                            {columns.map(getCellRenderer(HeaderCell)(undefined, -1))}
                        </tr>
                    </thead>
                    <tbody>
                        {!rows?.length && (
                            <tr>
                                <td colSpan={columns.length + 1}>{noRowMessage}</td>
                            </tr>
                        )}
                        {rows?.map((r, i) => (
                            <tr key={i} className="src-row">
                                <th className={classNames('src-status-cell', getRowHeaderClassName?.(r, i))}>{i + 1}</th>
                                {columns.map(cellRenderer(r, i))}
                            </tr>
                        ))}
                    </tbody>
                    {!!showFooter && (
                        <tfoot>
                            <tr className="src-f-row">
                                <th className="src-status-cell">#</th>
                                {columns.map(getCellRenderer(FooterCell)(undefined, rows.length))}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </GridData>
    );
}

export default EditableGrid;
