import { col, dateColumn, fields, header, issueKeyColumn, jqlSource, projectsParameter, rule, table, text } from '../builders';
import { openJql, projectsJql } from '../jql';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'unassigned-backlog',
    title: 'Unassigned backlog',
    description: 'Open issues of the chosen projects that nobody is working on, most important and oldest first.',
    category: 'issues',
    icon: 'fa-user-slash',
    definition: {
        parameters: [projectsParameter],
        datasources: [
            jqlSource('ds-unassigned', 'Unassigned', `${projectsJql} AND ${openJql} AND assignee is EMPTY ORDER BY priority DESC, created ASC`, [
                fields.summary,
                fields.issueType,
                fields.status,
                fields.priority,
                fields.reporter,
                fields.created,
                fields.issueAge,
            ]),
        ],
        components: [
            header('title', 'Unassigned backlog', 'h1'),
            text('intro', 'Issues waiting for an owner. Issues waiting for more than 60 days are highlighted.'),
            table(
                'backlog',
                'ds-unassigned',
                [
                    issueKeyColumn,
                    col('summary', 'Summary'),
                    col('issuetype.name', 'Type', { width: '100px' }),
                    col('priority.name', 'Priority', { width: '100px' }),
                    col('status.name', 'Status', { width: '120px' }),
                    col('reporter.displayName', 'Reporter', { width: '150px' }),
                    dateColumn('created', 'Created'),
                    col('issueAge', 'Waiting (days)', {
                        width: '110px',
                        align: 'right',
                        conditionalFormats: [rule('stale', 'Field.issueAge > 60', '#fee2e2', '#991b1b', true)],
                    }),
                ],
                {
                    headRows: [
                        {
                            id: 'count',
                            cells: [{ colSpan: 8, textExpression: "=Concat(Count(Datasources.Unassigned), ' unassigned open issues')" }],
                        },
                    ],
                },
            ),
        ],
    },
};

export default sample;
