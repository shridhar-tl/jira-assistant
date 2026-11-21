import { chart, col, derivedSource, fields, header, issueKeyColumn, jqlSource, projectsParameter, rule, table, text } from '../builders';
import { projectsJql } from '../jql';
import type { BuilderSampleReport } from '../types';

const sample: BuilderSampleReport = {
    id: 'release-scope',
    title: 'Unreleased version scope',
    description: 'Progress of every unreleased version of the chosen projects: issues to do, in progress and done, with the release date.',
    category: 'releases',
    icon: 'fa-rocket',
    definition: {
        parameters: [projectsParameter],
        datasources: [
            jqlSource('ds-issues', 'VersionIssues', `${projectsJql} AND fixVersion in unreleasedVersions()`, [
                fields.summary,
                fields.status,
                fields.assignee,
                fields.issueType,
                fields.fixVersions,
                fields.storyPoints,
            ]),
            derivedSource('ds-by-version', 'IssuesPerVersion', 'ds-issues', [
                { type: 'flatten', childField: 'fixVersions', childPrefix: 'version_', keepEmpty: false },
                { type: 'filter', expression: 'Field.version_released != true' },
                { type: 'computed', columns: [{ name: 'category', expression: 'Field.status.statusCategory.name' }] },
            ]),
            derivedSource('ds-progress', 'VersionProgress', 'ds-by-version', [
                {
                    type: 'group',
                    keys: [
                        { name: 'version', expression: 'Field.version_name' },
                        { name: 'releaseDate', expression: 'Field.version_releaseDate' },
                    ],
                    aggregates: [
                        { name: 'issues', fn: 'count' },
                        { name: 'toDo', fn: 'sum', expression: "IIf(Field.status.statusCategory.key == 'new', 1, 0)" },
                        { name: 'inProgress', fn: 'sum', expression: "IIf(Field.status.statusCategory.key == 'indeterminate', 1, 0)" },
                        { name: 'done', fn: 'sum', expression: "IIf(Field.status.statusCategory.key == 'done', 1, 0)" },
                        { name: 'points', fn: 'sum', expression: 'IfNull(Field.storyPoints, 0)' },
                    ],
                },
                {
                    type: 'computed',
                    columns: [
                        { name: 'percentDone', expression: 'Percent(Field.done, Field.issues, 0)' },
                        { name: 'daysToRelease', expression: "IIf(IsNull(Field.releaseDate), null, DateDiff('day', Today(), Field.releaseDate))" },
                    ],
                },
                { type: 'sort', keys: [{ expression: "IfNull(Field.releaseDate, '9999-12-31')", direction: 'asc' }] },
            ]),
        ],
        components: [
            header('title', 'Unreleased version scope', 'h1'),
            text('intro', 'An issue in several versions is counted in each of them. Versions past their release date are highlighted.'),
            chart('progress-chart', 'chart-stacked-bar', 'ds-progress', {
                title: 'Issues per version',
                xAxisField: 'version',
                stacked: true,
                series: [
                    { id: 's-todo', label: 'To do', valueField: 'toDo', color: '#94a3b8' },
                    { id: 's-progress', label: 'In progress', valueField: 'inProgress', color: '#3b82f6' },
                    { id: 's-done', label: 'Done', valueField: 'done', color: '#22c55e' },
                ],
            }),
            table('versions', 'ds-progress', [
                col('version', 'Version'),
                col('releaseDate', 'Release date', { width: '120px', formatExpr: '=FormatUserDate(Field.releaseDate)' }),
                col('daysToRelease', 'Days left', {
                    width: '90px',
                    align: 'right',
                    conditionalFormats: [rule('late', 'Field.daysToRelease < 0', '#fee2e2', '#991b1b', true)],
                }),
                col('issues', 'Issues', { width: '80px', align: 'right' }),
                col('done', 'Done', { width: '80px', align: 'right' }),
                col('points', 'Points', { width: '80px', align: 'right' }),
                col('percentDone', 'Done %', { width: '80px', align: 'right', formatExpr: "=Concat(Field.percentDone, '%')" }),
            ]),
            header('issues-title', 'Issues per version', 'h3'),
            table(
                'issues',
                'ds-by-version',
                [
                    issueKeyColumn,
                    col('summary', 'Summary'),
                    col('issuetype.name', 'Type', { width: '100px' }),
                    col('status.name', 'Status', { width: '120px' }),
                    col('assignee.displayName', 'Assignee', { width: '150px' }),
                ],
                { groupBy: ['version_name', 'category'] },
            ),
        ],
    },
};

export default sample;
