export default function flattenRows(reportGroup, result = []) {
    for (const grp of reportGroup) {
        result.push([]);
        handleItem(grp, result);
    }

    return result;
}

function handleItem(item, result) {
    if (Array.isArray(item)) {
        handleRow(item, result);
    } else {
        handleCell(item, result);
    }
}

function handleRow(row, result) {
    row.forEach(cell => handleCell(cell, result));
}

function handleCell(cell, result) {
    const { subRows, ...cellInfo } = cell;
    const startRowCount = result.length;
    const curRow = result[startRowCount - 1];

    curRow.push(cellInfo);

    if (subRows?.length) {
        subRows.forEach((row, i) => {
            if (i) {
                result.push([]);
            }

            handleItem(row, result);
        });
    }
    const rowSpan = (result.length - startRowCount) + 1;

    if (rowSpan > 1) {
        cellInfo.tagProps = { rowSpan };
    }
}