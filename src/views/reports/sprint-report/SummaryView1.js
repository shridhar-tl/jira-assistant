import React, { PureComponent } from 'react';
import { ScrollableTable, THead, TBody } from "../../../components/ScrollableTable";

class SummaryView1 extends PureComponent {
    render() {
        const { sprintDetails, formatDateTime } = this.props;

        return (
            <ScrollableTable dataset={sprintDetails} className="no-full-width data-center exportable" exportSheetName="Summary view 1">
                <THead>
                    <tr>
                        <th rowSpan={2} colSpan={2}>Sprint details</th>
                        <th colSpan={sprintDetails.length}>Sprints</th>
                    </tr>
                    <tr>
                        {sprintDetails.map((sprint, i) => <th key={i} style={{ width: 200 }}>{sprint.sprint.name}</th>)}
                    </tr>
                </THead>
                <TBody>
                    <tr>
                        <td colSpan={2} className="data-left">Start date</td>
                        {sprintDetails.map((sprint, i) => <td key={i}>{formatDateTime(sprint.sprint.startDate)}</td>)}
                    </tr>
                    <tr>
                        <td colSpan={2} className="data-left">Completed date</td>
                        {sprintDetails.map((sprint, i) => <td key={i}>{formatDateTime(sprint.sprint.completeDate)}</td>)}
                    </tr>
                    <tr>
                        <td colSpan={2} className="data-left">Current status</td>
                        {sprintDetails.map((sprint, i) => <td key={i}>{sprint.sprint.state}</td>)}
                    </tr>
                    <tr>
                        <td colSpan={2} className="data-left">Closed by</td>
                        {sprintDetails.map((sprint, i) => <td key={i} dangerouslySetInnerHTML={{ __html: sprint.lastUserToClose }}></td>)}
                    </tr>
                    <tr>
                        <td rowSpan={4} className="brdr-btm-dbl">Estimated</td>
                        <td className="data-left">Story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int" exportvalue={sprint.estimateIssuesSP}>
                            {sprint.estimateIssuesSPOld && <span>{sprint.estimateIssuesSPOld} <i className="fa fa-arrow-right" /></span>}
                            {sprint.estimateIssuesSP}
                        </td>)}
                    </tr>
                    <tr>
                        <td className="data-left">Ticket count with story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int">{sprint.estimateIssuesWithSP}</td>)}
                    </tr>
                    <tr>
                        <td className="data-left">Ticket count without story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int">{sprint.estimateIssuesCount - sprint.estimateIssuesWithSP}</td>)}
                    </tr>
                    <tr>
                        <td className="brdr-btm-dbl data-left">Total ticket count (with + without) story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} className="brdr-btm-dbl" exporttype="int">{sprint.estimateIssuesCount}</td>)}
                    </tr>
                    <tr>
                        <td rowSpan={4} className="brdr-btm-dbl">Total</td>
                        <td className="data-left">Story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int" exportvalue={sprint.totalIssuesSP}>
                            {sprint.totalIssuesSPOld && <span>{sprint.totalIssuesSPOld} <i className="fa fa-arrow-right" /></span>}
                            {sprint.totalIssuesSP}</td>)}
                    </tr>
                    <tr>
                        <td className="data-left">Ticket count with story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int">{sprint.totalIssuesWithSP}</td>)}
                    </tr>
                    <tr>
                        <td className="data-left">Ticket count without story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int">{sprint.totalIssuesCount - sprint.totalIssuesWithSP}</td>)}
                    </tr>
                    <tr>
                        <td className="data-left brdr-btm-dbl">Total ticket count (with + without) story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} className="brdr-btm-dbl" exporttype="int">{sprint.totalIssuesCount}</td>)}
                    </tr>
                    <tr>
                        <td rowSpan={4} className="brdr-btm-dbl">Completed</td>
                        <td className="data-left">Story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exportvalue={sprint.completedSP} exporttype="int">
                            {sprint.completedSPOld && <span>{sprint.completedSPOld} <i className="fa fa-arrow-right" /></span>}
                            {sprint.completedSP}
                        </td>)}
                    </tr>
                    <tr>
                        <td className="data-left">Ticket count with story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int">{sprint.completedWithSP}</td>)}
                    </tr>
                    <tr>
                        <td className="data-left">Ticket count without story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int">{sprint.CompletedTotal - sprint.completedWithSP}</td>)}
                    </tr>
                    <tr>
                        <td className="data-left brdr-btm-dbl">Total ticket count (with + without) story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} className="brdr-btm-dbl" exporttype="int">{sprint.CompletedTotal}</td>)}
                    </tr>
                    <tr>
                        <td rowSpan={4} className="brdr-btm-dbl">Not completed</td>
                        <td className="data-left">Story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exportvalue={sprint.incompletedSP} exporttype="int">
                            {sprint.incompletedSPOld && <span>{sprint.incompletedSPOld} <i className="fa fa-arrow-right" />}</span>}
                            {sprint.incompletedSP}</td>)}
                    </tr>
                    <tr>
                        <td className="data-left">Ticket count with story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int">{sprint.incompletedWithSP}</td>)}
                    </tr>
                    <tr>
                        <td className="data-left">Ticket count without story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int">{sprint.incompletedTotal - sprint.incompletedWithSP}</td>)}
                    </tr>
                    <tr>
                        <td className="data-left brdr-btm-dbl">Total ticket count (with + without) story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} className="brdr-btm-dbl" exporttype="int">{sprint.incompletedTotal}</td>)}
                    </tr>
                    <tr>
                        <td rowSpan={4} className="brdr-btm-dbl">Added to sprint</td>
                        <td className="data-left">Story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exportvalue={sprint.addedSP} exporttype="int">
                            {sprint.addedSPOld && <span>{sprint.addedSPOld} <i className="fa fa-arrow-right" /></span>}
                            {sprint.addedSP}
                        </td>)}

                    </tr>
                    <tr>
                        <td className="data-left">Ticket count with story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int">{sprint.addedWithSP}</td>)}
                    </tr>
                    <tr>
                        <td className="data-left">Ticket count without story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int">{sprint.addedIssues - sprint.addedWithSP}</td>)}
                    </tr>
                    <tr>
                        <td className="data-left brdr-btm-dbl">Total ticket count (with + without) story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} className="brdr-btm-dbl" exporttype="int">{sprint.addedIssues}</td>)}
                    </tr>
                    <tr>
                        <td rowSpan={4}>Removed from sprint</td>
                        <td className="data-left">Story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exportvalue={sprint.removedSP} exporttype="int">
                            {sprint.removedSPOld && <span>{sprint.removedSPOld} <i className="fa fa-arrow-right" /></span>}
                            {sprint.removedSP}</td>)}
                    </tr>
                    <tr>
                        <td className="data-left">Ticket count with story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int">{sprint.removedWithSP}</td>)}
                    </tr>
                    <tr>
                        <td className="data-left">Ticket count without story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int">{sprint.removedTotal - sprint.removedWithSP}</td>)}
                    </tr>
                    <tr>
                        <td className="data-left">Total ticket count (with + without) story points</td>
                        {sprintDetails.map((sprint, i) => <td key={i} exporttype="int">{sprint.removedTotal}</td>)}
                    </tr>
                </TBody>
            </ScrollableTable>
        );
    }
}

export default SummaryView1;