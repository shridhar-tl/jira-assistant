import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Draggable } from 'jsd-report';
import { ScrollableTable, THead, TRow, Column, TBody, NoDataRow } from '../ScrollableTable';
import GroupedColumnList from './GroupedColumnList';
import './GroupableGrid.scss';

const itemTarget = ["column"];

export class GroupableGrid extends PureComponent {
    constructor(props) {
        super(props);
        this.state = this.getNewState(props);
    }

    UNSAFE_componentWillReceiveProps(props) {
        this.setState(this.getNewState(props));
    }

    getNewState(props) {
        const { groupBy, columns, dataset, groupFoldable, sortField, isDesc } = props;
        const newState = { groupFoldable };

        if (this.columns !== columns || this.groupBy !== groupBy || this.dataset !== dataset) {
            newState.columns = this.getColumnSchema(props);
            this.columns = columns;

            if (this.groupBy !== groupBy) {
                newState.groupBy = this.getGroupedColumnSchema(groupBy, newState.columns);
                this.groupBy = groupBy;
            } else if (this.state && this.state.groupBy) {
                newState.groupBy = this.state.groupBy;
            }

            if (groupBy && groupBy.length) {
                const groupByFields = groupBy.map(g => (typeof g === "string" ? g : g.field));
                newState.columns.removeAll(c => !c.visible || ~groupByFields.indexOf(c.id));
            }

            newState.data = this.prepareDataForRendering(dataset, newState.groupBy, sortField, isDesc);
            this.dataset = dataset;
        }

        return newState;
    }

    getGroupedColumnSchema(groupBy, columns) {
        let result = null;

        if (Array.isArray(groupBy) && groupBy.length) {
            columns = columns.reduce((obj, col) => { obj[col.id] = col; return obj; }, {});

            result = groupBy.map(g => {
                let field = g;
                let sortDesc = false;

                if (typeof g === "object") {
                    field = g.field;
                    sortDesc = g.sortDesc;
                }

                g = columns[field];

                if (!g) { return null; }

                const { id, displayText, allowSorting } = g;

                return { id, field, displayText, allowSorting, sortDesc, visible: true };
            }).filter(Boolean);

            if (!result.length) {
                result = null;
            }
        }

        return result;
    }

    getColumnSchema(props) {
        const { columns, allowSorting: globalSort = true, allowGrouping: globalGrouping = true } = props;
        let { visibleColumns } = props;

        let isColumnVisible = (field) => {
            //if(visibleColumns.contains(field) || )
            return true; // ToDo: implementation based on visible columns
        };

        if (!Array.isArray(visibleColumns)) {
            visibleColumns = null;
            isColumnVisible = null;
        }

        const result = columns.map(c => {
            const { field,
                allowSorting = globalSort, allowGrouping = globalGrouping,
                format, sortValueFun, groupValueFunc } = c;

            const id = c.id || field;

            return {
                id,
                field: c.field,
                displayText: c.displayText || field,
                visible: !isColumnVisible || isColumnVisible(id),
                allowSorting,
                allowGrouping,
                format, sortValueFun, groupValueFunc
            };
        });

        return result;
    }

    prepareDataForRendering(data, groupBy, sortField, isDesc) {
        if (!groupBy || !groupBy.length || !Array.isArray(data) || !data.length) {
            return sortField ? data.sortBy(sortField, isDesc) : data;
        }

        return this.groupData(data, groupBy, sortField, isDesc);
    }

    groupData(data, groupBy, sortField, isDesc) {
        if (!groupBy.length) { return sortField ? data.sortBy(sortField, isDesc) : data; }
        const { 0: { field, sortDesc } } = groupBy;
        groupBy = groupBy.slice(1);
        return data.groupBy(field).map(row => ({
            key: row.key,
            rowSpan: row.values.length,
            values: this.groupData(row.values, groupBy, sortField, isDesc)
        })).sortBy("key", sortDesc);
    }

    renderColumn = (c, i) => {
        if (!c.visible) { return "null"; }

        return <Draggable key={i} itemType="column" item={c} itemTarget={itemTarget}>
            {(connectDragSource, isDragging) => <Column
                dragConnector={connectDragSource}
                sortBy={c.allowSorting ? c.field : undefined}>{c.displayText}</Column>}
        </Draggable>;
    }

    renderGroupColumns = (_, i) => <th key={i} className="group-header foldable"></th>

    renderTableBody = (columns, groupBy) => {
        if (!groupBy || !groupBy.length) {
            return this.getRowRenderer(columns);
        }
        else {
            return this.getGroupRenderer(columns, groupBy);
        }
    }

    getRowRenderer(columns) {
        return (row, i) => <tr key={i}>{this.renderRowCells(columns, row)}</tr>;
    }

    renderRowCells(columns, row) {
        return columns.map(this.getCellRenderer(row));
    }

    getCellRenderer = (row) => (c, ci) => {
        if (!c.visible) { return null; }

        const { field, format } = c;
        let value = row[field];

        if (format) {
            if (typeof format === "function") {
                value = format(value, row, field);
            }
            else {
                // ToDo: need to format data for number and datetime
            }
        }

        return <td key={ci}>{value}</td>;
    }

