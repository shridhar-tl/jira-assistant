import React, { PureComponent } from 'react';
import { ScrollableTable, THead, TBody } from "../../../components/ScrollableTable";

const notes = <div style={{ paddingLeft: 15 }}>
    <strong>Notes:</strong>
    <ul>
        <li>* Tickets highlighted below are changes in scope of the sprint</li>
        <li>Count of tickets format: Count of tickets with storypoints + Count of tickets without storypoints = Total count of tickets</li>
    </ul>
</div>;

class SummaryView2 extends PureComponent {
    render() {
        const { sprintDetails, formatDateTime } = this.props;

        return (
            <>
                {notes}
                <ScrollableTable className="dataTable exportable summ-2" exportSheetName="Summary view 2">
                    <THead>
                        <tr>
                            <th rowSpan={2}>Sprint</th>
                            <th rowSpan={2}>Start Date</th>
                            <th rowSpan={2}>Completed Date</th>
                            <th rowSpan={2}>Status</th>
                            <th rowSpan={2}>Closed by</th>
                            <th colSpan={2} className="data-center">Estimated</th>
                            <th colSpan={2} className="data-center">Total Issues</th>
                            <th colSpan={2} className="data-center">Completed Issues</th>
                            <th colSpan={2} className="data-center">Issues Not Completed</th>
                            <th colSpan={2} className="data-center">Added to sprint</th>
                            <th colSpan={2} className="data-center">Removed from sprint</th>
                        </tr>
                        <tr>
                            <th>Story Points</th>
                            <th>Count <i className="fa fa-question-circle help-icon" title="Ticket with storypoints + Ticket without storypoints = Total story count" /></th>
                            <th>Story Points</th>
                            <th>Count <i className="fa fa-question-circle help-icon" title="Ticket with storypoints + Ticket without storypoints = Total story count" /></th>
                            <th>Story Points</th>
                            <th>Count <i className="fa fa-question-circle help-icon" title="Ticket with storypoints + Ticket without storypoints = Total story count" /></th>
                            <th>Story Points</th>
                            <th>Count <i className="fa fa-question-circle help-icon" title="Ticket with storypoints + Ticket without storypoints = Total story count" /></th>
                            <th>Story Points</th>
                            <th>Count <i className="fa fa-question-circle help-icon" title="Ticket with storypoints + Ticket without storypoints = Total story count" /></th>
                            <th>Story Points</th>
                            <th>Count <i className="fa fa-question-circle help-icon" title="Ticket with storypoints + Ticket without storypoints = Total story count" /></th>
                        </tr>
                    </THead>

                    <TBody>
                        {sprintDetails.map((sprint, i) => <SprintDetails key={i} sprint={sprint} formatDateTime={formatDateTime} />)}
                    </TBody>
                </ScrollableTable>
            </>
        );
    }
}

export default SummaryView2;


class SprintDetails extends PureComponent {
    state = { expanded: false };

    toggleExpanded = () => this.setState({ expanded: !this.state.expanded });

