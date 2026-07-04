import { Fragment, useCallback, useMemo, useState } from 'react';

import classNames from 'classnames';

import { Draggable } from '../../controls';
import { getPathValue } from '../../utils/helpers';
import { Column, NoDataRow, ScrollableTable, TBody, THead, TRow } from '../shared/ScrollableTable';

import ColumnList from './ColumnList';
import './GroupableGrid.css';
import GroupedColumnList from './GroupedColumnList';
import type {
    ColumnDefinition,
    ColumnSchema,
    GroupableGridProps,
    GroupByOption,
    GroupedColumnSchema,
    GroupedRow,
    GroupSettings,
    RenderRow,
} from './types';

function getColumnSchema(
    columns: ColumnDefinition[],
    displayColumns: string[] | null | undefined,
    allowSorting: boolean,
    allowGrouping: boolean,
): ColumnSchema[] {
    const isColsToRemove = !!displayColumns && displayColumns.some((c) => c.startsWith('-'));

    return columns.map((c) => {
        const {
            field,
            fieldKey = field,
            allowSorting: colSort = allowSorting,
            groupText,
            allowGrouping: colGrouping = allowGrouping,
            groupOptions,
            format,
            type,
            viewComponent,
            props: pr,
            sortValueFun,
            groupValueFunc,
        } = c;

        const id = c.id || field;

        return {
            id,
            field,
            fieldKey,
            hasPath: field?.indexOf('.') > 0,
            displayText: c.displayText || field,
            visible: !displayColumns || (isColsToRemove ? !displayColumns.includes(`-${id}`) : displayColumns.includes(id)),
            allowSorting: colSort,
            groupText,
            allowGrouping: colGrouping,
            groupOptions,
            format,
            type,
            viewComponent,
            props: pr,
            sortValueFun,
            groupValueFunc,
        };
    });
}

function getGroupedColumnSchema(
    groupBy: (string | GroupByOption)[] | null | undefined,
    allColumns: ColumnSchema[],
): GroupedColumnSchema[] | null {
    if (!Array.isArray(groupBy) || !groupBy.length) {
        return null;
    }

    const colMap = allColumns.reduce<Record<string, ColumnSchema>>((obj, col) => {
        obj[col.id] = col;
        return obj;
    }, {});

    const result = groupBy
        .map((g) => {
            let field: string = g as string;
            let id: string = g as string;
            let fieldKey: string = field;
            let sortDesc = false;
            let settings: GroupSettings | undefined;

            if (typeof g === 'object') {
                field = g.field || '';
                id = g.id || field;
                fieldKey = g.fieldKey || g.groupKey || field;
                sortDesc = !!g.sortDesc;
                settings = g.settings;
            }

            const col = colMap[id];
            if (!col) return null;

            const { displayText, allowSorting, groupOptions, type, viewComponent } = col;

            return {
                id,
                field,
                viewComponent,
                fieldKey,
                displayText,
                allowSorting,
                groupOptions,
                sortDesc,
                visible: true,
                settings,
                type,
            } as GroupedColumnSchema;
        })
        .filter(Boolean) as GroupedColumnSchema[];

    return result.length ? result : null;
}

function prepareDataForRendering(
    data: any[] | undefined,
    groupBy: GroupedColumnSchema[] | null,
    sortField: string | null | undefined,
    isDesc: boolean | undefined,
): any[] {
    if (!Array.isArray(data) || !data.length) return data || [];
    if (!groupBy || !groupBy.length) {
        return sortField ? data.sortBy(sortField, isDesc) : data;
    }
    return groupData(data, groupBy, sortField, isDesc, '');
}

