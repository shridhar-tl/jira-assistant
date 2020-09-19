import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Draggable } from 'jsd-report';
import { ScrollableTable, THead, TRow, Column, TBody, NoDataRow } from '../ScrollableTable';
import GroupedColumnList from './GroupedColumnList';
import './GroupableGrid.scss';
import ColumnList from './ColumnList';
import { getPathValue } from '../../common/utils';

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
        const { groupBy, columns, displayColumns, dataset, groupFoldable, sortField, isDesc, } = props;
        const newState = { ...this.state, groupFoldable };

        if (this.columns !== columns || displayColumns !== this.displayColumns) {
            newState.allColumns = this.getColumnSchema(props);
            newState.columns = newState.allColumns;
            this.columns = columns;
            this.displayColumns = displayColumns;
        }

        const groupChanged = this.groupBy !== groupBy;
        if (groupChanged) {
            newState.groupBy = this.getGroupedColumnSchema(groupBy, newState.allColumns);
            this.groupBy = groupBy;

            if (groupBy && groupBy.length) {
                const groupByFields = groupBy.map(g => (typeof g === "string" ? g : (g.id || g.field)));

                newState.columns = newState.allColumns.filter(c => c.visible && !~groupByFields.indexOf(c.id));
            }
            else {
                newState.columns = newState.allColumns.filter(c => c.visible);
            }
        }

        if (groupChanged || this.isDesc !== isDesc || this.sortField !== sortField || this.dataset !== dataset) {
            newState.data = this.prepareDataForRendering(dataset, newState.groupBy, sortField, isDesc);
            this.dataset = dataset;
            this.sortField = sortField;
            this.isDesc = isDesc;
        }

        return newState;
    }

    getGroupedColumnSchema(groupBy, columns) {
        let result = null;

        if (Array.isArray(groupBy) && groupBy.length) {
            columns = columns.reduce((obj, col) => { obj[col.id] = col; return obj; }, {});

            result = groupBy.map(g => {
                let field = g;
                let id = g;
                let fieldKey = field;
                let sortDesc = false;

                if (typeof g === "object") {
                    field = g.field;
                    id = g.id || field;
                    fieldKey = g.fieldKey || g.groupKey || field; // ToDo: groupKey is temporary. need to be removed later
                    sortDesc = g.sortDesc;
                }

                g = columns[id];

                if (!g) { return null; }

                const { displayText, allowSorting, viewComponent } = g;

                return { id, field, viewComponent, fieldKey, displayText, allowSorting, sortDesc, visible: true };
            }).filter(Boolean);

            if (!result.length) {
                result = null;
            }
        }

        return result;
    }

    getColumnSchema(props) {
        const { columns, allowSorting: globalSort = true, allowGrouping: globalGrouping = true } = props;
        let { displayColumns } = props;

        if (!Array.isArray(displayColumns)) {
            displayColumns = null;
        }
        const isColsToRemove = !!displayColumns && displayColumns.any(c => c.startsWith("-"));

        // Map all the known properties for column schema
        const result = columns.map(c => {
            const { field, fieldKey = field,
                allowSorting = globalSort, allowGrouping = globalGrouping,
                format, type, viewComponent, props: pr, sortValueFun, groupValueFunc } = c;

            const id = c.id || field;

            return {
                id,
                field: c.field,
                fieldKey,
                hasPath: field?.indexOf(".") > 0,
                displayText: c.displayText || field,
                visible: !displayColumns || (isColsToRemove ? !displayColumns.contains(`-${id}`) : displayColumns.contains(id)),
                allowSorting,
                allowGrouping,
                format, type, viewComponent, props: pr, sortValueFun, groupValueFunc
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

    groupData(data, groupBy, sortField, isDesc, prefix) {
        prefix = prefix ? `${prefix}_` : "";
        if (!groupBy.length) { return sortField ? data.sortBy(sortField, isDesc) : data; }
        const { 0: { field, fieldKey, sortDesc } } = groupBy;
        groupBy = groupBy.slice(1);

        const altKeyField = fieldKey && fieldKey !== field;

        return data.groupBy(fieldKey || field, null, altKeyField ? field : null)
            .sortBy("key", sortDesc)
            .map((row, i) => ({
                key: row.key,
                keyObj: row.keyObj,
                path: prefix + i,
                rowSpan: row.values.length,
                values: this.groupData(row.values, groupBy, sortField, isDesc, prefix + i)
            }));
    }

    renderColumn = (c, i) => {
        if (!c.visible) { return null; }
        const sortBy = c.allowSorting ? c.fieldKey || c.field : undefined;

        if (c.allowGrouping === false) {
            return (
                <Column sortBy={sortBy}>{c.displayText}</Column>
            );
        }

        return <Draggable key={i} itemType="column" item={c} itemTarget={itemTarget}>
            {(connectDragSource, isDragging) => <Column
                dragConnector={connectDragSource}
                sortBy={sortBy}>{c.displayText}</Column>}
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

        const { field, hasPath, format, type, viewComponent: Component, props } = c;
        let value = hasPath ? getPathValue(row, field) : row[field];

        if (format) {
            if (typeof format === "function") {
                value = format(value, row, field);
            }
            else {
                // ToDo: need to format data for number and datetime
            }
        }

        if (!Component) {
            return <td key={ci} exportType={type}>{value}</td>;
        }
        else {
            return <Component key={ci} value={value} {...props} />;
        }
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
        const Component = groupBy[0]?.viewComponent;

        let groupKeyCell = groupBy.length > 0 && <td rowSpan={g.rowSpan}>{Component ? <Component tag='span' value={g.keyObj || g.key} /> : (g.key || '')}</td>;
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
        const { groupBy, state: { groupFoldable, data }, props: { displayColumns } } = this;
        const newState = { groupFoldable };

        const hasGroup = groupBy?.length;
        if (hasGroup) {
            newState.data = this.sortGroupedData(data, groupBy, sortField, isDesc);
        }

        this.setState(newState);
        this.props.onChange({ groupBy, groupFoldable, displayColumns, sortField, isDesc });

        return hasGroup ? newState.data : undefined;
    }

    onGroupChanged = (groupBy, groupFoldable, type) => {
        const { data } = this.state;
        const newState = { data, groupFoldable };
        const { displayColumns, sortField, isDesc, groupBy: oldGroupBy } = this.props;

        if (type === "sort") {
            newState.data = this.sortGroupedData(data, groupBy, sortField, isDesc);
        }

        if (type !== "mode") {
            groupBy = groupBy.map(({ id, field, fieldKey, sortDesc }) => ({ id, field, fieldKey, sortDesc }));
        }
        else {
            groupBy = oldGroupBy;
        }

        this.setState(newState);
        this.props.onChange({ groupBy, displayColumns, groupFoldable, sortField, isDesc });
    }

    sortGroupedData(data, groups, sortField, isDesc, prefix) {
        prefix = prefix ? (`${prefix}_`) : "";
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

    toggleColumns = () => {
        this.setState({ showColumns: !this.state.showColumns });
    }

    columnSelectionChanged = (displayColumns) => {
        const { groupBy, groupFoldable, sortField, isDesc } = this.props;
        this.setState({ showColumns: null },
            () => this.props.onChange({ groupBy, displayColumns, groupFoldable, sortField, isDesc }));
    }

    render() {
        const { exportSheetName, noRowsMessage, sortField, isDesc, displayColumns, className } = this.props;
        const { allColumns, columns, groupBy, groupFoldable, data, showColumns } = this.state;

        return (
            <div className="groupable-grid">
                {showColumns && <ColumnList onChange={this.columnSelectionChanged} columns={allColumns}
                    displayColumns={displayColumns} />}
                <GroupedColumnList groupBy={groupBy || []} foldable={groupFoldable}
                    onChange={this.onGroupChanged} showColumns={showColumns} toggleColumns={this.toggleColumns} />
                <ScrollableTable className={className} dataset={data} exportSheetName={exportSheetName}
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