    getGroupRenderer(columns, groupBy) {
        const { groupFoldable } = this.state;

        if (groupFoldable) {
            return (g, i) => this.renderFoldableGroupRow(g, i, columns, groupBy);
        }
        else {
            return (g, i) => this.renderGroupRow(g, i, columns, groupBy);
        }
    }

    toggleGroupVisibility = (e) => {
        // ToDo: implement toggle functionality
    }

    renderFoldableGroupRow(g, i, columns, groupBy, depth = 0) {
        const emptyTDs = depth > 0 && [].init((_, i) => <td key={i} className="group-indent-td"></td>, depth);
        const groupKeyCell = groupBy.length > 0 && (<tr key={g.key}>
            {emptyTDs}
            <td className="group-toggler-td"
                title={`Click to ${g.hidden ? "expand" : "collapse"} group`}
                group-path={g.path} onClick={this.toggleGroupVisibility}>
                <span className={`fa fa-caret-${g.hidden ? "right" : "down"}`} />
            </td>
            <td className="group-name-td" colSpan={(groupBy.length - depth) + columns.length}>
                {g.key}
            </td>
        </tr>);

        let result = null;
        if (groupBy.length > 0) {
            result = g.values.map((r, j) => this.renderFoldableGroupRow(r, j, columns, groupBy.slice(1), depth + 1));
        }
        else {
            result = columns.map(this.getCellRenderer(g));
            result = <tr key={i}>{emptyTDs}{result}</tr>;
        }

        return [groupKeyCell, result];
    }

    renderGroupRow(g, i, columns, groupBy, prepend = null) {
        let groupKeyCell = groupBy.length > 0 && <td rowSpan={g.rowSpan}>{g.key}</td>;
        if (prepend && groupKeyCell) {
            groupKeyCell = <Fragment>{prepend}{groupKeyCell}</Fragment>;
        }
        else if (prepend && i === 0) {
            groupKeyCell = prepend;
        }

        let result = null;
        if (groupBy.length > 0) {
            result = g.values.map((r, j) => this.renderGroupRow(r, j, columns, groupBy.slice(1), j === 0 && groupKeyCell));
        }
        else {
            result = columns.map(this.getCellRenderer(g));
            result = <tr key={i}>
                {groupKeyCell}
                {result}
            </tr>;
        }

        return result;
    }

    sortColumnChanged = (sortField, isDesc) => {
        const { groupBy, state: { groupFoldable, data } } = this;
        const newState = { groupFoldable };

        if (groupBy && groupBy.length) {
            newState.data = this.sortGroupedData(data, groupBy, sortField, isDesc);
        }

        this.setState(newState);
        this.props.onChange({ groupBy, groupFoldable, sortField, isDesc });

        return newState.data;
    }

    onGroupChanged = (groupBy, groupFoldable, type) => {
        const { data } = this.state;
        const newState = { data, groupFoldable };
        const { sortField, isDesc } = this.props;

        if (type === "sort") {
            newState.data = this.sortGroupedData(data, groupBy, sortField, isDesc);
        }

        if (type !== "mode") {
            this.groupBy = groupBy.map(({ field, sortDesc }) => ({ field, sortDesc }));
        }

        this.setState(newState);
        this.props.onChange({ groupBy: this.groupBy, groupFoldable, sortField, isDesc });
    }

    sortGroupedData(data, groups, sortField, isDesc, prefix) {
        prefix = prefix ? (`_${prefix}`) : "";
        if (groups.length === 0) {
            return sortField ? data.sortBy(sortField, isDesc) : data;
        }

        const { sortDesc } = groups[0];
        groups = groups.slice(1);
        return data.sortBy("key", sortDesc).map((row, i) => ({
            ...row,
            path: prefix + i,
            values: this.sortGroupedData(row.values, groups, sortField, isDesc, prefix + i)
        }));
    }

    render() {
        const { exportSheetName, noRowsMessage, sortField, isDesc } = this.props;
        const { columns, groupBy, groupFoldable, data } = this.state;

        return (
            <div className="groupable-grid">
                <GroupedColumnList groupBy={groupBy || []} foldable={groupFoldable} onChange={this.onGroupChanged} />
                <ScrollableTable dataset={data} exportSheetName={exportSheetName}
                    sortBy={sortField} isDesc={isDesc} onSort={this.sortColumnChanged}>
                    <THead>
                        <TRow>
                            {!!groupFoldable && groupBy && groupBy.map(this.renderGroupColumns)}
                            {!groupFoldable && groupBy && groupBy.map(this.renderColumn)}
                            {columns.map(this.renderColumn)}
                        </TRow>
                    </THead>
                    <TBody>{this.renderTableBody(columns, groupBy)}</TBody>
                    <NoDataRow span={columns.length}>{noRowsMessage}</NoDataRow>
                </ScrollableTable>
            </div>);
    }
}

GroupableGrid.propTypes = {
    dataset: PropTypes.array.isRequired,
    columns: PropTypes.array.isRequired,
    displayColumns: PropTypes.array,
    groupBy: PropTypes.array,
    groupFoldable: PropTypes.bool,
    allowRowEdit: PropTypes.bool,
    allowGrouping: PropTypes.bool,
    allowSorting: PropTypes.bool,
    noRowsMessage: PropTypes.string,
    exportSheetName: PropTypes.string,
    onChange: PropTypes.func // When settings like display column, sorting, group by expression, etc changes
};

export default GroupableGrid;