import {
    createExpressionDatasourcePlugin,
    createFileDatasourcePlugin,
    createStaticDatasourcePlugin,
    type DatasourcePlugin,
} from '@components/report-builder';

import { getErrorMessage } from '@utils/helpers';

import { excelFileParser } from './excel-parser';
import { jiraListsDatasourcePlugin } from './jira-lists-plugin';
import { jiraRestDatasourcePlugin } from './jira-rest-plugin';
import { jqlDatasourcePlugin } from './jql-plugin';
import { sprintIssuesDatasourcePlugin } from './sprint-issues-plugin';
import { sprintsDatasourcePlugin } from './sprints-plugin';
import { worklogsDatasourcePlugin } from './worklogs-plugin';

const loadFailedMessage = 'Unable to load the data from Jira.';

/**
 * Failed Jira requests reject with the response instead of an Error, which the report would show as "[object Object]"
 */
function withReadableErrors(plugin: DatasourcePlugin): DatasourcePlugin {
    return {
        ...plugin,
        fetch: async (config, context) => {
            try {
                return await plugin.fetch(config, context);
            } catch (err) {
                throw err instanceof Error ? err : new Error(getErrorMessage(err, loadFailedMessage));
            }
        },
    };
}

export const datasourcePlugins: DatasourcePlugin[] = [
    ...[
        jqlDatasourcePlugin,
        sprintIssuesDatasourcePlugin,
        sprintsDatasourcePlugin,
        worklogsDatasourcePlugin,
        jiraListsDatasourcePlugin,
        jiraRestDatasourcePlugin,
    ].map(withReadableErrors),
    createFileDatasourcePlugin({ parsers: [excelFileParser], maxFileSize: 10 * 1024 * 1024 }),
    createStaticDatasourcePlugin(),
    createExpressionDatasourcePlugin(),
];
