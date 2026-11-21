import { FilterIcon } from 'fluxo-ui/icons';

import type { DatasourcePlugin } from '@components/report-builder';

import type { SelectedIssueField } from '../config/jira-fields';
import { getIssueSchema } from '../config/jira-fields';

import { openConfigureDialog } from './configure-dialog-store';
import { interpolateJql, issuesToDataset, searchIssues } from './issue-search';

export const jqlDatasourceType = 'jira-jql';

export interface JqlDatasourceConfig {
    jql: string;
    fields: SelectedIssueField[];
    maxResults?: number;
}

export const jqlDatasourcePlugin: DatasourcePlugin = {
    type: jqlDatasourceType,
    name: 'Jira issues (JQL)',
    description: 'Issues matching a JQL query, with the fields you choose. JQL can use {{ Parameters.x }}.',
    icon: FilterIcon,
    category: 'Jira',
    initialConfig: () => ({ jql: '', fields: [] }),
    configure: (request) => openConfigureDialog('jql', request),
    describe: (config) => {
        const cfg = config as unknown as JqlDatasourceConfig;
        return cfg.jql ? `${cfg.jql} · ${cfg.fields?.length ?? 0} fields` : 'No JQL configured';
    },
    fetch: async (config, context) => {
        const cfg = config as unknown as JqlDatasourceConfig;
        const jql = await interpolateJql(cfg.jql, context);
        if (!jql.trim()) throw new Error('Enter the JQL query of this datasource.');
        const issues = await searchIssues(jql, cfg.fields ?? [], { maxResults: cfg.maxResults });
        return issuesToDataset(issues, cfg.fields ?? []);
    },
    inferSchema: (config) => getIssueSchema((config as unknown as JqlDatasourceConfig).fields ?? []),
};
