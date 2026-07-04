import { formatValue } from '../utils/format-functions';

import { flattenDerivedFields, getAggregatedDerivedFieldValue } from './compute-field';

export function handleRowConfig(issues: any[], cells: any[]) {
    const [firstCell, ...others] = cells;

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

function handleColGroups(cells: any[], issues: any[]): any {
    let transformedIssues = issues;
    let transformFn: any = null;
    let groupedIssues = issues;
    let colGroupFn: any = null;

    return cells.flatMap((cell) => {
        if (cell.transformFn && transformFn !== cell.transformFn && issues.length) {
            transformFn = cell.transformFn;
            transformedIssues = transformFn(issues, cell);
            groupedIssues = transformedIssues;
        } else if (!cell.transformFn) {
            transformedIssues = issues;
        }

        if (cell.colGroupFn && colGroupFn !== cell.colGroupFn) {
            colGroupFn = cell.colGroupFn;
            groupedIssues = colGroupFn(transformedIssues, (_: any, values: any, key: any) => ({ key, values }));
        } else if (!cell.colGroupFn) {
            groupedIssues = transformedIssues;
        }

        return filterAndHandleGroupedCell(cell, groupedIssues);
    });
}

function filterAndHandleGroupedCell(cell: any, groupedIssues: any): any {
    const filteredIssues = !cell.groupFilterFn ? groupedIssues : groupedIssues.filter(cell.groupFilterFn)[0]?.values || [];

    return handleFilteredCellConfig(cell, filteredIssues);
}

function handleAggregatedCell(cell: any, issues: any[], cells: any[]) {
    const result = getAggregatedCellValue(cell, issues);

    if (cells.length) {
        result.subRows = handleRowConfig(issues, cells);
    }

    return [result];
}

function handleRowGroupedCellConfig(cell: any, issues: any[], cells: any[]) {
    return cell.groupFn(issues, (value: any, issues: any[]) => {
        const result = { ...cell.cellProps, value };

        if (cells.length) {
            result.subRows = handleRowConfig(issues, cells);
        }

        return result;
    });
}

function handleFlatRowConfig(issues: any[], cells: any[]) {
    let derivedCells: any = null;
    const flatRows: any[] = [];

    for (const issue of issues) {
        const cellValues: any[] = [];

        for (let cellIdx = 0; cellIdx < cells.length; cellIdx++) {
            const cell = cells[cellIdx];
            if (cell.enableGrouping) {
                const remainingCells = cells.slice(cellIdx);
                const lastCell = cellValues[cellValues.length - 1];
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
                break;
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

function handleFlatCellConfig(cell: any, issue: any) {
    const isMatching = cell.issueFilterFn ? cell.issueFilterFn(issue) : true;
    const result = handleFilteredCellConfig(cell, isMatching ? [issue] : []);

    return result;
}

function handleFilteredCellConfig(cell: any, filteredIssues: any[]): any {
    if (cell.enableGrouping && cell.subItems) {
        return handleColGroups(cell.subItems, filteredIssues).flat();
    } else if (cell.colGroup) {
        return getAggregatedCellValue(cell, filteredIssues);
    } else {
        return getFlatCellValue(cell, filteredIssues);
    }
}

function getAggregatedCellValue(cell: any, issues: any[]) {
    const value = cell.schema?.derived ? getAggregatedDerivedFieldValue(cell, issues) : formatValue(cell, issues);

    return { ...cell.cellProps, value };
}

function getFlatCellValue(cell: any, issues: any[]) {
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
