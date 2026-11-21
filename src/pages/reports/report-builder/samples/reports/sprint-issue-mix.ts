import { chart, col, columns, derivedSource, fields, header, rule, sprintIssuesSource, sprintsParameter, table, text } from '../builders';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'sprint-issue-mix',
    title: 'Sprint issue type mix',
    description: 'How the chosen sprints split between stories, bugs and other issue types, and how much of each type is done.',
    category: 'sprints',
    icon: 'fa-chart-pie',
    definition: {
        parameters: [sprintsParameter],
        datasources: [
            sprintIssuesSource('ds-issues', 'SprintIssues', [fields.issueType, fields.status, fields.storyPoints]),
            derivedSource('ds-mix', 'IssueTypeMix', 'ds-issues', [
                {
                    type: 'group',
                    keys: [{ name: 'issueType', expression: 'Field.issuetype.name' }],
                    aggregates: [
                        { name: 'issues', fn: 'count' },
                        { name: 'done', fn: 'sum', expression: "IIf(Field.status.statusCategory.key == 'done', 1, 0)" },
                        { name: 'points', fn: 'sum', expression: 'IfNull(Field.storyPoints, 0)' },
                    ],
                },
                { type: 'computed', columns: [{ name: 'percentDone', expression: 'Percent(Field.done, Field.issues, 0)' }] },
                { type: 'sort', keys: [{ expression: 'Field.issues', direction: 'desc' }] },
            ]),
        ],
        components: [
            header('title', 'Sprint issue type mix', 'h1'),
            text('intro', 'Share of each issue type in the selected sprints and how far each type has progressed.'),
            columns(
                'charts',
                [chart('mix-chart', 'chart-pie', 'ds-mix', { title: 'Issues by type', labelField: 'issueType', valueField: 'issues' })],
                [
                    chart('done-chart', 'chart-bar', 'ds-mix', {
                        title: 'Percent done',
                        xAxisField: 'issueType',
                        yAxisField: 'percentDone',
                        showLegend: false,
                        yAxis: { beginAtZero: true, max: 100 },
                    }),
                ],
            ),
            table('mix', 'ds-mix', [
                col('issueType', 'Issue type'),
                col('issues', 'Issues', { width: '90px', align: 'right' }),
                col('done', 'Done', { width: '90px', align: 'right' }),
                col('points', 'Points', { width: '90px', align: 'right' }),
                col('percentDone', 'Done %', {
                    width: '90px',
                    align: 'right',
                    formatExpr: "=Concat(Field.percentDone, '%')",
                    conditionalFormats: [rule('complete', 'Field.percentDone == 100', '#dcfce7', '#166534', true)],
                }),
            ]),
        ],
    },
};

export default sample;
