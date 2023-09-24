import { formatValue } from "../utils/format-functions";
import { flattenDerivedFields, getAggregatedDerivedFieldValue } from "./compute-field";

export function handleRowConfig(issues, cells) {
    const [firstCell, ...others] = cells;

    // This filter is based on query provided by user
    if (firstCell.preGroupFilter) {
        issues = firstCell.preGroupFilter(issues);
    }

    if (firstCell.colGroup) {
        return [handleColGroups(cells, issues)];
    } else {
        if (firstCell.enableGrouping) {
            return handleRowGroupedCellConfig(firstCell, issues, others);
        } else if (firstCell.agrFunc) {
            return handleAggregatedCell(firstCell, issues, others);
        } else {
            return handleFlatRowConfig(issues, cells);
        }
    }
}

//#region Column grouping related functions

function handleColGroups(cells, issues) {
    let transformedIssues = issues, transformFn = null;
    let groupedIssues = issues, colGroupFn = null;

    return cells.flatMap(cell => {
        if (cell.transformFn && transformFn !== cell.transformFn && issues.length) {
            transformFn = cell.transformFn;
            transformedIssues = transformFn(issues, cell);
            groupedIssues = transformedIssues;
        } else if (!cell.transformFn) {
            transformedIssues = issues;
        }

        if (cell.colGroupFn && colGroupFn !== cell.colGroupFn) {
            colGroupFn = cell.colGroupFn;
            groupedIssues = colGroupFn(transformedIssues, (_, values, key) => ({ key, values }));
        } else if (!cell.colGroupFn) {
            groupedIssues = transformedIssues;
        }

        return filterAndHandleGroupedCell(cell, groupedIssues);
    });
}

// When grouped issues is sent to this function, it will pick appropriate group based on key
function filterAndHandleGroupedCell(cell, groupedIssues) {
    const filteredIssues = !cell.groupFilterFn ? groupedIssues : groupedIssues.filter(cell.groupFilterFn)[0]?.values || [];

    return handleFilteredCellConfig(cell, filteredIssues);
}

//#endregion

//#region Row Grouping related functions

function handleAggregatedCell(cell, issues, cells) {
    const result = getAggregatedCellValue(cell, issues);

    if (cells.length) {
        result.subRows = handleRowConfig(issues, cells);
    }

    return [result];
}

function handleRowGroupedCellConfig(cell, issues, cells) {
    return cell.groupFn(issues, (value, issues) => {
        const result = { ...cell.cellProps, value };

        if (cells.length) {
            result.subRows = handleRowConfig(issues, cells);
        }

        return result;
    });
}

function handleFlatRowConfig(issues, cells) {
    let derivedCells = null;
    const flatRows = [];

    for (const issue of issues) {
        const cellValues = [];

        for (let cellIdx = 0; cellIdx < cells.length; cellIdx++) {
            const cell = cells[cellIdx];
            if (cell.enableGrouping) { // Grouping would be allowed here only if it is sub array / derived type of cell
                const remainingCells = cells.slice(cellIdx);
                const lastCell = cellValues[cellValues.length - 1]; // Always at least one cell would be available before we reach grouped cell
                lastCell.subRows = handleRowConfig([issue], remainingCells);
                break;
            }

            const resultCell = handleFlatCellConfig(cell, issue);


            if (Array.isArray(resultCell)) {
                if (cell.colGroup) {
                    cellValues.push(...resultCell);
                    continue;
                }

                if (!derivedCells) {
                    derivedCells = cells.slice(cellIdx);
                }
                const subRows = handleFlatRowConfig(resultCell, derivedCells);

                const lastCell = cellValues.length ? cellValues[cellValues.length - 1] : null;
                if (lastCell) {
                    lastCell.subRows = subRows;
                } else {
                    flatRows.push(...subRows);
                }
                break; // Rest of the cells are already handled and hence break this loop
            } else {
                cellValues.push(resultCell);
            }
        }

        if (cellValues.length) {
            flatRows.push(cellValues);
        }
    }

    return flatRows;
}

function handleFlatCellConfig(cell, issue) {
    const isMatching = cell.issueFilterFn ? cell.issueFilterFn(issue) : true;
    const result = handleFilteredCellConfig(cell, isMatching ? [issue] : []);

    return result;
}


function handleFilteredCellConfig(cell, filteredIssues) {
    if (cell.enableGrouping && cell.subItems) {
        return handleColGroups(cell.subItems, filteredIssues).flat();
    } else if (cell.colGroup) {
        return getAggregatedCellValue(cell, filteredIssues);
    } else {
        return getFlatCellValue(cell, filteredIssues);
    }
}

function getAggregatedCellValue(cell, issues) {
    const value = (cell.schema?.derived)
        ? getAggregatedDerivedFieldValue(cell, issues)
        : formatValue(cell, issues);

    return { ...cell.cellProps, value };
}

function getFlatCellValue(cell, issues) {
    if (cell.schema?.derived) {
        const flattenedIssuesSet = flattenDerivedFields(cell, issues);
        if (!flattenedIssuesSet.length) {
            return { ...cell.cellProps, value: null };
        } else if (flattenedIssuesSet.length === 1) {
            return { ...cell.cellProps, value: getAggregatedDerivedFieldValue(cell, flattenedIssuesSet) };
        } else {
            return flattenedIssuesSet;
        }
    } else {
        return { ...cell.cellProps, value: formatValue(cell, issues) };
    }
}