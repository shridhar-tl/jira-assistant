import { chart, col, derivedSource, fields, header, hoursColumn, rule, sprintIssuesSource, sprintsParameter, table, text } from '../builders';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'sprint-workload',
    title: 'Sprint workload by assignee',
    description: 'Issues, story points, logged and remaining hours of each assignee in the chosen sprints, highlighting the busiest people.',
    category: 'sprints',
    icon: 'fa-people-carry-box',
    definition: {
        parameters: [sprintsParameter],
        datasources: [
            sprintIssuesSource('ds-issues', 'SprintIssues', [fields.summary, fields.status, fields.assignee, fields.storyPoints, fields.timeSpent, fields.remainingEstimate]),
            derivedSource('ds-workload', 'Workload', 'ds-issues', [
                {
                    type: 'group',
                    keys: [{ name: 'assignee', expression: 'IfNull(Field.assignee.displayName, \'Unassigned\')' }],
                    aggregates: [
                        { name: 'issues', fn: 'count' },
                        { name: 'open', fn: 'sum', expression: 'IIf(Field.status.statusCategory.key == \'done\', 0, 1)' },
                        { name: 'points', fn: 'sum', expression: 'IfNull(Field.storyPoints, 0)' },
                        { name: 'spentHours', fn: 'sum', expression: 'Hours(IfNull(Field.timespent, 0), 2)' },
                        { name: 'remainingHours', fn: 'sum', expression: 'Hours(IfNull(Field.timeestimate, 0), 2)' },
                    ],
                },
                {
                    type: 'window',
                    partitionBy: [],
                    orderBy: [{ expression: 'Field.remainingHours', direction: 'desc' }],
                    columns: [{ name: 'share', fn: 'percentOfTotal', field: 'remainingHours' }],
                },
                { type: 'sort', keys: [{ expression: 'Field.remainingHours', direction: 'desc' }] },
            ]),
        ],
        components: [
            header('title', 'Sprint workload by assignee', 'h1'),
            text('intro', 'Assignees holding more than 30% of the remaining hours of the sprint are highlighted.'),
            chart('remaining-chart', 'chart-horizontal-bar', 'ds-workload', {
                title: 'Remaining and logged hours',
                xAxisField: 'assignee',
                series: [
                    { id: 's-remaining', label: 'Remaining hours', valueField: 'remainingHours' },
                    { id: 's-spent', label: 'Logged hours', valueField: 'spentHours' },
                ],
            }),
            table('workload', 'ds-workload', [
                col('assignee', 'Assignee'),
                col('issues', 'Issues', { width: '80px', align: 'right' }),
                col('open', 'Open', { width: '80px', align: 'right' }),
                col('points', 'Points', { width: '80px', align: 'right' }),
                hoursColumn('spentHours', 'Logged'),
                col('remainingHours', 'Remaining', {
                    width: '100px',
                    align: 'right',
                    formatExpr: '=FormatNumber(Field.remainingHours, 2)',
                    conditionalFormats: [rule('busy', 'Field.share > 30', '#fee2e2', '#991b1b', true)],
                }),
                col('share', 'Share', { width: '80px', align: 'right', formatExpr: '=Concat(Round(Field.share, 0), \'%\')' }),
            ]),
        ],
    },
};

export default sample;
