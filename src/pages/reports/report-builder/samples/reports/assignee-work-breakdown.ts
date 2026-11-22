import { col, derivedSource, fields, header, issueKeyColumn, jqlSource, projectsParameter, repeater, subReport, table, text } from '../builders';
import { openJql, projectsJql } from '../jql';
import { sampleSubReportId } from '../sub-report-ids';
import type { BuilderSampleReport } from '../types';

const sampleId = 'assignee-work-breakdown';
const title = 'Open work by assignee with issue lists';
const assigneeName = 'IfNull(Field.assignee.displayName, \'Unassigned\')';

const sample: BuilderSampleReport = {
    id: sampleId,
    title,
    description: 'The open issues of the chosen projects counted by assignee, with a sub-report under each person that lists their issues.',
    category: 'issues',
    icon: 'fa-people-group',
    definition: {
        parameters: [projectsParameter],
        datasources: [
            jqlSource('ds-issues', 'Issues', `${projectsJql} AND ${openJql} ORDER BY key ASC`, [fields.summary, fields.status, fields.assignee, fields.priority, fields.issueType]),
            derivedSource('ds-assignees', 'Assignees', 'ds-issues', [
                {
                    type: 'group',
                    keys: [{ name: 'assignee', expression: assigneeName }],
                    aggregates: [{ name: 'issues', fn: 'count' }],
                },
                {
                    type: 'sort',
                    keys: [
                        { expression: 'Field.issues', direction: 'desc' },
                        { expression: 'Field.assignee', direction: 'asc' },
                    ],
                },
            ]),
        ],
        components: [
            header('title', 'Open work by assignee', 'h1'),
            text('prepared', '=Concat(\'Prepared for \', BuiltInFields.CurrentUserName, \' on \', FormatUserDate(Today()), \'. The issues of each person are listed by the sub-report under their name.\')'),
            table('summary', 'ds-assignees', [col('assignee', 'Assignee'), col('issues', 'Open issues', { width: '110px', align: 'right' })]),
            repeater('people', 'ds-assignees', [
                text('person', '=Concat(Field.assignee, \': \', Field.issues, IIf(Field.issues == 1, \' open issue\', \' open issues\'))', { fontSize: 15, fontWeight: 'bold' }),
                subReport('person-issues', sampleSubReportId(sampleId, 'assignee-issues'), { assignee: '=Field.assignee' }),
            ]),
        ],
    },
    subReports: [
        {
            key: 'assignee-issues',
            title: 'Open issues of one assignee',
            description: 'The open issues of the person named by the Assignee parameter, taken from the Issues datasource of the report that embeds it.',
            definition: {
                parentContext: {
                    reportId: sampleId,
                    reportTitle: title,
                    parameters: [projectsParameter],
                    datasources: [
                        {
                            id: 'ds-issues',
                            name: 'Issues',
                            fields: [
                                { name: 'key', type: 'string' },
                                { name: 'summary', type: 'string' },
                                { name: 'status', type: 'object', children: [{ name: 'name', type: 'string' }] },
                                { name: 'assignee', type: 'object', children: [{ name: 'displayName', type: 'string' }] },
                                { name: 'priority', type: 'object', children: [{ name: 'name', type: 'string' }] },
                                { name: 'issuetype', type: 'object', children: [{ name: 'name', type: 'string' }] },
                            ],
                        },
                    ],
                },
                parameters: [
                    {
                        id: 'p-assignee',
                        name: 'assignee',
                        label: 'Assignee',
                        description: 'Display name of the person whose issues are listed, or Unassigned.',
                        type: 'text',
                        mandatory: true,
                        typeConfig: {},
                    },
                ],
                datasources: [
                    derivedSource('ds-assignee-issues', 'AssigneeIssues', 'ds-issues', [{ type: 'filter', expression: `${assigneeName} == Parameters.assignee` }]),
                ],
                components: [
                    table('issues', 'ds-assignee-issues', [
                        issueKeyColumn,
                        col('summary', 'Summary'),
                        col('status.name', 'Status', { width: '120px' }),
                        col('priority.name', 'Priority', { width: '100px' }),
                        col('issuetype.name', 'Type', { width: '100px' }),
                    ]),
                ],
            },
        },
    ],
};

export default sample;
