import { inject } from '@services';

import { getSelectedBoardIds } from '@components';

import type { CustomParameterPlugin } from '@components/report-builder';

import BoardsParameter from './BoardsParameter';
import { createListParameterPlugin } from './list-parameter';
import { deserializeJson, serializeJson, toSprintSelection } from './parameter-values';
import SprintsParameter from './SprintsParameter';
import UsersParameter from './UsersParameter';

const boardsParameterPlugin: CustomParameterPlugin = {
    type: 'jira-boards',
    name: 'Agile boards',
    RuntimeUI: BoardsParameter,
    initialTypeConfig: () => ({}),
    supportsMultiple: true,
    serialize: serializeJson,
    deserialize: deserializeJson,
};

const sprintsParameterPlugin: CustomParameterPlugin = {
    type: 'jira-sprints',
    name: 'Sprints',
    RuntimeUI: SprintsParameter,
    initialTypeConfig: () => ({}),
    serialize: serializeJson,
    deserialize: deserializeJson,
    validate: (value) =>
        value !== undefined && getSelectedBoardIds(toSprintSelection(value)).length === 0
            ? ['Choose the sprints of at least one board.']
            : null,
};

const usersParameterPlugin: CustomParameterPlugin = {
    type: 'jira-users',
    name: 'Jira users',
    RuntimeUI: UsersParameter,
    initialTypeConfig: () => ({}),
    supportsMultiple: true,
    serialize: serializeJson,
    deserialize: deserializeJson,
};

interface Named {
    id?: string | number;
    key?: string;
    name?: string;
}

const projectsParameterPlugin = createListParameterPlugin({
    type: 'jira-projects',
    name: 'Jira projects',
    placeholder: 'Select projects',
    loadOptions: async () => {
        const { $jira } = inject('JiraService');
        const projects = (await $jira.getProjects()) as Named[];
        return projects
            .filter((p) => p.key)
            .map((p) => ({ value: String(p.key), label: `${p.name} (${p.key})` }))
            .sort((a, b) => a.label.localeCompare(b.label));
    },
});

const issueTypesParameterPlugin = createListParameterPlugin({
    type: 'jira-issue-types',
    name: 'Issue types',
    placeholder: 'Select issue types',
    loadOptions: async () => {
        const { $jira } = inject('JiraService');
        const types = (await $jira.getIssueTypes()) as Named[];
        const names = Array.from(new Set(types.map((t) => t.name).filter((n): n is string => !!n)));
        return names.sort((a, b) => a.localeCompare(b)).map((n) => ({ value: n, label: n }));
    },
});

const statusesParameterPlugin = createListParameterPlugin({
    type: 'jira-statuses',
    name: 'Statuses',
    placeholder: 'Select statuses',
    loadOptions: async () => {
        const { $jira } = inject('JiraService');
        const statuses = (await $jira.getJiraStatuses()) as Named[];
        const names = Array.from(new Set(statuses.map((s) => s.name).filter((n): n is string => !!n)));
        return names.sort((a, b) => a.localeCompare(b)).map((n) => ({ value: n, label: n }));
    },
});

const userGroupsParameterPlugin = createListParameterPlugin({
    type: 'user-groups',
    name: 'User groups',
    placeholder: 'Select user groups',
    loadOptions: async () => {
        const { $usergroup } = inject('UserGroupService');
        const groups = (await $usergroup.getUserGroups()) as Array<{ name: string; users?: unknown[] }>;
        return groups.map((g) => ({ value: g.name, label: `${g.name} (${g.users?.length ?? 0} users)` }));
    },
});

export const parameterPlugins: CustomParameterPlugin[] = [
    projectsParameterPlugin,
    issueTypesParameterPlugin,
    statusesParameterPlugin,
    boardsParameterPlugin,
    sprintsParameterPlugin,
    usersParameterPlugin,
    userGroupsParameterPlugin,
];
