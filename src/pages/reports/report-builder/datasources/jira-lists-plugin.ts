import { ListIcon } from '@components/icons';
import type { DatasourcePlugin } from '@components/report-builder';

import { getJiraList } from './jira-lists';
import JiraListsConfig from './JiraListsConfig';

export const jiraListsDatasourceType = 'jira-lists';

export const jiraListsDatasourcePlugin: DatasourcePlugin = {
    type: jiraListsDatasourceType,
    name: 'Jira lists',
    description: 'Projects, issue types, statuses, boards, fields, link types, your open issues or your user groups.',
    icon: ListIcon,
    category: 'Jira',
    initialConfig: () => ({ list: 'projects' }),
    ConfigUI: JiraListsConfig,
    describe: (config) => getJiraList(config).label,
    fetch: async (config) => {
        const list = getJiraList(config);
        return { rows: await list.load(), fields: list.fields };
    },
    inferSchema: (config) => getJiraList(config).fields,
};
