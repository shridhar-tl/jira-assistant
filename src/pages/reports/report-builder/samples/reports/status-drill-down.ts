import { chart, col, columns, derivedSource, fields, header, issueKeyColumn, jqlSource, projectsParameter, table, text } from '../builders';
import { projectsJql } from '../jql';
import type { BuilderSampleReport } from '../types';

const toggleStatus = 'IIf(Variables.selectedStatus == Field.status, null, Field.status)';

const sample: BuilderSampleReport = {
    id: 'status-drill-down',
    title: 'Issues by status with drill-down',
    description: 'The issues of the chosen projects counted by status. Click a status to list only its issues, and click it again to list them all.',
    category: 'issues',
    icon: 'fa-filter',
    definition: {
        parameters: [projectsParameter],
        variables: [
            {
                id: 'v-selected-status',
                name: 'selectedStatus',
                scope: 'global',
                description: 'Status clicked in the summary table. Empty lists the issues of every status.',
            },
        ],
        datasources: [
            jqlSource('ds-issues', 'Issues', `${projectsJql} ORDER BY key ASC`, [fields.summary, fields.status, fields.assignee, fields.priority, fields.issueType]),
            derivedSource('ds-status', 'StatusCounts', 'ds-issues', [
                {
                    type: 'group',
                    keys: [{ name: 'status', expression: 'Field.status.name' }],
                    aggregates: [{ name: 'issues', fn: 'count' }],
                },
                { type: 'sort', keys: [{ expression: 'Field.issues', direction: 'desc' }] },
            ]),
        ],
        components: [
            header('title', 'Issues by status', 'h1'),
            text('prepared', '=Concat(\'Prepared for \', BuiltInFields.CurrentUserName, \' on \', FormatUserDate(Today()))'),
            columns(
                'summary',
                [
                    table('status-table', 'ds-status', [
                        col('status', 'Status', {
                            cellItems: [
                                {
                                    id: 'pick-status',
                                    type: 'field',
                                    fieldPath: 'status',
                                    clickAction: 'set-variable',
                                    setVariableName: 'selectedStatus',
                                    setVariableValueExpr: toggleStatus,
                                },
                            ],
                        }),
                        col('issues', 'Issues', { width: '80px', align: 'right' }),
                    ]),
                ],
                [chart('status-chart', 'chart-pie', 'ds-status', { title: 'Share of issues', labelField: 'status', valueField: 'issues' })],
            ),
            text(
                'selection',
                '=IIf(IsNull(Variables.selectedStatus), \'Showing the issues of every status. Click a status to list only its issues.\', Concat(\'Showing the issues in \', Variables.selectedStatus, \'. Click it again to list every issue.\'))',
            ),
            table(
                'issues',
                'ds-issues',
                [
                    issueKeyColumn,
                    col('summary', 'Summary'),
                    col('status.name', 'Status', { width: '120px' }),
                    col('issuetype.name', 'Type', { width: '100px' }),
                    col('priority.name', 'Priority', { width: '100px' }),
                    col('assignee.displayName', 'Assignee', { width: '160px' }),
                ],
                { rowVisibleExpr: 'IsNull(Variables.selectedStatus) || Field.status.name == Variables.selectedStatus' },
            ),
        ],
    },
};

export default sample;
