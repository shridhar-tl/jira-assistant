import { chart, col, columns, dateParameter, derivedSource, fields, header, hoursColumn, table, text, userGroupsParameter, worklogsSource } from '../builders';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'effort-by-project',
    title: 'Effort by project and issue type',
    description: 'Where the hours of the chosen user groups went in the period (this month by default), split by project and issue type.',
    category: 'time',
    icon: 'fa-chart-column',
    definition: {
        parameters: [
            userGroupsParameter,
            dateParameter('fromDate', 'From', 'Leave empty to start from the beginning of this month.'),
            dateParameter('toDate', 'To', 'Leave empty to end with this month.'),
        ],
        datasources: [
            worklogsSource('ds-worklogs', 'Worklogs', {
                userMode: 'expression',
                userExpression: 'GroupUsers(Parameters.groups)',
                issueFields: [fields.project, fields.issueType],
                defaultFrom: 'StartOf(\'month\', Today())',
                defaultTo: 'EndOf(\'month\', Today())',
            }),
            derivedSource('ds-by-project', 'HoursByProject', 'ds-worklogs', [
                {
                    type: 'group',
                    keys: [{ name: 'project', expression: 'Field.project.name' }],
                    aggregates: [
                        { name: 'hours', fn: 'sum', expression: 'Field.hours' },
                        { name: 'people', fn: 'countDistinct', expression: 'Field.authorName' },
                    ],
                },
                { type: 'window', partitionBy: [], orderBy: [{ expression: 'Field.hours', direction: 'desc' }], columns: [{ name: 'share', fn: 'percentOfTotal', field: 'hours' }] },
                { type: 'sort', keys: [{ expression: 'Field.hours', direction: 'desc' }] },
            ]),
            derivedSource('ds-by-type', 'HoursByProjectAndType', 'ds-worklogs', [
                {
                    type: 'group',
                    keys: [
                        { name: 'project', expression: 'Field.project.name' },
                        { name: 'issueType', expression: 'Field.issuetype.name' },
                    ],
                    aggregates: [{ name: 'hours', fn: 'sum', expression: 'Field.hours' }],
                },
                { type: 'sort', keys: [{ expression: 'Field.project', direction: 'asc' }, { expression: 'Field.hours', direction: 'desc' }] },
            ]),
        ],
        components: [
            header('title', 'Effort by project and issue type', 'h1'),
            text('intro', '=Concat(FormatNumber(Sum(Datasources.Worklogs, \'hours\'), 1), \' hours logged in total\')'),
            columns(
                'charts',
                [chart('project-chart', 'chart-donut', 'ds-by-project', { title: 'Hours by project', labelField: 'project', valueField: 'hours' })],
                [
                    chart('type-chart', 'chart-stacked-bar', 'ds-by-type', {
                        title: 'Hours by issue type',
                        xAxisField: 'project',
                        yAxisField: 'hours',
                        seriesField: 'issueType',
                        stacked: true,
                    }),
                ],
            ),
            table('projects', 'ds-by-project', [
                col('project', 'Project'),
                hoursColumn('hours', 'Hours'),
                col('share', 'Share', { width: '80px', align: 'right', formatExpr: '=Concat(Round(Field.share, 1), \'%\')' }),
                col('people', 'People', { width: '80px', align: 'right' }),
            ]),
            table('types', 'ds-by-type', [col('issueType', 'Issue type'), hoursColumn('hours', 'Hours')], { groupBy: 'project', showGroupFooter: true }),
        ],
    },
};

export default sample;
