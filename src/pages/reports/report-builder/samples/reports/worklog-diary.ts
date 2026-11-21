import { col, dateParameter, derivedSource, fields, header, hoursColumn, rule, table, text, worklogsSource } from '../builders';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'worklog-diary',
    title: 'My work diary',
    description: 'What you worked on each day of the last seven days, with your worklog comments. Handy for stand-ups and status mails.',
    category: 'time',
    icon: 'fa-book-open',
    definition: {
        parameters: [
            dateParameter('fromDate', 'From', 'Leave empty for the last seven days.'),
            dateParameter('toDate', 'To', 'Leave empty to end today.'),
        ],
        datasources: [
            worklogsSource('ds-worklogs', 'MyWorklogs', {
                userMode: 'me',
                issueFields: [fields.summary, fields.status],
                defaultFrom: "DateAdd('day', -6, Today())",
                defaultTo: 'Today()',
            }),
            derivedSource('ds-diary', 'Diary', 'ds-worklogs', [
                { type: 'sort', keys: [{ expression: 'Field.started', direction: 'desc' }] },
                {
                    type: 'computed',
                    columns: [
                        { name: 'day', expression: "FormatDate(Field.date, 'dddd, dd MMM')" },
                        { name: 'task', expression: "Concat(Field.issueKey, ' · ', Field.summary)" },
                    ],
                },
            ]),
        ],
        components: [
            header('title', 'My work diary', 'h1'),
            text('intro', 'Worklogs without a comment are highlighted, so you can add the missing details in Jira.'),
            table(
                'diary',
                'ds-diary',
                [
                    col('task', 'Issue', {
                        cellItems: [{ id: 'task-link', type: 'field', fieldPath: 'task', clickAction: 'link', href: '=IssueUrl(Field.issueKey)' }],
                    }),
                    col('status.name', 'Status', { width: '120px' }),
                    hoursColumn('hours', 'Hours'),
                    col('comment', 'Comment', { conditionalFormats: [rule('no-comment', "Field.comment == ''", '#fef3c7', '#92400e')] }),
                ],
                { groupBy: 'day', showGroupFooter: true },
            ),
        ],
    },
};

export default sample;
