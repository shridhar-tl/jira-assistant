import { col, dateColumn, derivedSource, fields, header, issueKeyColumn, jqlSource, numberParameter, projectsParameter, rule, table, text } from '../builders';
import { openJql, projectsJql } from '../jql';
import type { BuilderSampleReport } from '../types';

const daysParameter = numberParameter('days', 'Due within (days)', 14);

const sample: BuilderSampleReport = {
    id: 'due-soon',
    title: 'Overdue and due soon',
    description: 'Open issues of the chosen projects that are overdue or due in the next days, grouped by assignee.',
    category: 'issues',
    icon: 'fa-calendar-xmark',
    definition: {
        parameters: [projectsParameter, daysParameter],
        datasources: [
            jqlSource('ds-due', 'DueIssues', `${projectsJql} AND ${openJql} AND duedate <= {{ Parameters.days }}d ORDER BY duedate ASC`, [
                fields.summary,
                fields.status,
                fields.assignee,
                fields.priority,
                fields.dueDate,
            ]),
            derivedSource('ds-days-left', 'DueWithDaysLeft', 'ds-due', [
                {
                    type: 'computed',
                    columns: [
                        { name: 'assigneeName', expression: "IfNull(Field.assignee.displayName, 'Unassigned')" },
                        { name: 'daysLeft', expression: "DateDiff('day', Today(), Field.duedate)" },
                    ],
                },
                { type: 'sort', keys: [{ expression: 'Field.assigneeName', direction: 'asc' }, { expression: 'Field.daysLeft', direction: 'asc' }] },
            ]),
        ],
        components: [
            header('title', 'Overdue and due soon', 'h1'),
            text('intro', 'Overdue issues are shown in red and issues due in the next three days in amber.'),
            table(
                'due',
                'ds-days-left',
                [
                    issueKeyColumn,
                    col('summary', 'Summary'),
                    col('status.name', 'Status', { width: '120px' }),
                    col('priority.name', 'Priority', { width: '100px' }),
                    dateColumn('duedate', 'Due'),
                    col('daysLeft', 'Days left', {
                        width: '90px',
                        align: 'right',
                        conditionalFormats: [
                            rule('overdue', 'Field.daysLeft < 0', '#fee2e2', '#991b1b', true),
                            rule('soon', 'Field.daysLeft >= 0 && Field.daysLeft <= 3', '#fef3c7', '#92400e', true),
                        ],
                    }),
                ],
                { groupBy: 'assigneeName', showGroupFooter: true },
            ),
        ],
    },
};

export default sample;
