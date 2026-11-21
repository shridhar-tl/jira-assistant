import { chart, col, columns, dateColumn, derivedSource, fields, header, issueKeyColumn, jqlSource, projectsParameter, rule, table, text } from '../builders';
import { openJql, projectsJql } from '../jql';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'bugs-by-priority',
    title: 'Open bugs by priority',
    description: 'Open bugs of the chosen projects by priority and component, with the high priority bugs listed first.',
    category: 'issues',
    icon: 'fa-bug',
    definition: {
        parameters: [projectsParameter],
        datasources: [
            jqlSource('ds-bugs', 'OpenBugs', `${projectsJql} AND issuetype = Bug AND ${openJql} ORDER BY priority DESC, created ASC`, [
                fields.summary,
                fields.status,
                fields.priority,
                fields.assignee,
                fields.components,
                fields.created,
            ]),
            derivedSource('ds-by-priority', 'BugsByPriority', 'ds-bugs', [
                {
                    type: 'group',
                    keys: [{ name: 'priority', expression: "IfNull(Field.priority.name, 'None')" }],
                    aggregates: [
                        { name: 'bugs', fn: 'count' },
                        { name: 'unassigned', fn: 'sum', expression: 'IIf(IsNull(Field.assignee), 1, 0)' },
                    ],
                },
                { type: 'sort', keys: [{ expression: 'Field.bugs', direction: 'desc' }] },
            ]),
            derivedSource('ds-by-component', 'BugsByComponent', 'ds-bugs', [
                { type: 'flatten', childField: 'components', childPrefix: 'component_', keepEmpty: true },
                {
                    type: 'group',
                    keys: [{ name: 'component', expression: "IfNull(Field.component_name, 'No component')" }],
                    aggregates: [{ name: 'bugs', fn: 'count' }],
                },
                { type: 'sort', keys: [{ expression: 'Field.bugs', direction: 'desc' }] },
                { type: 'limit', count: 10 },
            ]),
        ],
        components: [
            header('title', 'Open bugs by priority', 'h1'),
            text('intro', 'A bug with several components is counted once for each of them in the component chart.'),
            columns(
                'charts',
                [chart('priority-chart', 'chart-pie', 'ds-by-priority', { title: 'Bugs by priority', labelField: 'priority', valueField: 'bugs' })],
                [chart('component-chart', 'chart-horizontal-bar', 'ds-by-component', { title: 'Top components', xAxisField: 'component', yAxisField: 'bugs', showLegend: false })],
            ),
            table('priority-table', 'ds-by-priority', [
                col('priority', 'Priority'),
                col('bugs', 'Open bugs', { width: '100px', align: 'right' }),
                col('unassigned', 'Unassigned', {
                    width: '100px',
                    align: 'right',
                    conditionalFormats: [rule('no-owner', 'Field.unassigned > 0', '#fef3c7', '#92400e', true)],
                }),
            ]),
            header('list-title', 'Bugs', 'h3'),
            table(
                'bugs',
                'ds-bugs',
                [
                    issueKeyColumn,
                    col('summary', 'Summary'),
                    col('status.name', 'Status', { width: '120px' }),
                    col('assignee.displayName', 'Assignee', { width: '150px' }),
                    dateColumn('created', 'Reported'),
                ],
                { groupBy: 'priority.name' },
            ),
        ],
    },
};

export default sample;
