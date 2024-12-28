import React from 'react';
import moment from 'moment';
import { inject } from 'src/services';
import { Column, ScrollableTable, TBody, THead } from 'src/components/ScrollableTable';
import { IssueDisplay, ItemDisplay, TimeSpentDisplay, UserDisplay } from 'src/display-controls';
import './SprintInfo.scss';

const dateFormat = 'D-MMM-YYYY h:mm A';

function SprintInfo({ sprint, onClose }) {
    const [groupedIssues, setGroupedIssues] = React.useState([]);

    React.useEffect(() => {
        const { issues } = sprint;
        const groupedIssues = groupIssues(issues);

        setGroupedIssues(groupedIssues);

        (async () => {
            const issueKeys = issues.map(({ key }) => key);
            const { $ticket } = inject('TicketService');
            const issueDetails = await $ticket.getTicketDetails(issueKeys, false, ['assignee', 'issuetype', 'priority', 'summary', 'status']);
            const newIssues = issues.map(issue => {
                const { fields } = issueDetails[issue.key];
                return {
                    ...issue,
                    fields: { ...issue.fields, ...fields }
                };
            });
            const newGroupedIssues = groupIssues(newIssues);

            setGroupedIssues(newGroupedIssues);
        })();
    }, [sprint]);

    return (
        <div className="sprint-info">
            <div className="sprint-info-header">
                <h2>{sprint.name}</h2>
                <span className="close-icon fas fa-times" onClick={onClose} />
            </div>
            <div className="sprint-details">
                <div className="metric-item"><strong>Active during:</strong> {moment(sprint.startDate).format(dateFormat)} to {moment(sprint.completeDate).format(dateFormat)}</div>
                {!!sprint.velocity && <div className="metric-item"><strong>Average Velocity:</strong> {sprint.velocity} ({parseFloat(sprint.velocityGrowth.toFixed(2))}%)</div>}
                {!!sprint.sayDoRatio && <div className="metric-item"><strong>Say Do Ratio:</strong> {sprint.sayDoRatio}%</div>}
                {!!sprint.averageCycleTime && <div className="metric-item">
                    <strong>Cycle Time:</strong>
                    <TimeSpentDisplay tag="span" value={sprint.averageCycleTime} days inputType="days" />
                    <span className="ms-1">({sprint.cycleTimesIssuesCount} issues)</span>
                </div>}
            </div>
            {groupedIssues.map(group => (
                <div key={group.title} className="issue-group">
                    <h3>{group.title}</h3>
                    <ScrollableTable dataset={group.issues} className="issues-table" containerStyle={{ height: 'auto', maxHeight: 'calc(100vh - 560px)' }} exportable={false}>
                        <THead>
                            <tr>
                                <Column style={{ width: '100px' }}>Key</Column>
                                <Column style={{ maxWidth: '450px' }}>Summary</Column>
                                <Column style={{ width: '150px' }}>Priority</Column>
                                <Column style={{ width: '200px' }}>Assignee</Column>
                                {group.showCycleTime && <Column className='text-center' style={{ width: '70px', minWidth: '50px' }}>Cycle Time</Column>}
                                <Column className='text-center' style={{ width: '70px', minWidth: '50px' }}>Story Points</Column>
                            </tr>
                        </THead>
                        <TBody>
                            {group.issues.map(issue => (
                                <tr key={issue.key} style={{ backgroundColor: issue.addedToSprint ? '#fff3cd' : '' }}>
                                    <td><IssueDisplay tag="span" value={issue} />{issue.addedToSprint && <span className="ps-2">*</span>}</td>
                                    <td style={{ maxWidth: '450px' }}>{issue.fields.summary}</td>
                                    <ItemDisplay value={issue.fields.priority} />
                                    <UserDisplay value={issue.fields.assignee} settings={{ showImage: true }} />
                                    {group.showCycleTime && <td className='text-center'><TimeSpentDisplay tag="span" value={issue.cycleTime} days inputType="days" /></td>}
                                    <td className='text-center'>
                                        {!!issue.initialStoryPoints && <span className="text-muted">{issue.initialStoryPoints} <span className="fas fa-arrow-right mx-1" /></span>}
                                        {issue.fields.storyPoints || '-'}</td>
                                </tr>
                            ))}
                        </TBody>
                    </ScrollableTable>
                </div>
            ))}
        </div>
    );
}

export default SprintInfo;

function groupIssues(issues) {
    return issues.groupBy(issue => {
        if (issue.completed) {
            return '1Completed issues';
        }
        if (issue.completedOutside) {
            return '3Completed outside sprint';
        }
        if (issue.removedFromSprint) {
            return '4Removed from sprint';
        }

        return '2Issues not completed';
    }).sortBy(group => group.key)
        .map(({ key, values }) => ({
            title: `${key.substring(1)} (${values.length})`,
            showCycleTime: key.startsWith('1'),
            issues: values
        }));
}