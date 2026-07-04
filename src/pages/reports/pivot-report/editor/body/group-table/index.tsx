import { ScrollableTable, TBody, THead } from '@components';

import { usePivotConfig, useReportData } from '../../../store/pivot-config';
import type { ReportCell } from '../../../types';

import './GroupTable.css';

export default function GroupTable() {
    const reportName = usePivotConfig(({ queryName }) => queryName);
    const reportData = useReportData(({ reportData }) => reportData);

    if (!reportData) {
        return null;
    }

    return (
        <div className="h-full overflow-auto">
            <ScrollableTable className="pivot-group-table" exportSheetName={reportName}>
                <TableSection rows={reportData.header} tag={THead} isHeader />
                <TableSection rows={reportData.body} tag={TBody} />
            </ScrollableTable>
        </div>
    );
}

interface TableSectionProps {
    tag: any;
    isHeader?: boolean;
    rows: ReportCell[][] | ReportCell[][][];
}

function TableSection({ tag: Tag, isHeader, rows }: TableSectionProps) {
    return (
        <Tag>
            {rows.map((cells, i) => (
                <TableRow key={i} isHeader={isHeader} cells={cells as ReportCell[]} />
            ))}
        </Tag>
    );
}

interface TableRowProps {
    isHeader?: boolean;
    cells: ReportCell[];
}

function TableRow({ isHeader, cells }: TableRowProps) {
    return (
        <tr>
            {cells.map((cell, i) => (
                <TableCell key={i} isHeader={isHeader} cell={cell} />
            ))}
        </tr>
    );
}

interface TableCellProps {
    isHeader?: boolean;
    cell: ReportCell;
}

function TableCell({ isHeader, cell }: TableCellProps) {
    const TagName = isHeader ? 'th' : 'td';
    const { value, headerText, tagProps, renderer } = cell;
    const { Component, props: cProps } = renderer || {};

    if (Component) {
        return <Component {...cProps} value={value} tag={TagName} tagProps={tagProps} />;
    } else {
        const displayText = (isHeader ? headerText : value) || ' ';

        return <TagName {...tagProps}>{displayText}</TagName>;
    }
}