function groupData(
    data: any[],
    groupBy: GroupedColumnSchema[],
    sortField: string | null | undefined,
    isDesc: boolean | undefined,
    prefix: string,
): GroupedRow[] {
    const pfx = prefix ? `${prefix}_` : '';
    if (!groupBy.length) {
        return sortField ? data.sortBy(sortField, isDesc) : data;
    }

    const [{ field, fieldKey, sortDesc, settings, type }, ...restGroupBy] = groupBy;
    const altKeyField = fieldKey && fieldKey !== field;

    const doGroupBy = (grpBy: any, keyObjFunc: ((item: any, key: any) => any) | null = null) =>
        data.groupBy(grpBy, undefined, altKeyField ? field : (keyObjFunc as any));

    let funcType = settings?.funcType;

    let resultData: Array<{ key: any; keyObj?: any; values: any[] }>;

    if (type === 'date' || type === 'datetime') {
        funcType = funcType || 'yyyy-MM (MMMM)';

        let convertFunc: (d: any) => any;
        if (funcType === 'friendly') {
            convertFunc = (d) => {
                const val = d[field];
                if (!val) return val;
                const date = new Date(val);
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (diffDays === 0) return 'Today';
                if (diffDays === 1) return 'Yesterday';
                if (diffDays < 7) return `${diffDays} days ago`;
                if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
                return `${Math.floor(diffDays / 30)} months ago`;
            };
        } else {
            convertFunc = (d) => {
                const val = d[field];
                if (!val) return val;
                const date = new Date(val);
                if (isNaN(date.getTime())) return val;
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const monthName = date.toLocaleString('default', { month: 'long' });
                return `${year}-${month} (${monthName})`;
            };
        }

        resultData = doGroupBy(convertFunc, (_, text: any) => ({ text: text || '(no date)' }));
    } else if (funcType && (type === 'number' || type === 'seconds')) {
        switch (funcType) {
            case 'sum':
                resultData = [{ key: data.sum(field), values: data }];
                break;
            case 'avg':
                resultData = [{ key: data.avg(field), values: data }];
                break;
            case 'count': {
                const count = data.count((d: any) => d[field] > 0);
                resultData = [{ key: count, keyObj: { text: `${count} has value` }, values: data }];
                break;
            }
            default:
                resultData = doGroupBy(fieldKey || field);
                break;
        }
    } else {
        const valueType = settings?.valueType;
        switch (valueType) {
            case 'count':
                resultData = [{ key: data.length, values: data }];
                break;
            case 'distinct': {
                const keyCount = data.distinct(fieldKey || field)?.length;
                resultData = [{ key: keyCount, values: data }];
                break;
            }
            default:
                resultData = doGroupBy(fieldKey || field);
                break;
        }
    }

    return resultData.sortBy('key', sortDesc).map((row, i) => ({
        key: row.key,
        keyObj: row.keyObj,
        path: pfx + i,
        rowSpan: row.values.length,
        values: groupData(row.values, restGroupBy, sortField, isDesc, pfx + i),
    }));
}

function sortGroupedData(
    data: GroupedRow[],
    groups: GroupedColumnSchema[],
    sortField: string | null | undefined,
    isDesc: boolean | undefined,
    prefix = '',
): GroupedRow[] {
    const pfx = prefix ? `${prefix}_` : '';
    if (!groups.length) {
        return sortField ? (data as any).sortBy(sortField, isDesc) : data;
    }

    const { sortDesc } = groups[0];
    const restGroups = groups.slice(1);

    return (data as any).sortBy('key', sortDesc).map((row: GroupedRow, i: number) => ({
        ...row,
        path: pfx + i,
        values: sortGroupedData(row.values as GroupedRow[], restGroups, sortField, isDesc, pfx + i),
    }));
}

type CellRendererFn = (c: ColumnSchema, ci: number) => any;

