import { chart, col, dateParameter, derivedSource, fields, header, hoursColumn, issueKeyColumn, table, text, worklogsSource } from '../builders';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'my-timesheet',
    title: 'My timesheet',
    description: 'The time you logged each day of the chosen period (this week by default), with every worklog grouped by day.',
    category: 'time',
    icon: 'fa-user-clock',
    definition: {
        parameters: [
            dateParameter('fromDate', 'From', 'Leave empty to start from the beginning of this week.'),
            dateParameter('toDate', 'To', 'Leave empty to end with this week.'),
        ],
        datasources: [
            worklogsSource('ds-worklogs', 'MyWorklogs', {
                userMode: 'me',
                issueFields: [fields.summary, fields.project],
                defaultFrom: "StartOf('week', Today())",
                defaultTo: "EndOf('week', Today())",
            }),
            derivedSource('ds-daily', 'DailyHours', 'ds-worklogs', [
                {
                    type: 'group',
                    keys: [{ name: 'date', expression: 'Field.date' }],
                    aggregates: [
                        { name: 'hours', fn: 'sum', expression: 'Field.hours' },
                        { name: 'issues', fn: 'countDistinct', expression: 'Field.issueKey' },
                    ],
                },
                { type: 'sort', keys: [{ expression: 'Field.date', direction: 'asc' }] },
                { type: 'computed', columns: [{ name: 'day', expression: "FormatDate(Field.date, 'ddd dd MMM')" }] },
            ]),
        ],
        components: [
            header('title', 'My timesheet', 'h1'),
            text('intro', "=Concat('Total logged: ', FormatNumber(Sum(Datasources.MyWorklogs, 'hours'), 2), ' hours on ', Count(Datasources.DailyHours), ' days')"),
            chart('daily-chart', 'chart-bar', 'ds-daily', { title: 'Hours per day', xAxisField: 'day', yAxisField: 'hours', showLegend: false, aggregation: 'none' }),
            table(
                'worklogs',
                'ds-worklogs',
                [
                    { ...issueKeyColumn, field: 'issueKey', cellItems: [{ id: 'key-link', type: 'field', fieldPath: 'issueKey', clickAction: 'link', href: '=IssueUrl(Field.issueKey)' }] },
                    col('summary', 'Summary'),
                    col('project.name', 'Project', { width: '150px' }),
                    col('started', 'Started', { width: '90px', formatExpr: '=FormatUserTime(Field.started)' }),
                    hoursColumn('hours', 'Hours'),
                    col('comment', 'Comment'),
                ],
                { groupBy: 'date', showGroupFooter: true },
            ),
        ],
    },
};

export default sample;
