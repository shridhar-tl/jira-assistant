import { chart, col, derivedSource, fields, header, hoursColumn, issueKeyColumn, jqlSource, numberParameter, projectsParameter, rule, table, text } from '../builders';
import { projectsJql } from '../jql';
import type { BuilderSampleReport } from '../types';

const daysParameter = numberParameter('days', 'Resolved in the last (days)', 30);

const sample: BuilderSampleReport = {
    id: 'estimate-vs-actual',
    title: 'Estimate vs actual',
    description: 'Original estimate compared with the time logged on the issues resolved recently in the chosen projects, per assignee and per issue.',
    category: 'time',
    icon: 'fa-scale-balanced',
    definition: {
        parameters: [projectsParameter, daysParameter],
        datasources: [
            jqlSource('ds-resolved', 'ResolvedIssues', `${projectsJql} AND resolutiondate >= -{{ Parameters.days }}d AND originalEstimate > 0`, [
                fields.summary,
                fields.assignee,
                fields.issueType,
                fields.originalEstimate,
                fields.timeSpent,
            ]),
            derivedSource('ds-variance', 'EstimateVariance', 'ds-resolved', [
                {
                    type: 'computed',
                    columns: [
                        { name: 'assigneeName', expression: 'IfNull(Field.assignee.displayName, \'Unassigned\')' },
                        { name: 'estimateHours', expression: 'Hours(IfNull(Field.timeoriginalestimate, 0), 2)' },
                        { name: 'actualHours', expression: 'Hours(IfNull(Field.timespent, 0), 2)' },
                        { name: 'variance', expression: 'Field.actualHours - Field.estimateHours' },
                        { name: 'accuracy', expression: 'Percent(Field.estimateHours, Field.actualHours, 0)' },
                    ],
                },
                { type: 'sort', keys: [{ expression: 'Field.variance', direction: 'desc' }] },
            ]),
            derivedSource('ds-by-assignee', 'VarianceByAssignee', 'ds-variance', [
                {
                    type: 'group',
                    keys: [{ name: 'assignee', expression: 'Field.assigneeName' }],
                    aggregates: [
                        { name: 'issues', fn: 'count' },
                        { name: 'estimateHours', fn: 'sum', expression: 'Field.estimateHours' },
                        { name: 'actualHours', fn: 'sum', expression: 'Field.actualHours' },
                    ],
                },
                { type: 'computed', columns: [{ name: 'variance', expression: 'Field.actualHours - Field.estimateHours' }] },
                { type: 'sort', keys: [{ expression: 'Field.actualHours', direction: 'desc' }] },
            ]),
        ],
        components: [
            header('title', 'Estimate vs actual', 'h1'),
            text('intro', 'Accuracy is the estimate as a percent of the time logged. Issues that took more than 50% longer than estimated are highlighted.'),
            chart('assignee-chart', 'chart-bar', 'ds-by-assignee', {
                title: 'Estimated and logged hours',
                xAxisField: 'assignee',
                series: [
                    { id: 's-estimate', label: 'Estimate', valueField: 'estimateHours', color: '#94a3b8' },
                    { id: 's-actual', label: 'Logged', valueField: 'actualHours', color: '#6366f1' },
                ],
            }),
            table('assignees', 'ds-by-assignee', [
                col('assignee', 'Assignee'),
                col('issues', 'Issues', { width: '80px', align: 'right' }),
                hoursColumn('estimateHours', 'Estimate'),
                hoursColumn('actualHours', 'Logged'),
                hoursColumn('variance', 'Variance'),
            ]),
            header('issues-title', 'Issues', 'h3'),
            table('issues', 'ds-variance', [
                issueKeyColumn,
                col('summary', 'Summary'),
                col('assigneeName', 'Assignee', { width: '150px' }),
                hoursColumn('estimateHours', 'Estimate'),
                hoursColumn('actualHours', 'Logged'),
                col('accuracy', 'Accuracy', {
                    width: '90px',
                    align: 'right',
                    formatExpr: '=Concat(Field.accuracy, \'%\')',
                    conditionalFormats: [rule('over', 'Field.actualHours > Field.estimateHours * 1.5', '#fee2e2', '#991b1b', true)],
                }),
            ]),
        ],
    },
};

export default sample;