function renderFoldableGroupRow(
    g: GroupedRow,
    i: number,
    cols: ColumnSchema[],
    grpBy: GroupedColumnSchema[],
    getCellRenderer: (row: any) => CellRendererFn,
    depth = 0,
): any {
    const curGroup = grpBy[0];
    const valueType = curGroup?.settings?.valueType || 'value';
    const Component = valueType !== 'value' ? null : curGroup?.viewComponent;

    const emptyTDs = depth > 0 ? Array.from({ length: depth }, (_, di) => <td key={di} className="group-indent-td" />) : null;

    const groupKeyCell =
        grpBy.length > 0 ? (
            <tr key={g.key}>
                {emptyTDs}
                <td
                    className="group-toggler-td"
                    title={`Click to ${g.hidden ? 'expand' : 'collapse'} group`}
                    onClick={() => {
                        /* toggle handled via state in parent */
                    }}
                >
                    <span className={`fa fa-caret-${g.hidden ? 'right' : 'down'}`} />
                </td>
                <td className="group-name-td" colSpan={grpBy.length + cols.length}>
                    {Component ? (
                        <Component tag="span" count={g.rowSpan} value={g.keyObj || g.key} settings={curGroup.settings} />
                    ) : (
                        g.key || ''
                    )}
                </td>
            </tr>
        ) : null;

    let result: any;
    if (grpBy.length > 0) {
        result = (g.values as GroupedRow[]).map((r, j) =>
            renderFoldableGroupRow(r, j, cols, grpBy.slice(1), getCellRenderer, depth + 1),
        );
    } else {
        const cells = cols.map(getCellRenderer(g));
        result = (
            <tr key={i}>
                {emptyTDs}
                {cells}
            </tr>
        );
    }

    return (
        <Fragment key={i}>
            {groupKeyCell}
            {result}
        </Fragment>
    );
}

function renderGroupRow(
    g: GroupedRow,
    i: number,
    cols: ColumnSchema[],
    grpBy: GroupedColumnSchema[],
    getCellRenderer: (row: any) => CellRendererFn,
    prepend: any = null,
): any {
    const curGroup = grpBy[0];
    const valueType = curGroup?.settings?.valueType || 'value';
    const Component = valueType !== 'value' ? null : curGroup?.viewComponent;

    let groupKeyCell: any =
        grpBy.length > 0 ? (
            <td rowSpan={g.rowSpan}>
                {Component ? (
                    <Component tag="span" count={g.rowSpan} settings={curGroup?.settings} value={g.keyObj || g.key} />
                ) : (
                    g.key || ''
                )}
            </td>
        ) : null;

    if (prepend && groupKeyCell) {
        groupKeyCell = (
            <Fragment>
                {prepend}
                {groupKeyCell}
            </Fragment>
        );
    } else if (prepend && i === 0) {
        groupKeyCell = prepend;
    }

    let result: any;
    if (grpBy.length > 0) {
        result = (g.values as GroupedRow[]).map((r, j) =>
            renderGroupRow(r, j, cols, grpBy.slice(1), getCellRenderer, j === 0 && groupKeyCell),
        );
    } else {
        const cells = cols.map(getCellRenderer(g));
        result = (
            <tr key={i}>
                {groupKeyCell}
                {cells}
            </tr>
        );
    }

    return result;
}

