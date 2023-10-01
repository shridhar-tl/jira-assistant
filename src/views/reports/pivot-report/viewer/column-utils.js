import { usePivotConfig } from "../store/pivot-config";
import { getGroupKeyComparer, getIssueFilterFunction, getCellProps } from "./common-utils";
import { processComputeField } from './compute-field';
import { getFilterFunction } from "./filters";
import { getIssuesGroupFunction } from "./group-utils";

export function processColumns(columns, headerOpts, issues, depth = -1) {
    if (!columns) { return [0]; }

    depth += 1;
    let count = 0;
    const hasSiblings = columns.length > 1;
    const subItems = columns.map(column => {
        const func = (column.enableGrouping || !depth) && column.schema?.computed ? processComputeField : processColumn;
        const [childCount, child] = func(column, headerOpts, issues, depth, hasSiblings, processColumns);
        count += childCount;

        return child;
    });

    return [count, subItems];
}

function processColumn(col, headerOpts, issues, depth, hasSiblings, processColumns) {
    const { header } = headerOpts;
    const currentHeader = header[depth];
    const { key, subItems, name, headerText = name, showTotal, showTotalFirst, ...otherProps } = col;
    const cellProps = getCellProps(col);

    if (!depth) {
        otherProps.enableGrouping = true;
    }

    if (!otherProps.enableGrouping) {
        const valueObj = {
            key, headerText, ...otherProps, colGroup: true, depth,
            tagProps: {}, cellProps
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
        tagProps: {}
    };

    let countOfSubColumnsUnderTotalColumn = 0;
    const childItems = [];

    if (totalColumn && showTotalFirst) {
        currentHeader.push(totalColumn);
        childItems.push(totalColumn);
        countOfSubColumnsUnderTotalColumn = generateTotalColumn(totalColumn, headerOpts, subItems, depth, issues);
    }

    const colGroupFn = getIssuesGroupFunction(col);
    let colSpan = 0;

    colGroupFn(issues, (value, subIssues, grpKey) => {
        const headerObj = {
            key, ...otherProps, colGroup: true, depth, colGroupFn,
            // This function would be used to pick appropriate group, when grouping is enabled in previous row field
            groupFilterFn: getGroupKeyComparer(grpKey),
            issueFilterFn: getIssueFilterFunction(col, grpKey),
            value, ...cellProps,
            tagProps: {}
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

export function getMaxDepth() {
    const { fields } = usePivotConfig.getState();
    const columns = fields.filter(f => f.colGroup);
    return iterateAndFindDepth({ subItems: columns, enableGrouping: true });
}

function generateTotalColumn(totalColumn, headerOpts, subItems, depth, issues) {
    const [childCount, child] = processColumns(subItems, headerOpts, issues, depth);

    if (childCount) {
        totalColumn.tagProps.colSpan = childCount;
    }

    if (child) {
        totalColumn.subItems = child.flat();
    }

    return childCount || 1;
}

function iterateAndFindDepth(col, hasSibling, curDepth = 0, maxDepth = 1) {
    const { subItems, enableGrouping, schema = {} } = col;

    if (schema.computed && schema.depth) {
        curDepth += schema.depth;
    } else if (enableGrouping || hasSibling) {
        curDepth += 1;
    }

    if (!subItems?.length) {
        return maxDepth > curDepth ? maxDepth : curDepth;
    }

    const hasManyChild = subItems.length > 1;

    const newMaxDepth = subItems.reduce((maxDepth, item) => iterateAndFindDepth(item, hasManyChild, curDepth, maxDepth), curDepth);

    return maxDepth > newMaxDepth ? maxDepth : newMaxDepth;
}
