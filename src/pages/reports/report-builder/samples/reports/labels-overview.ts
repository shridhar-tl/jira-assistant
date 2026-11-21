import { chart, col, columns, derivedSource, fields, header, jqlSource, numberParameter, projectsParameter, table, text } from '../builders';
import { projectsJql } from '../jql';
import type { BuilderSampleReport } from '../types';

const daysParameter = numberParameter('days', 'Created in the last (days)', 90);

const sample: BuilderSampleReport = {
    id: 'labels-overview',
    title: 'Label usage',
    description: 'How often each label was used on the issues created recently in the chosen projects, and how many of them are still open.',
    category: 'issues',
    icon: 'fa-tags',
    definition: {
        parameters: [projectsParameter, daysParameter],
        datasources: [
            jqlSource('ds-issues', 'RecentIssues', `${projectsJql} AND created >= -{{ Parameters.days }}d AND labels is not EMPTY`, [fields.labels, fields.status]),
            derivedSource('ds-labels', 'LabelCounts', 'ds-issues', [
                { type: 'flatten', childField: 'labels', keepEmpty: false },
                {
                    type: 'group',
                    keys: [{ name: 'label', expression: 'Field.labels' }],
                    aggregates: [
                        { name: 'issues', fn: 'count' },
                        { name: 'open', fn: 'sum', expression: "IIf(Field.status.statusCategory.key == 'done', 0, 1)" },
                    ],
                },
                { type: 'sort', keys: [{ expression: 'Field.issues', direction: 'desc' }] },
                { type: 'window', partitionBy: [], orderBy: [{ expression: 'Field.issues', direction: 'desc' }], columns: [{ name: 'rank', fn: 'rank' }] },
            ]),
            derivedSource('ds-top', 'TopLabels', 'ds-labels', [{ type: 'limit', count: 15 }]),
        ],
        components: [
            header('title', 'Label usage', 'h1'),
            text('intro', 'An issue with several labels is counted once for each label.'),
            columns(
                'overview',
                [chart('labels-chart', 'chart-horizontal-bar', 'ds-top', { title: 'Top 15 labels', xAxisField: 'label', yAxisField: 'issues', showLegend: false })],
                [
                    table('labels', 'ds-labels', [
                        col('rank', '#', { width: '50px', align: 'right' }),
                        col('label', 'Label'),
                        col('issues', 'Issues', { width: '80px', align: 'right' }),
                        col('open', 'Open', { width: '80px', align: 'right' }),
                    ]),
                ],
            ),
        ],
    },
};

export default sample;
