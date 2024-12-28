/* eslint-disable complexity */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FooterCell, GridCell, HeaderCell } from './GridCell';
import { GridData } from './GridContext';
import { clone } from './utils';
import './EditableGrid.scss';

const defaultColumnWidth = 140;

class EditableGrid extends PureComponent {
    state = { startRow: 0, startCell: 0, endRow: 0, endCell: 0 };

    componentDidMount() {
        document.addEventListener('mousemove', this.handleDocumentMouseMove);
        document.addEventListener('mouseup', this.handleDocumentMouseUp);
    }

    componentWillUnmount() {
        document.removeEventListener('mousemove', this.handleDocumentMouseMove);
        document.removeEventListener('mouseup', this.handleDocumentMouseUp);
    }

    handleDocumentMouseMove = (e) => {
        if (!(this.resizingColumn >= 0)) { return; }

        const diffX = e.pageX - this.pageX;
        const { rows, onChange } = this.props;
        let { columns } = this.props;
        columns = [...columns];
        const col = { ...columns[this.resizingColumn] };
        columns[this.resizingColumn] = col;
        col.width = this.colWidth + diffX;
        if (col.width < 15) {
            col.width = 15;
        }
        else if (col.width > 800) {
            col.width = 800;
        }

        if (onChange) {
            onChange(rows, columns);
        }
    };

    handleDocumentMouseUp = (e) => {
        delete this.resizingColumn;
        delete this.pageX;
    };

    contextAPI = {
        beginSelect: (startRow, startCell) => {
            if (this.state.editing) { return; }
            this.setState({ isSelecting: true, startRow, startCell, endRow: startRow, endCell: startCell });
        },
        endSelect: (endRow, endCell) => {
            if (this.state.isSelecting) {
                this.setState({ isSelecting: false, endRow, endCell });
            }
        },
        onSelecting: (endRow, endCell) => {
            if (this.state.isSelecting) {
                this.setState({ endRow, endCell });
            }
        },
        beginEdit: (editingRow, editingCell) => {
            this.setState({ editing: true, editingRow, editingCell });
        },
        endEdit: (value, rowIndex, cellIndex) => {
            const { columns, onChange, onHeaderChange } = this.props;
            let { rows } = this.props;
            if (rowIndex === -1) {
                const col = { ...columns[cellIndex], field: value };
                delete col.displayText;

                if (onHeaderChange) {
                    onHeaderChange(col, cellIndex);
                }
            }
            else if (rowIndex >= 0) {
                rows = [...rows];

                const row = { ...rows[rowIndex] };
                rows[rowIndex] = row;

                const cell = columns[cellIndex];
                row[cell.field] = value;

                if (onChange) {
                    onChange(rows, columns, rowIndex, cellIndex);
                }
            }
            this.setState({ editing: false, editingRow: -2, editingCell: -2 });
            this.table?.focus();
        },
        repeatSelectedCells: () => {
            const { rowStart, rowEnd, cellStart, cellEnd } = this.getOrderedSelection();

            const { columns, onChange } = this.props;
            let { rows } = this.props;
            if (rowEnd === rows.length - 1) { return; } // Their are no rows below current to copy data

            rows = [...rows];
            for (let i = cellStart; i <= cellEnd; i++) {
                this.repeatRowData(rows, columns, rowStart, rowEnd, i);
            }

            if (onChange) {
                onChange(rows, columns);
            }

            this.setState({ startRow: rowStart, endRow: rows.length - 1 });
        },
        beginResize: (index, e) => {
            this.resizingColumn = index;
            this.pageX = e.pageX;
            this.colWidth = this.props.columns[index].width || 140;
        }
    };

    repeatRowData(rows, columns, start, end, cell) {
        const { field } = columns[cell];

        for (let i = end + 1, j = start; i < rows.length; i++) {
            rows[i] = { ...rows[i], [field]: clone(rows[j++][field]) };

            if (j > end) { j = start; } // If data cloned till last selected row, start from beginning
        }
    }

    clearSelectedCells(rows, columns) {
        rows = [...rows];

        const { rowStart, rowEnd, cellStart, cellEnd } = this.getOrderedSelection();

        for (let ri = rowStart; ri <= rowEnd; ri++) {
            const row = { ...rows[ri] };
            rows[ri] = row;

            for (let ci = cellStart; ci <= cellEnd; ci++) {
                const { field } = columns[ci];
                delete row[field];
            }
        }

        const { onChange } = this.props;
        if (onChange) {
            onChange(rows, columns);
        }
    }

