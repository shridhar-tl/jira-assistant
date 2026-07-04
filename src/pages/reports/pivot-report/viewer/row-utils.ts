import { isAggregated } from '../utils/format-functions';

import { handleRowConfig } from './cell-utils';
import { getCellProps } from './common-utils';
import { getFilterFunction } from './filters';
import flattenRows from './flatten-rows';
import { getIssuesGroupFunction } from './group-utils';

export function processRowField(row: any, prevRow: any, result: any, rowSpan: number) {
    prevRow = processRowGroupHeader(row, { rowSpan }, prevRow);
    result.header[0].push(prevRow);

    return prevRow;
}

export function generateRowGroupBody(result: any, issues: any[]) {
    const { header } = result;
    const [firstHeaderRow] = header;
    const reportGroup = handleRowConfig(issues, firstHeaderRow);
    result.body = flattenRows(reportGroup);
}

function processRowGroupHeader(row: any, tagProps: any, prevColumn: any) {
    const { id, key, name, headerText = name, enableGrouping, agrFunc, ...others } = row;

    const result: any = {
        id,
        key,
        tagProps,
        headerText: headerText || name,
        cellProps: getCellProps(row),
        ...others,
    };

    if (agrFunc && isAggregated(row)) {
        result.agrFunc = agrFunc;
    }

    if (enableGrouping && (!prevColumn || prevColumn.enableGrouping || row.schema?.isArray)) {
        result.enableGrouping = true;
        result.groupFn = getIssuesGroupFunction(row);
        result.preGroupFilter = getFilterFunction(row.filter);
    }

    return result;
}