    render() {
        const { sprint, formatDateTime } = this.props;
        const { expanded } = this.state;

        return (
            <>
                <tr className="pointer auto-wrap" onClick={this.toggleExpanded} title="Click to expand and view individual ticket details">
                    <td>
                        <i className={`drill-down fa ${expanded ? 'fa-chevron-circle-down' : 'fa-chevron-circle-right'}`} style={{ cursor: 'pointer', marginRight: '5px' }} title="Click to toggle sprint ticket details" />
                        {sprint.sprint.name}
                    </td>
                    <td>{formatDateTime(sprint.sprint.startDate)}</td>
                    <td>{formatDateTime(sprint.sprint.completeDate)}</td>
                    <td>{sprint.sprint.state}</td>
                    <td innerhtml={sprint.lastUserToClose} />
                    <td className="data-center">{sprint.estimateIssuesSPOld && <span>{sprint.estimateIssuesSPOld} <i className="fa fa-arrow-right" /></span>}{sprint.estimateIssuesSP}</td>
                    <td className="data-center">
                        {sprint.estimateIssuesCount && <span>
                            {sprint.estimateIssuesWithSP} +
            {sprint.estimateIssuesCount - sprint.estimateIssuesWithSP} =
            {sprint.estimateIssuesCount}
                        </span>}
                    </td>
                    <td className="data-center">{sprint.totalIssuesSPOld && <span>{sprint.totalIssuesSPOld} <i className="fa fa-arrow-right" /></span>}{sprint.totalIssuesSP}</td>
                    <td className="data-center">
                        {sprint.totalIssuesCount && <span>
                            {sprint.totalIssuesWithSP} +
            {sprint.totalIssuesCount - sprint.totalIssuesWithSP} =
            {sprint.totalIssuesCount}
                        </span>}
                    </td>
                    <td className="data-center">{sprint.completedSPOld && <span>{sprint.completedSPOld} <i className="fa fa-arrow-right" /></span>}{sprint.completedSP}</td>
                    <td className="data-center">
                        {sprint.CompletedTotal && <span>
                            {sprint.completedWithSP} +
            {sprint.CompletedTotal - sprint.completedWithSP} =
            {sprint.CompletedTotal}
                        </span>}
                    </td>
                    <td className="data-center">{sprint.incompletedSPOld && <span>{sprint.incompletedSPOld} <i className="fa fa-arrow-right" /></span>}{sprint.incompletedSP}</td>
                    <td className="data-center">
                        {sprint.incompletedTotal && <span>
                            {sprint.incompletedWithSP} +
            {sprint.incompletedTotal - sprint.incompletedWithSP} =
            {sprint.incompletedTotal}
                        </span>}
                    </td>
                    <td className="log-less data-center">{sprint.addedSPOld && <span>{sprint.addedSPOld} <i className="fa fa-arrow-right" /></span>}{sprint.addedSP}</td>
                    <td className="log-less data-center">
                        {sprint.addedIssues && <span>
                            {sprint.addedWithSP} +
            {sprint.addedIssues - sprint.addedWithSP} =
            {sprint.addedIssues}
                        </span>}
                    </td>
                    <td className="data-center">{sprint.removedSPOld && <span>{sprint.removedSPOld} <i className="fa fa-arrow-right" /></span>}{sprint.removedSP}</td>
                    <td className="data-center">
                        {sprint.removedTotal && <span>
                            {sprint.removedWithSP} +
            {sprint.removedTotal - sprint.removedWithSP} =
            {sprint.removedTotal}
                        </span>}
                    </td>
                </tr>
                {expanded && <tr exportignore="true">
                    <td colSpan={17} style={{ padding: '0 !important' }}>
                        <SprintTicketDetails sprint={sprint} />
                    </td>
                </tr>}
            </>
        );
    }
}

class SprintTicketDetails extends PureComponent {
    render() {
        const { sprint } = this.props;

        return (
            <ScrollableTable className="dataTable min-width-110 exportable" exportSheetName={sprint.sprint.name}>
                <THead>
                    <tr>
                        <th>Key</th>
                        <th>Summary</th>
                        <th>Issue Type</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Story Points</th>
                    </tr>
                </THead>
                <TBody>
                    <CategorizedTicketList header="Completed Issues" issues={sprint.contents.completedIssues} />
                    <CategorizedTicketList header="Issues Removed From Sprint" issues={sprint.contents.puntedIssues} />
                    <CategorizedTicketList header="Issues Not Completed" issues={sprint.contents.issuesNotCompletedInCurrentSprint} />
                </TBody>
            </ScrollableTable>
        );
    }
}


class CategorizedTicketList extends PureComponent {
    render() {
        const { header, issues } = this.props;

        if (!issues || issues.length === 0) { return null; }

        return (<>
            <tr><td colSpan={6}><strong>{header}</strong></td></tr>
            {issues.map((issue, i) => <tr key={i} className={(issue.addedLater ? 'log-high' : '')}>
                <td>{issue.key} {issue.addedLater && <span>*</span>}</td>
                <td>{issue.summary}</td>
                <td>{issue.typeUrl && <img className="img-x16" src={issue.typeUrl} alt="" />} {issue.typeName}</td>
                <td>{issue.priorityUrl && <img className="img-x16" src={issue.priorityUrl} alt="" />} {issue.priorityName}</td>
                <td>{issue.statusUrl && <img className="img-x16" src={issue.statusUrl} alt="" />} {issue.statusName}</td>
                <td>{issue.oldSP >= 0 && <span>{issue.oldSP} <i className="fa fa-arrow-right" /></span>} {issue.currentSP}</td>
            </tr>)}
        </>
        );
    }
}
