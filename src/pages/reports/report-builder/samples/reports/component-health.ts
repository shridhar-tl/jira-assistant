import { chart, col, derivedSource, fields, header, jqlSource, projectsParameter, rule, table, text } from '../builders';
import { openJql, projectsJql } from '../jql';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'component-health',
    title: 'Component health',
    description: 'Open issues and bugs of each component of the chosen projects, with their average age and the share of unassigned work.',
    category: 'releases',
    icon: 'fa-cubes',
    definition: {
        parameters: [projectsParameter],
        datasources: [
            jqlSource('ds-open', 'OpenIssues', `${projectsJql} AND ${openJql}`, [fields.components, fields.issueType, fields.assignee, fields.issueAge]),
            derivedSource('ds-health', 'ComponentHealth', 'ds-open', [
                { type: 'flatten', childField: 'components', childPrefix: 'component_', keepEmpty: true },
                {
                    type: 'group',
                    keys: [{ name: 'component', expression: "IfNull(Field.component_name, 'No component')" }],
                    aggregates: [
                        { name: 'open', fn: 'count' },
                        { name: 'bugs', fn: 'sum', expression: "IIf(Field.issuetype.name == 'Bug', 1, 0)" },
                        { name: 'unassigned', fn: 'sum', expression: 'IIf(IsNull(Field.assignee), 1, 0)' },
                        { name: 'averageAge', fn: 'avg', expression: 'Field.issueAge' },
                    ],
                },
                {
                    type: 'computed',
                    columns: [
                        { name: 'bugShare', expression: 'Percent(Field.bugs, Field.open, 0)' },
                        { name: 'unassignedShare', expression: 'Percent(Field.unassigned, Field.open, 0)' },
                    ],
                },
                { type: 'sort', keys: [{ expression: 'Field.open', direction: 'desc' }] },
            ]),
        ],
        components: [
            header('title', 'Component health', 'h1'),
            text('intro', 'Components where more than half of the open work is bugs, or more than a third is unassigned, are highlighted.'),
            chart('health-chart', 'chart-bar', 'ds-health', {
                title: 'Open issues and bugs',
                xAxisField: 'component',
                series: [
                    { id: 's-open', label: 'Open issues', valueField: 'open', color: '#6366f1' },
                    { id: 's-bugs', label: 'Bugs', valueField: 'bugs', color: '#ef4444' },
                ],
            }),
            table('health', 'ds-health', [
                col('component', 'Component'),
                col('open', 'Open', { width: '80px', align: 'right' }),
                col('bugs', 'Bugs', { width: '80px', align: 'right' }),
                col('bugShare', 'Bug %', {
                    width: '80px',
                    align: 'right',
                    formatExpr: "=Concat(Field.bugShare, '%')",
                    conditionalFormats: [rule('buggy', 'Field.bugShare > 50', '#fee2e2', '#991b1b', true)],
                }),
                col('unassignedShare', 'Unassigned %', {
                    width: '110px',
                    align: 'right',
                    formatExpr: "=Concat(Field.unassignedShare, '%')",
                    conditionalFormats: [rule('ownerless', 'Field.unassignedShare > 33', '#fef3c7', '#92400e', true)],
                }),
                col('averageAge', 'Avg age (days)', { width: '120px', align: 'right', formatExpr: '=FormatNumber(Field.averageAge, 0)' }),
            ]),
        ],
    },
};

export default sample;
