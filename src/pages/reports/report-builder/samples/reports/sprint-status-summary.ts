import { chart, col, columns, derivedSource, fields, header, issueKeyColumn, sprintIssuesSource, sprintsParameter, table, text } from '../builders';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'sprint-status-summary',
    title: 'Sprint status summary',
    description: 'Issues and story points of the chosen sprints by status, with the issue list grouped by status.',
    category: 'sprints',
    icon: 'fa-flag-checkered',
    definition: {
        parameters: [sprintsParameter],
        datasources: [
            sprintIssuesSource('ds-issues', 'SprintIssues', [fields.summary, fields.status, fields.assignee, fields.issueType, fields.priority, fields.storyPoints]),
            derivedSource('ds-by-status', 'IssuesByStatus', 'ds-issues', [
                {
                    type: 'group',
                    keys: [{ name: 'status', expression: 'Field.status.name' }],
                    aggregates: [
                        { name: 'issues', fn: 'count' },
                        { name: 'points', fn: 'sum', expression: 'IfNull(Field.storyPoints, 0)' },
                    ],
                },
                { type: 'sort', keys: [{ expression: 'Field.issues', direction: 'desc' }] },
            ]),
        ],
        components: [
            header('title', 'Sprint status summary', 'h1'),
            text('intro', 'Where the work of the selected sprints stands right now.'),
            columns(
                'charts',
                [chart('issues-chart', 'chart-donut', 'ds-by-status', { title: 'Issues by status', labelField: 'status', valueField: 'issues' })],
                [chart('points-chart', 'chart-bar', 'ds-by-status', { title: 'Story points by status', xAxisField: 'status', yAxisField: 'points', showLegend: false })],
            ),
            header('issues-title', 'Issues', 'h3'),
            table(
                'issues',
                'ds-issues',
                [
                    issueKeyColumn,
                    col('summary', 'Summary'),
                    col('issuetype.name', 'Type', { width: '110px' }),
                    col('priority.name', 'Priority', { width: '100px' }),
                    col('assignee.displayName', 'Assignee', { width: '160px' }),
                    col('storyPoints', 'Points', { width: '80px', align: 'right' }),
                ],
                { groupBy: 'status.name', showGroupFooter: true },
            ),
        ],
    },
};

export default sample;
