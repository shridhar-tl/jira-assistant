export default function flattenRows(reportGroup: any[], result: any[][] = []) {
    for (const grp of reportGroup) {
        result.push([]);
        handleItem(grp, result);
    }

    return result;
}

function handleItem(item: any, result: any[][]) {
    if (Array.isArray(item)) {
        handleRow(item, result);
    } else {
        handleCell(item, result);
    }
}

function handleRow(row: any[], result: any[][]) {
    row.forEach((cell) => handleCell(cell, result));
}

function handleCell(cell: any, result: any[][]) {
    const { subRows, ...cellInfo } = cell;
    const startRowCount = result.length;
    const curRow = result[startRowCount - 1];

    const curCellIndex = curRow.length;
    curRow.push(cellInfo);

    if (subRows?.length) {
        subRows.forEach((row: any, i: number) => {
            if (i) {
                result.push([]);
            }

            handleItem(row, result);
        });
    }
    const rowSpan = result.length - startRowCount + 1;

    if (rowSpan > 1) {
        cellInfo.tagProps = { rowSpan };

        if (curCellIndex) {
            // If row span is added in the middle of row, then it could be because of using a field which is an array.
            // In such case need to set the row span for all the previous cells as well
            for (let i = curCellIndex - 1; i >= 0; i--) {
                const curCell = curRow[i];

                if (!curCell.tagProps) {
                    curCell.tagProps = { rowSpan };
                } else if (curCell.tagProps.rowSpan < rowSpan) {
                    curCell.tagProps.rowSpan = rowSpan;
                }
            }
        }
    }
}
