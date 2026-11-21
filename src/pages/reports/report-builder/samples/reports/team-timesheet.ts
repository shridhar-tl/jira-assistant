import { chart, col, dateParameter, derivedSource, header, hoursColumn, rule, table, text, userGroupsParameter, worklogsSource } from '../builders';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'team-timesheet',
    title: 'Team timesheet',
    description: 'Hours logged by every member of the chosen user groups on each day of the period, with daily totals per person.',
    category: 'time',
    icon: 'fa-users-viewfinder',
    definition: {
        parameters: [
            userGroupsParameter,
            dateParameter('fromDate', 'From', 'Leave empty to start from the beginning of this week.'),
            dateParameter('toDate', 'To', 'Leave empty to end with this week.'),
        ],
        datasources: [
            worklogsSource('ds-worklogs', 'TeamWorklogs', {
                userMode: 'expression',
                userExpression: 'GroupUsers(Parameters.groups)',
                defaultFrom: "StartOf('week', Today())",
                defaultTo: "EndOf('week', Today())",
            }),
            derivedSource('ds-daily', 'DailyHours', 'ds-worklogs', [
                {
                    type: 'group',
                    keys: [
                        { name: 'user', expression: 'Field.authorName' },
                        { name: 'date', expression: 'Field.date' },
                    ],
                    aggregates: [{ name: 'hours', fn: 'sum', expression: 'Field.hours' }],
                },
                { type: 'sort', keys: [{ expression: 'Field.date', direction: 'asc' }] },
                { type: 'computed', columns: [{ name: 'day', expression: "FormatDate(Field.date, 'ddd dd MMM')" }] },
            ]),
            derivedSource('ds-people', 'HoursPerPerson', 'ds-worklogs', [
                {
                    type: 'group',
                    keys: [{ name: 'user', expression: 'Field.authorName' }],
                    aggregates: [
                        { name: 'hours', fn: 'sum', expression: 'Field.hours' },
                        { name: 'days', fn: 'countDistinct', expression: 'Field.date' },
                        { name: 'issues', fn: 'countDistinct', expression: 'Field.issueKey' },
                    ],
                },
                { type: 'computed', columns: [{ name: 'perDay', expression: 'IIf(Field.days == 0, 0, Field.hours / Field.days)' }] },
                { type: 'sort', keys: [{ expression: 'Field.hours', direction: 'desc' }] },
            ]),
        ],
        components: [
            header('title', 'Team timesheet', 'h1'),
            text('intro', 'People averaging less than six hours on the days they logged time are highlighted.'),
            chart('people-chart', 'chart-horizontal-bar', 'ds-people', { title: 'Hours per person', xAxisField: 'user', yAxisField: 'hours', showLegend: false }),
            table('people', 'ds-people', [
                col('user', 'Person'),
                hoursColumn('hours', 'Hours'),
                col('days', 'Days', { width: '80px', align: 'right' }),
                col('issues', 'Issues', { width: '80px', align: 'right' }),
                col('perDay', 'Per day', {
                    width: '90px',
                    align: 'right',
                    formatExpr: '=FormatNumber(Field.perDay, 1)',
                    conditionalFormats: [rule('low', 'Field.perDay < 6', '#fef3c7', '#92400e', true)],
                }),
            ]),
            header('grid-title', 'Hours per day', 'h3'),
            table('grid', 'ds-daily', [col('user', 'Person'), col('day', 'Day'), hoursColumn('hours', 'Hours')], {
                pivotMode: true,
                pivotRowField: 'user',
                pivotColumnField: 'day',
                pivotValueField: 'hours',
                pivotAggregation: 'sum',
            }),
        ],
    },
};

export default sample;
