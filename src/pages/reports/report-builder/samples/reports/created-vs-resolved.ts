import { chart, col, derivedSource, fields, header, jqlSource, numberParameter, projectsParameter, rule, table, text } from '../builders';
import { projectsJql } from '../jql';
import type { BuilderSampleReport } from '../types';

const weeksParameter = numberParameter('weeks', 'Number of weeks', 12);

const sample: BuilderSampleReport = {
    id: 'created-vs-resolved',
    title: 'Created vs resolved per week',
    description: 'Issues created and resolved in each of the last weeks in the chosen projects, and how the open backlog grows or shrinks.',
    category: 'issues',
    icon: 'fa-chart-line',
    definition: {
        parameters: [projectsParameter, weeksParameter],
        datasources: [
            jqlSource('ds-created', 'CreatedIssues', `${projectsJql} AND created >= startOfWeek(-{{ Parameters.weeks }}w)`, [fields.created]),
            jqlSource('ds-resolved', 'ResolvedIssues', `${projectsJql} AND resolutiondate >= startOfWeek(-{{ Parameters.weeks }}w)`, [fields.resolved]),
            derivedSource('ds-created-weekly', 'CreatedWeekly', 'ds-created', [
                {
                    type: 'group',
                    keys: [{ name: 'week', expression: "StartOf('week', Field.created)" }],
                    aggregates: [{ name: 'created', fn: 'count' }],
                },
            ]),
            derivedSource(
                'ds-weekly',
                'Weekly',
                'ds-created-weekly',
                [
                    {
                        type: 'join',
                        datasourceId: 'ds-resolved-weekly',
                        joinType: 'full',
                        on: [{ left: 'week', right: 'week' }],
                        mode: 'merge',
                        prefix: 'r_',
                    },
                    {
                        type: 'computed',
                        columns: [
                            { name: 'week', expression: 'Coalesce(Field.week, Field.r_week)' },
                            { name: 'created', expression: 'IfNull(Field.created, 0)' },
                            { name: 'resolved', expression: 'IfNull(Field.r_resolved, 0)' },
                            { name: 'net', expression: 'Field.created - Field.resolved' },
                        ],
                    },
                    { type: 'sort', keys: [{ expression: 'Field.week', direction: 'asc' }] },
                    { type: 'window', partitionBy: [], orderBy: [{ expression: 'Field.week', direction: 'asc' }], columns: [{ name: 'backlogChange', fn: 'runningSum', field: 'net' }] },
                    { type: 'computed', columns: [{ name: 'weekLabel', expression: "FormatDate(Field.week, 'dd MMM')" }] },
                ],
                'Created and resolved counts joined on the week they fall in.',
            ),
            derivedSource('ds-resolved-weekly', 'ResolvedWeekly', 'ds-resolved', [
                {
                    type: 'group',
                    keys: [{ name: 'week', expression: "StartOf('week', Field.resolutiondate)" }],
                    aggregates: [{ name: 'resolved', fn: 'count' }],
                },
            ]),
        ],
        components: [
            header('title', 'Created vs resolved per week', 'h1'),
            text('intro', 'Weeks start on Sunday. A positive net value means the backlog grew that week.'),
            chart('trend-chart', 'chart-line', 'ds-weekly', {
                title: 'Created and resolved issues',
                xAxisField: 'weekLabel',
                aggregation: 'none',
                series: [
                    { id: 's-created', label: 'Created', valueField: 'created', color: '#ef4444' },
                    { id: 's-resolved', label: 'Resolved', valueField: 'resolved', color: '#22c55e' },
                    { id: 's-backlog', label: 'Backlog change', valueField: 'backlogChange', color: '#6366f1' },
                ],
            }),
            table('weekly', 'ds-weekly', [
                col('weekLabel', 'Week of'),
                col('created', 'Created', { width: '90px', align: 'right' }),
                col('resolved', 'Resolved', { width: '90px', align: 'right' }),
                col('net', 'Net', {
                    width: '80px',
                    align: 'right',
                    conditionalFormats: [rule('grew', 'Field.net > 0', '#fee2e2', '#991b1b'), rule('shrank', 'Field.net < 0', '#dcfce7', '#166534')],
                }),
                col('backlogChange', 'Backlog change', { width: '120px', align: 'right' }),
            ]),
        ],
    },
};

export default sample;