    initCopyCells(cut) {
        const { startRow, startCell, endRow, endCell } = this.state;
        this.setState({ copied: { cut, startRow, startCell, endRow, endCell } });
    }

    beginPaste() {
        const { copied } = this.state;
        if (!copied) { return; }

        const { columns } = this.props;
        let { rows } = this.props;
        rows = [...rows];

        const { rowStart, cellStart, rowEnd, cellEnd } = this.getOrderedSelection(copied);

        // If any of the selected cell is non editable, then paste operation is not allowed
        for (let i = cellStart; i <= cellEnd; i++) {
            const { editable, headerEditable, cellEditable, footerEditable } = columns[i];
            if (!editable) { return; }
            if (!headerEditable && cellStart === -1) { return; }
            if (!footerEditable && (cellStart === rows.length || cellEnd === rows.length)) { return; }
            if (!cellEditable && ((cellStart >= 0 && cellStart < rows.length) || (cellEnd >= 0 && cellEnd < rows.length))) { return; }
        }

        const { cut } = copied;
        const copiedRows = [];

        for (let i = rowStart; i <= rowEnd; i++) {
            let row = rows[i];
            if (cut) {
                row = { ...row };
                rows[i] = row;
            }
            const copiedCells = [];
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

        this.pasteData(rows, columns, copiedRows);
    }

    pasteData(rows, columns, copiedRows) {
        const { rowStart: startRow, cellStart: startCell } = this.getOrderedSelection();
        let endCell = startCell + copiedRows[0].length - 1;
        if (endCell >= columns.length) {
            endCell = columns.length - 1;
        }

        const pasteCols = columns.slice(startCell, endCell + 1).map(c => c.field);
        let endRow = startRow;

        for (let i = 0; i < copiedRows.length; i++, endRow++) {
            const row = { ...rows[endRow] };
            rows[endRow] = row;
            const copiedRow = copiedRows[i];
            for (let j = 0; j < copiedRow.length; j++) {
                const field = pasteCols[j];
                const value = copiedRow[j];
                row[field] = value;
            }
        }

        const { onChange } = this.props;
        if (onChange) {
            onChange(rows, columns);
        }
        const newState = { startRow, startCell, endRow, endCell };
        if (this.state.copied?.cut) {
            newState.copied = null;
        }
        this.setState(newState);
    }

    getOrderedSelection(state) {
        const { startRow, startCell, endRow, endCell } = state || this.state;

        const rowStart = startRow <= endRow ? startRow : endRow;
        const cellStart = startCell <= endCell ? startCell : endCell;

        const rowEnd = startRow <= endRow ? endRow : startRow;
        const cellEnd = startCell <= endCell ? endCell : startCell;

        return { rowStart, cellStart, rowEnd, cellEnd };
    }

    getSelectionState = (row, cell, useCopied) => {
        const { editing, copied } = this.state;

        if (useCopied && !copied) { return {}; } // If user has not copied anything return empty object

        const { rowStart, cellStart, rowEnd, cellEnd: actCellEnd } = this.getOrderedSelection(useCopied && copied);
        let cellEnd = actCellEnd;

        if (editing) { // If a field is being edited, then border should appear for next 2 cols
            cellEnd = cellEnd + 2;
            const colLen = this.props.columns.length;
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

        const { startRow, startCell } = useCopied ? copied : this.state;
        const prefix = useCopied ? 'copy' : 'sel';
        const className = !isSelected && !(isPrevRow || isNextRow) && !(isPrevCell || isNextCell) ? '' : {
            [useCopied ? 'copied' : 'selected']: isSelected,
            [`${prefix}-start`]: row === startRow && cell === startCell,
            [`${prefix}-top`]: isColOnRange && (rowStart === row || isNextRow),
            [`${prefix}-right`]: isRowOnRange && (actCellEnd === cell || cellEnd === cell || isPrevCell),
            [`${prefix}-bottom`]: isColOnRange && (rowEnd === row || isPrevRow),
            [`${prefix}-left`]: isRowOnRange && (cellStart === cell || isNextCell)
        };

        return { isSelected, className, isLastCell: cellEnd === cell && rowEnd === row };
    };

    keyDown = (e) => {
        if (this.state.editing) { return; } // Return if a cell is in edit mode

        const { which, keyCode = which, ctrlKey, shiftKey } = e;
        let { startRow, startCell, endRow, endCell } = this.state;

        let updated = false;
        const { columns, rows } = this.props;

        if (keyCode === 39) { // Move right
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
        }
        else if (keyCode === 37) { // Move left
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
        }
        else if (keyCode === 38) { // Move up
            if (startRow > -1) {
                if (shiftKey) {
                    endRow = ctrlKey ? 0 : endRow - 1;
                }
                else {
                    startRow = ctrlKey ? 0 : startRow - 1;
                    endRow = startRow;
                    endCell = startCell;
                }
                updated = true;
            }
        }
        else if (keyCode === 40 || keyCode === 13) { // Move down with down arrow or enter key
            if (startRow < rows.length) {
                if (shiftKey) {
                    endRow = ctrlKey ? rows.length - 1 : endRow + 1;
                }
                else {
                    startRow = ctrlKey ? rows.length - 1 : startRow + 1;
                    endRow = startRow;
                    endCell = startCell;
                }
                updated = true;
            }
        }
        else if (keyCode === 46) { // Handle delete key press
            this.clearSelectedCells(rows, columns);
        }
        else if (ctrlKey && keyCode === 67) {
            this.initCopyCells();
        }
        else if (ctrlKey && keyCode === 88) {
            this.initCopyCells(true);
        }
        else if (ctrlKey && keyCode === 86) {
            this.beginPaste();
        }

        if (updated) {
            if (endRow < -1) { endRow = -1; }
            else if (endRow > rows.length) { endRow = rows.length; }
            if (endCell < 0) { endCell = 0; }
            else if (endCell > columns.length - 1) { endCell = columns.length - 1; }

            this.setState({ startRow, startCell, endRow, endCell });
        }
    };

    getCellRenderer(CellTemplate) {
        return (r, ri) => {
            const { editingRow, editingCell } = this.state;
            let { editing } = this.state;
            if (editingRow !== ri) {
                editing = false;
            }

            return (c, ci) => {
                let domProps;
                if (editing) {
                    if (editingCell === ci) {
                        domProps = { colSpan: 3 };
                    } else if (ci > editingCell && ci < editingCell + 3) {
                        return null;
                    }
                }

                const selected = this.getSelectionState(ri, ci);
                const copied = this.getSelectionState(ri, ci, true);

                if (copied.isSelected) {
                    selected.className = { ...selected.className, ...copied.className };
                }

                selected.className = classNames(selected.className);

                if (CellTemplate.setWidth) {
                    if (!domProps) { domProps = {}; }
                    domProps.style = {
                        width: `${c.width || defaultColumnWidth}px`,
                        ...c.style
                    };
                }

                return (<CellTemplate key={ci} index={ci} rowIndex={ri} data={r} column={c} {...selected} domProps={domProps} />);
            };
        };
    }

    cellRenderer = this.getCellRenderer(GridCell);
    setTableRef = (ref) => this.table = ref;

    render() {
        const {
            tabIndex = 1,
            columns,
            rows,
            showFooter,
            width,
            height,
            noRowMessage,
            getRowHeaderClassName,
            className
        } = this.props;

        const tableWidth = this.props.columns.reduce((width, c) => width + (c.width || defaultColumnWidth) + 2, 19);

        return (
            <GridData value={this.contextAPI}>
                <div className={classNames("src-editable-grid-container", className)} style={{ width, height }}>
                    <table ref={this.setTableRef} className="src-editable-grid" style={{ width: tableWidth }}
                        cellSpacing="0" cellPadding="0"
                        onKeyDown={this.keyDown} tabIndex={tabIndex}>
                        <thead>
                            <tr className="src-h-row">
                                <th className="src-status-cell">#</th>
                                {columns.map(this.getCellRenderer(HeaderCell)(undefined, -1))}
                            </tr>
                        </thead>
                        <tbody>
                            {!rows?.length && <tr><td colSpan={columns.length + 1}>{noRowMessage}</td></tr>}
                            {rows?.map((r, i) => (
                                <tr key={i} className="src-row">
                                    <th className={classNames("src-status-cell", getRowHeaderClassName(r, i))}>{i + 1}</th>
                                    {columns.map(this.cellRenderer(r, i))}
                                </tr>))}
                        </tbody>
                        {!!showFooter && <tfoot>
                            <tr className="src-f-row">
                                <th className="src-status-cell">#</th>
                                {columns.map(this.getCellRenderer(FooterCell)(undefined, rows.length))}
                            </tr>
                        </tfoot>}
                    </table>
                </div>
            </GridData>
        );
    }
}

EditableGrid.propTypes = {
    columns: PropTypes.array.isRequired,
    rows: PropTypes.array.isRequired
};

export default EditableGrid;