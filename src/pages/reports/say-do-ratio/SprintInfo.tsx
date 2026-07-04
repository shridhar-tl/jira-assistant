import React, { useEffect, useState } from 'react';

import { format } from 'date-fns';

import { Column, ScrollableTable, TBody, THead } from '@/components/shared';
import { IssueDisplay, ItemDisplay, TimeSpentDisplay, UserDisplay } from '@/display-controls';
import { inject } from '@/services';

import type { SprintData, SprintIssue } from './types';

const dateFormat = 'd-MMM-yyyy h:mm a';

interface SprintInfoProps {
    sprint: SprintData;
    onClose: () => void;
}

interface IssueGroup {
    title: string;
    showCycleTime: boolean;
    issues: SprintIssue[];
}

function groupIssues(issues: SprintIssue[]): IssueGroup[] {
    const groups: { [key: string]: SprintIssue[] } = {};

    issues.forEach((issue) => {
        let key: string;
        if (issue.completed) {
            key = '1Completed issues';
        } else if (issue.completedOutside) {
            key = '3Completed outside sprint';
        } else if (issue.removedFromSprint) {
            key = '4Removed from sprint';
        } else {
            key = '2Issues not completed';
        }

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(issue);
    });

    return Object.keys(groups)
        .sort()
        .map((key) => ({
            title: `${key.substring(1)} (${groups[key].length})`,
            showCycleTime: key.startsWith('1'),
            issues: groups[key],
        }));
}

function SprintInfo({ sprint, onClose }: SprintInfoProps) {
    const [groupedIssues, setGroupedIssues] = useState<IssueGroup[]>([]);

    useEffect(() => {
        const { issues } = sprint;
        const initialGroups = groupIssues(issues);
        setGroupedIssues(initialGroups);

        (async () => {
            try {
                const issueKeys = issues.map(({ key }) => key);
                const { $ticket } = inject('TicketService');
                const issueDetails = await $ticket.getTicketDetails(issueKeys, false, [
                    'assignee',
                    'issuetype',
                    'priority',
                    'summary',
                    'status',
                ]);
                const newIssues = issues.map((issue) => {
                    const { fields } = issueDetails[issue.key];
                    return {
                        ...issue,
                        fields: { ...issue.fields, ...fields },
                    };
                });
                const newGroupedIssues = groupIssues(newIssues);
                setGroupedIssues(newGroupedIssues);
            } catch (err) {
                console.error('Failed to load sprint issue details:', err);
            }
        })();
    }, [sprint]);

    return (
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg my-5 overflow-hidden">
            <div className="flex justify-between items-center bg-[#64b5f6] dark:bg-gray-800 text-white px-4 py-3">
                <h2 className="text-xl font-semibold m-0">{sprint.name}</h2>
                <span className="fas fa-times cursor-pointer text-xl hover:opacity-80" onClick={onClose} />
            </div>

            <div className="p-5 bg-[#f9f9f9] dark:bg-gray-900">
            <div className="flex flex-wrap gap-4 mb-5">
                <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2">
                    <strong className="mr-2">Active during:</strong>
                    <span>
                        {format(new Date(sprint.startDate), dateFormat)} to {format(new Date(sprint.completeDate), dateFormat)}
                    </span>
                </div>
                {!!sprint.velocity && (
                    <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2">
                        <strong className="mr-2">Average Velocity:</strong>
                        <span>
                            {sprint.velocity} ({parseFloat(sprint.velocityGrowth!.toFixed(2))}%)
                        </span>
                    </div>
                )}
                {!!sprint.sayDoRatio && (
                    <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2">
                        <strong className="mr-2">Say Do Ratio:</strong>
                        <span>{sprint.sayDoRatio}%</span>
                    </div>
                )}
                {!!sprint.averageCycleTime && (
                    <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2">
                        <strong className="mr-2">Cycle Time:</strong>
                        <TimeSpentDisplay tag="span" value={sprint.averageCycleTime} days inputType="days" />
                        <span className="ml-1">({sprint.cycleTimesIssuesCount} issues)</span>
                    </div>
                )}
            </div>

            {groupedIssues.map((group) => (
                <div key={group.title} className="mb-5">
                    <h3 className="bg-gray-200 dark:bg-gray-800 px-3 py-2 rounded text-lg font-semibold mb-2">{group.title}</h3>
                    <ScrollableTable
                        dataset={group.issues}
                        className="issues-table"
                        containerStyle={{ height: 'auto', maxHeight: 'calc(100vh - 560px)' }}
                        exportable={false}
                    >
                        <THead>
                            <tr>
                                <Column style={{ width: '100px' }}>Key</Column>
                                <Column style={{ maxWidth: '450px' }}>Summary</Column>
                                <Column style={{ width: '150px' }}>Priority</Column>
                                <Column style={{ width: '200px' }}>Assignee</Column>
                                {group.showCycleTime && (
                                    <Column className="text-center" style={{ width: '70px', minWidth: '50px' }}>
                                        Cycle Time
                                    </Column>
                                )}
                                <Column className="text-center" style={{ width: '70px', minWidth: '50px' }}>
                                    Story Points
                                </Column>
                            </tr>
                        </THead>
                        <TBody>
                            {group.issues.map((issue) => (
                                <tr key={issue.key} style={{ backgroundColor: issue.addedToSprint ? '#fff3cd' : '' }}>
                                    <td>
                                        <IssueDisplay tag="span" value={issue} />
                                        {issue.addedToSprint && <span className="ps-2">*</span>}
                                    </td>
                                    <td style={{ maxWidth: '450px' }}>{issue.fields.summary}</td>
                                    <ItemDisplay value={issue.fields.priority} />
                                    <UserDisplay value={issue.fields.assignee} settings={{ showImage: true }} />
                                    {group.showCycleTime && (
                                        <td className="text-center">
                                            <TimeSpentDisplay tag="span" value={issue.cycleTime} days inputType="days" />
                                        </td>
                                    )}
                                    <td className="text-center">
                                        {!!issue.initialStoryPoints && (
                                            <span className="text-muted">
                                                {issue.initialStoryPoints} <span className="fas fa-arrow-right mx-1" />
                                            </span>
                                        )}
                                        {issue.fields.storyPoints || '-'}
                                    </td>
                                </tr>
                            ))}
                        </TBody>
                    </ScrollableTable>
                </div>
            ))}
            </div>
        </div>
    );
}

export default SprintInfo;