export default function GroupableGrid({
    dataset,
    columns: columnDefs,
    displayColumns: initialDisplayColumns,
    groupBy: initialGroupBy,
    groupFoldable: initialGroupFoldable,
    allowSorting: globalSort = true,
    allowGrouping: globalGrouping = true,
    noRowsMessage,
    exportSheetName,
    sortField: initialSortField,
    isDesc: initialIsDesc,
    hideGroups,
    className,
    onChange,
}: GroupableGridProps) {
    const [showColumns, setShowColumns] = useState<boolean | null>(null);
    // Stores sort-override alongside the base data it was derived from so we can
    // invalidate it purely during render when the base data changes (no effect needed).
    const [sortOverride, setSortOverride] = useState<{ baseData: any[]; sorted: any[] } | null>(null);

    const allColumns = useMemo(
        () => getColumnSchema(columnDefs, initialDisplayColumns, globalSort, globalGrouping),
        [columnDefs, initialDisplayColumns, globalSort, globalGrouping],
    );

    const groupBySchema = useMemo(() => getGroupedColumnSchema(initialGroupBy, allColumns), [initialGroupBy, allColumns]);

    const visibleColumns = useMemo(() => {
        if (!groupBySchema?.length) {
            return allColumns.filter((c) => c.visible);
        }
        const groupByFields = groupBySchema.map((g) => g.id);
        return allColumns.filter((c) => c.visible && !groupByFields.includes(c.id));
    }, [allColumns, groupBySchema]);

    const data = useMemo(
        () => prepareDataForRendering(dataset, groupBySchema, initialSortField, initialIsDesc),
        [dataset, groupBySchema, initialSortField, initialIsDesc],
    );


    const getColGrouping = useCallback((cols: ColumnSchema[]) => {
        const grouping = cols.groupBy('groupText', (c) => c.visible).filter(({ key }) => !!key);
        return grouping.length ? grouping : undefined;
    }, []);

    const getColGroupingLen = useCallback((colGrouping: ReturnType<typeof getColGrouping>) => {
        if (!colGrouping) return undefined;
        return colGrouping.reduce<Record<string, number>>((obj, g) => {
            obj[g.key as string] = g.values.length;
            return obj;
        }, {});
    }, []);

    const getCellRenderer = useCallback(
        (row: any) => (c: ColumnSchema, ci: number) => {
            if (!c.visible) return null;

            const { field, hasPath, format, type, viewComponent: Component, props } = c;
            let value = hasPath ? getPathValue(row, field) : row[field];

            if (format && typeof format === 'function') {
                value = format(value, row, field);
            }

            if (!Component) {
                return (
                    <td key={ci} data-export-type={type}>
                        {value}
                    </td>
                );
            }

            return <Component key={ci} value={value} {...props} />;
        },
        [],
    );

    const getColumnRenderer = useCallback(
        (isGroup: boolean, colGroupingObj?: Record<string, number>) =>
            (c: ColumnSchema | GroupedColumnSchema, i: number) => {
                if (!c.visible) return null;

                let sortBy = !isGroup && c.allowSorting ? (c as ColumnSchema).fieldKey || c.field : undefined;
                let allowGrouping = c.allowGrouping;

                let rowSpan = colGroupingObj ? 2 : undefined;
                let colSpan: number | undefined;
                let displayText = c.displayText;

                if (colGroupingObj && c.groupText) {
                    displayText = c.groupText;
                    colSpan = colGroupingObj[displayText];

                    if (!colSpan) return null;

                    delete colGroupingObj[displayText];
                    rowSpan = undefined;
                    sortBy = undefined;
                    allowGrouping = false;
                }

                if (!isGroup && allowGrouping) {
                    return (
                        <Draggable key={i} containerId="groupable-grid-columns" index={i} item={c} itemType="column">
                            {({ dragRef }: any) => (
                                <Column sortBy={sortBy} rowSpan={rowSpan} colSpan={colSpan} dragRef={dragRef}>
                                    {displayText}
                                </Column>
                            )}
                        </Draggable>
                    );
                }

                return (
                    <Column key={i} sortBy={sortBy} rowSpan={rowSpan} colSpan={colSpan}>
                        {displayText}
                    </Column>
                );
            },
        [],
    );

    const getGroupColumnRenderer = useCallback(
        (hasColGroup: boolean) => (_: any, i: number) => (
            <th key={i} rowSpan={hasColGroup ? 2 : undefined} className="group-header foldable" />
        ),
        [],
    );

    const renderTableBody = useCallback(
        (cols: ColumnSchema[], grpBy: GroupedColumnSchema[] | null): RenderRow => {
            if (!grpBy || !grpBy.length) {
                return (row: any, i: number) => <tr key={i}>{cols.map(getCellRenderer(row))}</tr>;
            }

            if (initialGroupFoldable) {
                return (g: any, i: number) => renderFoldableGroupRow(g, i, cols, grpBy, getCellRenderer);
            }

            return (g: any, i: number) => renderGroupRow(g, i, cols, grpBy, getCellRenderer);
        },
        [initialGroupFoldable, getCellRenderer],
    );

    const handleSort = useCallback(
        (sortField: string, isDesc: boolean): boolean => {
            if (!groupBySchema?.length) return false;

            const sorted = sortGroupedData(data as GroupedRow[], groupBySchema, sortField, isDesc);
            setSortOverride({ baseData: data, sorted });

            onChange?.({
                groupBy: initialGroupBy as any,
                groupFoldable: initialGroupFoldable,
                displayColumns: initialDisplayColumns,
                sortField,
                isDesc,
            });

            return true;
        },
        [groupBySchema, data, onChange, initialGroupBy, initialGroupFoldable, initialDisplayColumns],
    );

    const onGroupChanged = useCallback(
        (newGroupBy: GroupedColumnSchema[], foldable: boolean, type: string) => {
            let groupByToSave: any;

            if (type !== 'mode') {
                groupByToSave = newGroupBy.map(({ id, field, fieldKey, sortDesc, settings }) => ({
                    id,
                    field,
                    fieldKey,
                    sortDesc,
                    settings,
                }));
            } else {
                groupByToSave = initialGroupBy;
            }

            onChange?.({
                groupBy: groupByToSave,
                displayColumns: initialDisplayColumns,
                groupFoldable: foldable,
                sortField: initialSortField,
                isDesc: initialIsDesc,
            });
        },
        [onChange, initialGroupBy, initialDisplayColumns, initialSortField, initialIsDesc],
    );

    const columnSelectionChanged = useCallback(
        (newDisplayColumns: string[] | null) => {
            setShowColumns(null);
            onChange?.({
                groupBy: initialGroupBy as any,
                displayColumns: newDisplayColumns,
                groupFoldable: initialGroupFoldable,
                sortField: initialSortField,
                isDesc: initialIsDesc,
            });
        },
        [onChange, initialGroupBy, initialGroupFoldable, initialSortField, initialIsDesc],
    );

    const colGroupingArr = getColGrouping(visibleColumns);
    const colGroupingObj = getColGroupingLen(colGroupingArr);

    // Clone for mutation in getColumnRenderer
    const mutableColGroupObj = colGroupingObj ? { ...colGroupingObj } : undefined;

    const bodyRenderer = renderTableBody(visibleColumns, groupBySchema);
    // Use sorted override only while it still corresponds to the current base data
    const currentData = sortOverride?.baseData === data ? sortOverride.sorted : data;

    return (
        <div className={classNames('groupable-grid', hideGroups && 'groups-hidden')}>
            {showColumns && <ColumnList onChange={columnSelectionChanged} columns={allColumns} displayColumns={initialDisplayColumns} />}
            {!hideGroups && (
                <GroupedColumnList
                    groupBy={groupBySchema || []}
                    displayColumns={initialDisplayColumns}
                    allColumns={allColumns}
                    foldable={initialGroupFoldable}
                    showColumns={showColumns}
                    onChange={onGroupChanged}
                    toggleColumns={() => setShowColumns((prev) => !prev)}
                />
            )}
            <ScrollableTable
                className={className}
                dataset={currentData}
                exportSheetName={exportSheetName}
                sortBy={initialSortField || null}
                isDesc={initialIsDesc}
                onSort={handleSort}
            >
                <THead>
                    <TRow>
                        {!!initialGroupFoldable && groupBySchema?.map(getGroupColumnRenderer(!!mutableColGroupObj))}
                        {!initialGroupFoldable && groupBySchema?.map(getColumnRenderer(true, mutableColGroupObj))}
                        {visibleColumns.map(getColumnRenderer(false, mutableColGroupObj))}
                    </TRow>
                    {colGroupingArr && <TRow>{colGroupingArr.map((g) => g.values.map(getColumnRenderer(false)))}</TRow>}
                </THead>
                <TBody>{bodyRenderer}</TBody>
                <NoDataRow span={visibleColumns.length}>{noRowsMessage}</NoDataRow>
            </ScrollableTable>
        </div>
    );
}
