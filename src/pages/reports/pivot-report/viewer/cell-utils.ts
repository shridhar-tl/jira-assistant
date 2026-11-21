import type { FieldSchema, SortOrder } from '../types';
import { formatValue } from '../utils/format-functions';

import { isEmptyValue, noValueText } from './common-utils';
import { flattenDerivedFields, getAggregatedDerivedFieldValue } from './compute-field';
import { sortItems, type SortKey } from './sort-utils';

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
            groupedIssues = colGroupFn(filterColumnIssues(cell, transformedIssues), (_: any, values: any, key: any) => ({ key, values }));
        } else if (!cell.colGroupFn) {
            groupedIssues = filterColumnIssues(cell, transformedIssues);
        }

        return filterAndHandleGroupedCell(cell, groupedIssues);
    });
}

function filterColumnIssues(cell: { columnFilterFn?: (issues: ReportIssue[]) => ReportIssue[] }, issues: ReportIssue[]) {
    return cell.columnFilterFn ? cell.columnFilterFn(issues) : issues;
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

type ReportIssue = Record<string, unknown>;

interface RowCellConfig {
    key: string;
    agrFunc?: string;
    sortOrder?: SortOrder;
    enableGrouping?: boolean;
    colGroup?: boolean;
    showTotal?: boolean;
    schema?: FieldSchema;
    cellProps?: object;
    groupFn?: <T>(issues: ReportIssue[], callback: (value: unknown, issues: ReportIssue[]) => T) => T[];
    preGroupFilter?: (issues: ReportIssue[]) => ReportIssue[];
}

interface IssueGroup {
    value: unknown;
    issues: ReportIssue[];
}

function getGroupSortKeys(cell: RowCellConfig, cells: RowCellConfig[]): SortKey<IssueGroup>[] {
    if (cell.sortOrder) {
        return [{ valueOf: (group) => group.value, order: cell.sortOrder }];
    }

    const nextGroupIndex = cells.findIndex((c) => c.enableGrouping || c.colGroup);
    const groupCells = nextGroupIndex === -1 ? cells : cells.slice(0, nextGroupIndex);

    return groupCells
        .filter((c): c is RowCellConfig & { sortOrder: SortOrder } => !!c.agrFunc && !!c.sortOrder)
        .map((c) => ({ valueOf: (group) => getAggregatedCellValue(c, group.issues).value, order: c.sortOrder }));
}

const totalRowText = 'Total';
const totalCellProps = { 'data-total-row': 'true' };

function asTotalCell(cell: object) {
    return { ...cell, tagProps: totalCellProps };
}

function mergeDerivedGroups(cell: RowCellConfig, groups: IssueGroup[]): ReportIssue[] {
    const [path] = cell.key.split('.');
    const issuesMap = new Map<unknown, ReportIssue>();

    for (const group of groups) {
        for (const issue of group.issues) {
            const items = issue[path] as unknown[];
            const existing = issuesMap.get(issue.issuekey);
            if (existing) {
                existing[path] = [...(existing[path] as unknown[]), ...items];
            } else {
                issuesMap.set(issue.issuekey, { ...issue, [path]: [...items] });
            }
        }
    }

    return [...issuesMap.values()];
}

function getTotalRow(cell: RowCellConfig, groups: IssueGroup[], issues: ReportIssue[], cells: RowCellConfig[]): object[] {
    let totalIssues = cell.schema?.derived && cell.key.includes('.') ? mergeDerivedGroups(cell, groups) : issues;
    const totalRow: object[] = [asTotalCell({ value: totalRowText })];

    for (let cellIdx = 0; cellIdx < cells.length; cellIdx++) {
        const curCell = cells[cellIdx];

        if (curCell.colGroup) {
            const columnCells: object[] = handleColGroups(cells.slice(cellIdx), totalIssues);
            totalRow.push(...columnCells.map(asTotalCell));
            break;
        }

        if (curCell.enableGrouping && curCell.preGroupFilter) {
            totalIssues = curCell.preGroupFilter(totalIssues);
        }

        const isAggregated = !curCell.enableGrouping && curCell.agrFunc;
        totalRow.push(asTotalCell(isAggregated ? getAggregatedCellValue(curCell, totalIssues) : { value: null }));
    }

    return totalRow;
}

function handleRowGroupedCellConfig(cell: RowCellConfig, issues: ReportIssue[], cells: RowCellConfig[]) {
    const groups = cell.groupFn!<IssueGroup>(issues, (value, issues) => ({ value, issues }));

    const result: object[] = sortItems(groups, getGroupSortKeys(cell, cells)).map(({ value, issues }) => {
        const groupCell: { value: unknown; subRows?: unknown } = isEmptyValue(value) ? { value: noValueText } : { ...cell.cellProps, value };

        if (cells.length) {
            groupCell.subRows = handleRowConfig(issues, cells);
        }

        return groupCell;
    });

    if (cell.showTotal && groups.length) {
        result.push(getTotalRow(cell, groups, issues, cells));
    }

    return result;
}

function getListSortKeys(cells: RowCellConfig[]): SortKey<ReportIssue>[] {
    const nextGroupIndex = cells.findIndex((c) => c.enableGrouping);
    const listedCells = nextGroupIndex === -1 ? cells : cells.slice(0, nextGroupIndex);

    return listedCells
        .filter((c): c is RowCellConfig & { sortOrder: SortOrder } => !!c.sortOrder && !c.colGroup && !c.agrFunc)
        .map((c) => ({ valueOf: (issue) => getSortValueOfIssue(c, issue), order: c.sortOrder }));
}

function getSortValueOfIssue(cell: RowCellConfig, issue: ReportIssue) {
    return cell.schema?.derived ? getAggregatedDerivedFieldValue(cell, [issue]) : formatValue(cell, [issue]);
}

function handleFlatRowConfig(issues: any[], cells: any[]) {
    let derivedCells: any = null;
    const flatRows: any[] = [];

    for (const issue of sortItems(issues, getListSortKeys(cells))) {
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
    const isInColumn = !cell.columnFilterFn || cell.columnFilterFn([issue]).length > 0;
    const isMatching = isInColumn && (cell.issueFilterFn ? cell.issueFilterFn(issue) : true);
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
