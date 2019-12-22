import React, { PureComponent } from 'react';
import { ScrollableTable, THead, TRow, Column, TBody, NoDataRow } from '../../components/ScrollableTable';

class FlatDataGrid extends PureComponent {
    render() {
        const { props: { formatDateTime, convertSecs, flatData, pageSettings: { hideEstimate } } } = this;

        return (
            <ScrollableTable dataset={flatData} exportSheetName="Flat Worklogs">
                <THead>
                    <TRow>
                        <Column sortBy="groupName">Group Name</Column>
                        <Column sortBy="projectName">Project Name</Column>
                        <Column sortBy="issueType">Type</Column>
                        <Column sortBy="epicDisplay">Epic</Column>
                        <Column sortBy="parent">Parent</Column>
                        <Column sortBy="ticketNo">Ticket No</Column>
                        <Column sortBy="statusName">Status</Column>
                        <Column sortBy="summary">Summary</Column>
                        <Column sortBy="logTime">Log Date & Time</Column>
                        <Column sortBy="userDisplay">User</Column>
                        <Column sortBy="timeSpent">Hr. Spent</Column>
                        {!hideEstimate && <Column sortBy="originalestimate">Ori. Estm.</Column>}
                        {!hideEstimate && <Column sortBy="totalLogged">Total Worklogs</Column>}
                        {!hideEstimate && <Column sortBy="remainingestimate">Rem. Estm.</Column>}
                        {!hideEstimate && <Column sortBy="estVariance">Estm. Variance</Column>}
                        <Column sortBy="comment">Comment</Column>
                    </TRow>
                </THead>
                <TBody>
                    {(row, i) => <tr key={i}>
                        <td>{row.groupName}</td>
                        <td>{row.projectName}</td>
                        <td>{row.issueType}</td>
                        <td>{row.epicDisplay && <a href={row.epicUrl} className="link" target="_blank" rel="noopener noreferrer">{row.epicDisplay}</a>}</td>
                        <td>{row.parent && <a href={row.parentUrl} className="link" target="_blank" rel="noopener noreferrer">{row.parent}</a>}</td>
                        <td><a href={row.ticketUrl} className="link" target="_blank" rel="noopener noreferrer">{row.ticketNo}</a></td>
                        <td>{row.statusName}</td>
                        <td>{row.summary}</td>
                        <td>{formatDateTime(row.logTime)}</td>
                        <td>{row.userDisplay}</td>
                        <td>{convertSecs(row.timeSpent)}</td>
                        {!hideEstimate && <td>{convertSecs(row.originalestimate)}</td>}
                        {!hideEstimate && <td>{convertSecs(row.totalLogged)}</td>}
                        {!hideEstimate && <td>{convertSecs(row.remainingestimate)}</td>}
                        {!hideEstimate && <td>{row.estVariance > 0 ? "+" : null}{convertSecs(row.estVariance)}</td>}
                        <td>{row.comment}</td>
                    </tr>}
                </TBody>
                <NoDataRow span={11}>No worklog details available</NoDataRow>
            </ScrollableTable>
        );
    }
}

export default FlatDataGrid;