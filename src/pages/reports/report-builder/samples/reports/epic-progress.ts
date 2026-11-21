import { chart, col, derivedSource, fields, header, jqlSource, projectsParameter, rule, table, text } from '../builders';
import { projectsJql } from '../jql';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'epic-progress',
    title: 'Progress of parent issues',
    description: 'For each epic or parent issue of the chosen projects: how many child issues and story points are done.',
    category: 'releases',
    icon: 'fa-sitemap',
    definition: {
        parameters: [projectsParameter],
        datasources: [
            jqlSource('ds-children', 'ChildIssues', `${projectsJql} AND parent is not EMPTY AND issuetype not in subTaskIssueTypes()`, [
                fields.parent,
                fields.status,
                fields.storyPoints,
            ]),
            derivedSource('ds-progress', 'ParentProgress', 'ds-children', [
                {
                    type: 'group',
                    keys: [
                        { name: 'parentKey', expression: 'Field.parent.key' },
                        { name: 'parentSummary', expression: 'Field.parent.fields.summary' },
                        { name: 'parentStatus', expression: 'Field.parent.fields.status.name' },
                    ],
                    aggregates: [
                        { name: 'children', fn: 'count' },
                        { name: 'done', fn: 'sum', expression: "IIf(Field.status.statusCategory.key == 'done', 1, 0)" },
                        { name: 'points', fn: 'sum', expression: 'IfNull(Field.storyPoints, 0)' },
                        { name: 'donePoints', fn: 'sum', expression: "IIf(Field.status.statusCategory.key == 'done', IfNull(Field.storyPoints, 0), 0)" },
                    ],
                },
                {
                    type: 'computed',
                    columns: [
                        { name: 'percentDone', expression: 'Percent(Field.done, Field.children, 0)' },
                        { name: 'label', expression: "Concat(Field.parentKey, ' ', Mid(Field.parentSummary, 1, 40))" },
                    ],
                },
                { type: 'sort', keys: [{ expression: 'Field.percentDone', direction: 'asc' }] },
            ]),
        ],
        components: [
            header('title', 'Progress of parent issues', 'h1'),
            text('intro', 'Sub-tasks are not counted. Parents that are done while children are still open are highlighted.'),
            chart('progress-chart', 'chart-horizontal-bar', 'ds-progress', {
                title: 'Percent of children done',
                xAxisField: 'label',
                yAxisField: 'percentDone',
                showLegend: false,
                yAxis: { beginAtZero: true, max: 100 },
            }),
            table('parents', 'ds-progress', [
                col('parentKey', 'Parent', {
                    width: '110px',
                    cellItems: [{ id: 'parent-link', type: 'field', fieldPath: 'parentKey', clickAction: 'link', href: '=IssueUrl(Field.parentKey)' }],
                }),
                col('parentSummary', 'Summary'),
                col('parentStatus', 'Status', {
                    width: '120px',
                    conditionalFormats: [rule('closed-early', "Field.parentStatus == 'Done' && Field.done < Field.children", '#fee2e2', '#991b1b', true)],
                }),
                col('children', 'Children', { width: '80px', align: 'right' }),
                col('done', 'Done', { width: '80px', align: 'right' }),
                col('points', 'Points', { width: '80px', align: 'right' }),
                col('donePoints', 'Done points', { width: '100px', align: 'right' }),
                col('percentDone', 'Done %', {
                    width: '80px',
                    align: 'right',
                    formatExpr: "=Concat(Field.percentDone, '%')",
                    conditionalFormats: [rule('complete', 'Field.percentDone == 100', '#dcfce7', '#166534', true)],
                }),
            ]),
        ],
    },
};

export default sample;
