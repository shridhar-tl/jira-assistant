import { chart, col, columns, derivedSource, fields, header, issueKeyColumn, jqlSource, projectsParameter, table, text } from '../builders';
import { openJql, projectsJql } from '../jql';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'open-issues-by-status',
    title: 'Open issues by project and status',
    description: 'Every open issue of the chosen projects counted by project and status, with the full list grouped the same way.',
    category: 'issues',
    icon: 'fa-list-check',
    definition: {
        parameters: [projectsParameter],
        datasources: [
            jqlSource('ds-open', 'OpenIssues', `${projectsJql} AND ${openJql} ORDER BY priority DESC, updated DESC`, [
                fields.summary,
                fields.status,
                fields.project,
                fields.assignee,
                fields.priority,
                fields.updated,
            ]),
            derivedSource('ds-counts', 'StatusCounts', 'ds-open', [
                {
                    type: 'group',
                    keys: [
                        { name: 'project', expression: 'Field.project.name' },
                        { name: 'status', expression: 'Field.status.name' },
                    ],
                    aggregates: [{ name: 'issues', fn: 'count' }],
                },
                { type: 'sort', keys: [{ expression: 'Field.project', direction: 'asc' }, { expression: 'Field.issues', direction: 'desc' }] },
            ]),
        ],
        components: [
            header('title', 'Open issues by project and status', 'h1'),
            text('intro', 'Everything that is not done yet in the selected projects.'),
            columns(
                'summary',
                [
                    chart('status-chart', 'chart-stacked-bar', 'ds-counts', {
                        title: 'Open issues',
                        xAxisField: 'project',
                        yAxisField: 'issues',
                        seriesField: 'status',
                        stacked: true,
                    }),
                ],
                [
                    table('counts', 'ds-counts', [
                        col('project', 'Project'),
                        col('status', 'Status'),
                        col('issues', 'Issues', { width: '80px', align: 'right' }),
                    ]),
                ],
            ),
            header('list-title', 'Issues', 'h3'),
            table(
                'issues',
                'ds-open',
                [
                    issueKeyColumn,
                    col('summary', 'Summary'),
                    col('assignee.displayName', 'Assignee', { width: '160px' }),
                    col('priority.name', 'Priority', { width: '100px' }),
                    col('updated', 'Updated', { width: '120px', formatExpr: '=FormatUserDate(Field.updated)' }),
                ],
                { groupBy: ['project.name', 'status.name'] },
            ),
        ],
    },
};

export default sample;
