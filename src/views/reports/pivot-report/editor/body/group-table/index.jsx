import React from 'react';
import { ScrollableTable, TBody, THead } from '../../../../../../components/ScrollableTable';
import { usePivotConfig, useReportData } from '../../../store/pivot-config';
import './GroupTable.scss';

function GroupTable() {
    const reportName = usePivotConfig(({ queryName }) => queryName);
    const reportData = useReportData(({ reportData }) => reportData);

    return (<div className="group-table-container">
        <ScrollableTable className="group-table table-bordered" exportSheetName={reportName}>
            <TableSection rows={reportData.header} tag={THead} isHeader />
            <TableSection rows={reportData.body} tag={TBody} />
        </ScrollableTable>
    </div>);
}

export default GroupTable;

function TableSection({ tag: Tag, isHeader, rows }) {
    return (<Tag>
        {rows.map((cells, i) => <TableRow key={i} isHeader={isHeader} cells={cells} />)}
    </Tag>);
}

function TableRow({ isHeader, cells }) {
    return (<tr>
        {cells.map((cell, i) => <TableCell key={i} isHeader={isHeader} cell={cell} />)}
    </tr>);
}

function TableCell({ isHeader, cell }) {
    const TagName = isHeader ? 'th' : 'td';
    const { value, headerText, tagProps, renderer: { Component, props: cProps } = {} } = cell;

    if (Component) {
        return (<Component {...cProps} value={value} tag={TagName} tagProps={tagProps} />);
    } else {
        const displayText = (isHeader ? headerText : value) || ' ';

        return (<TagName {...tagProps}>{displayText}</TagName>);
    }
}