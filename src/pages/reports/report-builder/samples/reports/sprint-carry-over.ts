import { col, derivedSource, fields, header, issueKeyColumn, rule, sprintIssuesSource, sprintsParameter, table, text } from '../builders';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'sprint-carry-over',
    title: 'Unfinished sprint work',
    description: 'Issues of the chosen sprints that are not done yet, oldest first, with the story points and hours still remaining.',
    category: 'sprints',
    icon: 'fa-hourglass-half',
    definition: {
        parameters: [sprintsParameter],
        datasources: [
            sprintIssuesSource(
                'ds-open',
                'OpenSprintIssues',
                [fields.summary, fields.status, fields.assignee, fields.priority, fields.storyPoints, fields.remainingEstimate, fields.issueAge],
                'statusCategory != Done',
            ),
            derivedSource('ds-sorted', 'OpenByAge', 'ds-open', [
                { type: 'computed', columns: [{ name: 'remainingHours', expression: 'Hours(IfNull(Field.timeestimate, 0), 1)' }] },
                { type: 'sort', keys: [{ expression: 'Field.issueAge', direction: 'desc' }] },
            ]),
        ],
        components: [
            header('title', 'Unfinished sprint work', 'h1'),
            text('intro', 'Issues older than 30 days are highlighted. Use this list in the sprint review to decide what to carry over.'),
            table(
                'open',
                'ds-sorted',
                [
                    issueKeyColumn,
                    col('summary', 'Summary'),
                    col('status.name', 'Status', { width: '120px' }),
                    col('assignee.displayName', 'Assignee', { width: '150px' }),
                    col('priority.name', 'Priority', { width: '90px' }),
                    col('storyPoints', 'Points', { width: '70px', align: 'right' }),
                    col('remainingHours', 'Remaining h', { width: '100px', align: 'right' }),
                    col('issueAge', 'Age (days)', {
                        width: '90px',
                        align: 'right',
                        conditionalFormats: [rule('old', 'Field.issueAge > 30', '#fef3c7', '#92400e', true)],
                    }),
                ],
                {
                    footerRows: [
                        {
                            id: 'totals',
                            cells: [
                                { colSpan: 5, textExpression: "=Concat(Count(Datasources.OpenByAge), ' open issues')" },
                                { align: 'right', textExpression: "=Sum(Datasources.OpenByAge, 'storyPoints')" },
                                { align: 'right', textExpression: "=FormatNumber(Sum(Datasources.OpenByAge, 'remainingHours'), 1)" },
                                {},
                            ],
                        },
                    ],
                },
            ),
        ],
    },
};

export default sample;
