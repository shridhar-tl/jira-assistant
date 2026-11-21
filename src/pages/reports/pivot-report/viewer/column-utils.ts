import { usePivotConfig } from '../store/pivot-config';
import type { PivotFieldConfig } from '../types';

import { getDefaultHeaderText } from '../utils/format-functions';

import { getCellProps, getGroupKeyComparer, getIssueFilterFunction, isEmptyValue, noValueText } from './common-utils';
import { processComputeField } from './compute-field';
import { getFilterFunction } from './filters';
import { getIssuesGroupFunction } from './group-utils';

export function processColumns(columns: any[], headerOpts: any, issues: any[], depth = -1): [number] | [number, any[]] {
    if (!columns) {
        return [0];
    }

    depth += 1;
    let count = 0;
    const hasSiblings = columns.length > 1;
    const subItems = columns.map((column) => {
        const func = (column.enableGrouping || !depth) && column.schema?.computed ? processComputeField : processColumn;
        const [childCount, child] = func(column, headerOpts, issues, depth, hasSiblings, processColumns);
        count += childCount;

        return child;
    });

    return [count, subItems];
}

function processColumn(col: any, headerOpts: any, issues: any[], depth: number, hasSiblings: boolean, processColumns: any): [number, any] {
    const { header } = headerOpts;
    const currentHeader = header[depth];
    const { key, subItems, name, headerText: customHeaderText, showTotal, showTotalFirst, ...otherProps } = col;
    const headerText = customHeaderText || getDefaultHeaderText(col);
    const cellProps = getCellProps(col);

    if (!depth) {
        otherProps.enableGrouping = true;
    }

    if (!otherProps.enableGrouping) {
        const valueObj = {
            key,
            headerText,
            ...otherProps,
            colGroup: true,
            depth,
            tagProps: {},
            cellProps,
        };

        if (hasSiblings) {
            currentHeader.push(valueObj);
            return [1, valueObj];
        }

        return [0, valueObj];
    }

    const filterFn = getFilterFunction(col.filter);
    if (filterFn) {
        issues = filterFn(issues);
    }

    const totalColumn = showTotal && {
        headerText: 'Total',
        colGroup: true,
        enableGrouping: true,
        depth,
        tagProps: {},
        columnFilterFn: filterFn,
    };

    let countOfSubColumnsUnderTotalColumn = 0;
    const childItems: any[] = [];

    if (totalColumn && showTotalFirst) {
        currentHeader.push(totalColumn);
        childItems.push(totalColumn);
        countOfSubColumnsUnderTotalColumn = generateTotalColumn(totalColumn, headerOpts, subItems, depth, issues);
    }

    const colGroupFn = getIssuesGroupFunction(col)!;
    let colSpan = 0;

    colGroupFn(issues, (value: any, subIssues: any[], grpKey: any) => {
        const headerObj = {
            key,
            ...otherProps,
            colGroup: true,
            depth,
            colGroupFn,
            columnFilterFn: filterFn,
            groupFilterFn: getGroupKeyComparer(grpKey),
            issueFilterFn: getIssueFilterFunction(col, grpKey),
            value,
            ...(isEmptyValue(value) ? { headerText: noValueText } : cellProps),
            tagProps: {},
        };

        currentHeader.push(headerObj);

        const [childCount, child] = processColumns(subItems, headerOpts, subIssues, depth);
        if (childCount) {
            headerObj.tagProps.colSpan = childCount;
        }
        if (child) {
            headerObj.subItems = child.flat();
        }

        colSpan += childCount;

        childItems.push(headerObj);
    });

    if (totalColumn && !showTotalFirst) {
        currentHeader.push(totalColumn);
        childItems.push(totalColumn);
        countOfSubColumnsUnderTotalColumn = generateTotalColumn(totalColumn, headerOpts, subItems, depth, issues);
    }

    return [colSpan ? colSpan + countOfSubColumnsUnderTotalColumn : childItems.length, childItems];
}

interface SpannedHeaderCell {
    tagProps?: { rowSpan?: number };
    subItems?: unknown;
}

function childCellsOf(cell: SpannedHeaderCell): unknown[] {
    return Array.isArray(cell.subItems) ? cell.subItems.flat(Infinity) : [];
}

export function spanLeafHeaders(header: SpannedHeaderCell[][]) {
    const headerCells = new Set<unknown>(header.flat());

    header.forEach((row, rowIndex) => {
        const rowSpan = header.length - rowIndex;
        row.forEach((cell) => {
            if (rowSpan > (cell.tagProps?.rowSpan || 1) && !childCellsOf(cell).some((child) => headerCells.has(child))) {
                cell.tagProps = { ...cell.tagProps, rowSpan };
            }
        });
    });
}

export function getMaxDepth() {
    const { fields } = usePivotConfig.getState();
    const columns = fields.filter((f) => f.colGroup);

    return columns.reduce((maxDepth, column) => Math.max(maxDepth, getColumnDepth(column, 1, false, true)), 1);
}

function generateTotalColumn(totalColumn: any, headerOpts: any, subItems: any[], depth: number, issues: any[]) {
    const [childCount, child] = processColumns(subItems, headerOpts, issues, depth);

    if (childCount) {
        totalColumn.tagProps.colSpan = childCount;
    }

    if (child) {
        totalColumn.subItems = child.flat();
    }

    return childCount || 1;
}

function getColumnDepth(col: PivotFieldConfig, curDepth: number, occupiesRow: boolean, isTopLevel?: boolean): number {
    const { subItems, enableGrouping, schema } = col;
    const depth = curDepth + (occupiesRow ? 1 : 0) + (schema?.computed && schema.depth ? schema.depth : 0);

    if (!subItems?.length || (!isTopLevel && !enableGrouping)) {
        return depth;
    }

    const hasSiblings = subItems.length > 1;

    return subItems.reduce(
        (maxDepth, item) => Math.max(maxDepth, getColumnDepth(item, depth, hasSiblings || !!item.enableGrouping)),
        depth,
    );
}
