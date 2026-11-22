import { col, fields, header, hoursColumn, issueKeyColumn, jqlSource, rule, table, text } from '../builders';
import { openJql } from '../jql';
import type { BuilderSampleReport } from '../types';

const remainingDays = '=FormatNumber(Hours(Field.timeestimate, 2) / Variables.hoursPerDay, 1)';

const sample: BuilderSampleReport = {
    id: 'my-open-work',
    title: 'My open work',
    description: 'The open issues assigned to you, with the days of work left at your daily hours and the issues waiting too long highlighted.',
    category: 'issues',
    icon: 'fa-user-check',
    definition: {
        parameters: [],
        variables: [
            {
                id: 'v-hours-per-day',
                name: 'hoursPerDay',
                scope: 'global',
                description: 'Hours of work in a day, taken from the maximum hours per day of your settings, or 8 when it is not set.',
                defaultValueExpression: '=IfNull(BuiltInFields.MaxHoursPerDay, 8)',
            },
        ],
        datasources: [
            jqlSource('ds-mine', 'MyOpenIssues', `assignee = currentUser() AND ${openJql} ORDER BY priority DESC, updated DESC`, [
                fields.summary,
                fields.status,
                fields.priority,
                fields.project,
                fields.remainingEstimate,
                fields.issueAge,
            ]),
        ],
        components: [
            header('title', '=Concat(\'Open work of \', BuiltInFields.CurrentUserName)', 'h1'),
            text(
                'totals',
                '=Concat(Count(Datasources.MyOpenIssues), \' open issues with \', FormatNumber(Sum(Datasources.MyOpenIssues, \'timeestimate\') / 3600 / Variables.hoursPerDay, 1), \' days of work left at \', Variables.hoursPerDay, \' hours a day.\')',
            ),
            text('legend', 'Issues waiting longer than 30 days since they were created are highlighted.'),
            {
                ...table('issues', 'ds-mine', [
                    issueKeyColumn,
                    col('summary', 'Summary'),
                    col('project.name', 'Project', { width: '150px' }),
                    col('status.name', 'Status', { width: '120px' }),
                    col('priority.name', 'Priority', { width: '100px' }),
                    hoursColumn('timeestimate', 'Remaining hours', true),
                    { ...col('timeestimate', 'Days left', { width: '90px', align: 'right', formatExpr: remainingDays }), id: 'col-days-left' },
                    col('issueAge', 'Age (days)', {
                        width: '100px',
                        align: 'right',
                        conditionalFormats: [rule('waiting', 'Field.issueAge > Variables.staleAfterDays', '#fef3c7', '#92400e', true)],
                    }),
                ]),
                variables: [
                    {
                        id: 'v-stale-after',
                        name: 'staleAfterDays',
                        scope: 'component',
                        description: 'Age in days after which an issue is highlighted.',
                        defaultValueExpression: '=30',
                    },
                ],
            },
        ],
    },
};

export default sample;
