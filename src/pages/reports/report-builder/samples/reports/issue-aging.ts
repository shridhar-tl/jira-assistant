import { chart, col, columns, derivedSource, fields, header, issueKeyColumn, jqlSource, projectsParameter, rule, table, text } from '../builders';
import { openJql, projectsJql } from '../jql';
import type { BuilderSampleReport } from '../types';

const ageBucket =
    'IIf(Field.issueAge <= 7, \'1. Up to a week\', IIf(Field.issueAge <= 30, \'2. Up to a month\', IIf(Field.issueAge <= 90, \'3. Up to 3 months\', IIf(Field.issueAge <= 365, \'4. Up to a year\', \'5. Over a year\'))))';

const sample: BuilderSampleReport = {
    id: 'issue-aging',
    title: 'Open issue aging',
    description: 'How long the open issues of the chosen projects have been waiting, bucketed by age, with the 25 oldest issues.',
    category: 'issues',
    icon: 'fa-hourglass-end',
    definition: {
        parameters: [projectsParameter],
        datasources: [
            jqlSource('ds-open', 'OpenIssues', `${projectsJql} AND ${openJql}`, [fields.summary, fields.status, fields.assignee, fields.issueType, fields.issueAge]),
            derivedSource('ds-buckets', 'AgeBuckets', 'ds-open', [
                { type: 'computed', columns: [{ name: 'bucket', expression: ageBucket }] },
                {
                    type: 'group',
                    keys: [{ name: 'bucket', expression: 'Field.bucket' }],
                    aggregates: [
                        { name: 'issues', fn: 'count' },
                        { name: 'averageAge', fn: 'avg', expression: 'Field.issueAge' },
                    ],
                },
                { type: 'sort', keys: [{ expression: 'Field.bucket', direction: 'asc' }] },
                { type: 'computed', columns: [{ name: 'label', expression: 'Mid(Field.bucket, 4, 50)' }] },
            ]),
            derivedSource('ds-oldest', 'OldestIssues', 'ds-open', [
                { type: 'sort', keys: [{ expression: 'Field.issueAge', direction: 'desc' }] },
                { type: 'limit', count: 25 },
            ]),
        ],
        components: [
            header('title', 'Open issue aging', 'h1'),
            text('intro', 'Age is counted in days from the date the issue was created.'),
            columns(
                'buckets',
                [chart('bucket-chart', 'chart-bar', 'ds-buckets', { title: 'Open issues by age', xAxisField: 'label', yAxisField: 'issues', showLegend: false })],
                [
                    table('bucket-table', 'ds-buckets', [
                        col('label', 'Age'),
                        col('issues', 'Issues', { width: '80px', align: 'right' }),
                        col('averageAge', 'Average days', { width: '110px', align: 'right', formatExpr: '=FormatNumber(Field.averageAge, 0)' }),
                    ]),
                ],
            ),
            header('oldest-title', 'Oldest open issues', 'h3'),
            table('oldest', 'ds-oldest', [
                issueKeyColumn,
                col('summary', 'Summary'),
                col('issuetype.name', 'Type', { width: '100px' }),
                col('status.name', 'Status', { width: '120px' }),
                col('assignee.displayName', 'Assignee', { width: '150px' }),
                col('issueAge', 'Age (days)', {
                    width: '100px',
                    align: 'right',
                    conditionalFormats: [rule('ancient', 'Field.issueAge > 365', '#fee2e2', '#991b1b', true)],
                }),
            ]),
        ],
    },
};

export default sample;
