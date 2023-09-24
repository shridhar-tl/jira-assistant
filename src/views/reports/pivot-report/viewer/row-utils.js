import { getCellProps } from './common-utils';
import { handleRowConfig } from './cell-utils';
import { isAggregated } from '../utils/format-functions';
import flattenRows from './flatten-rows';
import { getFilterFunction } from './filters';
import { getIssuesGroupFunction } from './group-utils';

export function processRowField(row, prevRow, result, rowSpan) {
    prevRow = processRowGroupHeader(row, { rowSpan }, prevRow);
    result.header[0].push(prevRow);

    return prevRow;
}

export function generateRowGroupBody(result, issues) {
    const { header } = result;
    const [firstHeaderRow] = header;
    const reportGroup = handleRowConfig(issues, firstHeaderRow);
    result.body = flattenRows(reportGroup);
}

function processRowGroupHeader(row, tagProps, prevColumn) {
    const { id, key, name, headerText = name, enableGrouping, agrFunc, ...others } = row;

    const result = {
        id,
        key,
        tagProps,
        headerText: headerText || name,
        cellProps: getCellProps(row),
        ...others
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
