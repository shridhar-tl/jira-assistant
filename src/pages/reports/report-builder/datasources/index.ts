import {
    createExpressionDatasourcePlugin,
    createFileDatasourcePlugin,
    createStaticDatasourcePlugin,
    type DatasourcePlugin,
} from '@components/report-builder';

import { excelFileParser } from './excel-parser';
import { jiraListsDatasourcePlugin } from './jira-lists-plugin';
import { jiraRestDatasourcePlugin } from './jira-rest-plugin';
import { jqlDatasourcePlugin } from './jql-plugin';
import { sprintIssuesDatasourcePlugin } from './sprint-issues-plugin';
import { sprintsDatasourcePlugin } from './sprints-plugin';
import { worklogsDatasourcePlugin } from './worklogs-plugin';

export const datasourcePlugins: DatasourcePlugin[] = [
    jqlDatasourcePlugin,
    sprintIssuesDatasourcePlugin,
    sprintsDatasourcePlugin,
    worklogsDatasourcePlugin,
    jiraListsDatasourcePlugin,
    jiraRestDatasourcePlugin,
    createFileDatasourcePlugin({ parsers: [excelFileParser], maxFileSize: 10 * 1024 * 1024 }),
    createStaticDatasourcePlugin(),
    createExpressionDatasourcePlugin(),
];
