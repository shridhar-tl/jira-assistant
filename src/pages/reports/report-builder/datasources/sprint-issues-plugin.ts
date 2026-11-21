import { LayersIcon } from 'fluxo-ui/icons';

import type { AgileBoard, SprintSelectionMap } from '@components';

import type { DatasourcePlugin } from '@components/report-builder';

import { getIssueSchema, type SelectedIssueField } from '../config/jira-fields';

import { openConfigureDialog } from './configure-dialog-store';
import { combineJql, interpolateJql, issuesToDataset, searchIssues } from './issue-search';
import { resolveSprintIds, type SourceMode } from './sprint-resolution';

export const sprintIssuesDatasourceType = 'jira-sprint-issues';

export interface SprintIssuesDatasourceConfig {
    sprintMode: SourceMode;
    boards: AgileBoard[];
    sprintSelection: SprintSelectionMap;
    sprintExpression?: string;
    jql?: string;
    fields: SelectedIssueField[];
}

export const sprintIssuesDatasourcePlugin: DatasourcePlugin = {
    type: sprintIssuesDatasourceType,
    name: 'Sprint issues',
    description: 'Issues of chosen sprints, or of the sprints picked in a report parameter. Optionally filtered with JQL.',
    icon: LayersIcon,
    category: 'Jira',
    initialConfig: () => ({ sprintMode: 'fixed', boards: [], sprintSelection: {}, fields: [] }),
    configure: (request) => openConfigureDialog('sprint-issues', request),
    describe: (config) => {
        const cfg = config as unknown as SprintIssuesDatasourceConfig;
        const source =
            cfg.sprintMode === 'expression'
                ? `Sprints from ${cfg.sprintExpression || '(no expression)'}`
                : `${cfg.boards?.length ?? 0} board(s)`;
        return `${source} · ${cfg.fields?.length ?? 0} fields${cfg.jql ? ` · ${cfg.jql}` : ''}`;
    },
    fetch: async (config, context) => {
        const cfg = config as unknown as SprintIssuesDatasourceConfig;
        const sprintIds = await resolveSprintIds(cfg.sprintMode, cfg.sprintSelection, cfg.sprintExpression, context);
        if (sprintIds.length === 0) return issuesToDataset([], cfg.fields ?? []);
        const filter = await interpolateJql(cfg.jql, context);
        const jql = combineJql(`sprint in (${sprintIds.join(', ')})`, filter);
        const issues = await searchIssues(jql, cfg.fields ?? []);
        return issuesToDataset(issues, cfg.fields ?? []);
    },
    inferSchema: (config) => getIssueSchema((config as unknown as SprintIssuesDatasourceConfig).fields ?? []),
};
