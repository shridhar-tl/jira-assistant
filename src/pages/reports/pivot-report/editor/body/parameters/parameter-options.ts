import { inject } from '@services';

import { getUserName } from '@utils/helpers';

import type { JiraFieldDefinition, JiraJqlSuggestion, JiraNamedEntity, JiraUser } from '@types';

import { isNumberParameter } from '../../../store/report-parameters';
import type { ParameterOption, ReportParameter } from '../../../types';

export type ParameterKind =
    | 'date'
    | 'datetime'
    | 'daterange'
    | 'bool'
    | 'number'
    | 'user'
    | 'project'
    | 'issuetype'
    | 'status'
    | 'priority'
    | 'resolution'
    | 'suggestion'
    | 'sprints'
    | 'text';

export type OptionsLoader = (query: string) => Promise<ParameterOption[]>;

interface JiraProjectItem {
    key: string;
    name: string;
    avatarUrls?: Record<string, string>;
}

type NamedListSource = 'getIssueTypes' | 'getJiraStatuses' | 'getPriorities' | 'getResolutions';

const namedListSources: Partial<Record<ParameterKind, NamedListSource>> = {
    issuetype: 'getIssueTypes',
    status: 'getJiraStatuses',
    priority: 'getPriorities',
    resolution: 'getResolutions',
};

const directKinds: ParameterKind[] = ['date', 'datetime', 'daterange', 'bool', 'sprints'];
const fieldKinds: ParameterKind[] = ['user', 'project', 'issuetype', 'status', 'priority', 'resolution'];
const sprintCustomType = 'com.pyxis.greenhopper.jira:gh-sprint';
const customFieldClauseRegex = /^cf\[\d+\]$/i;
const minUserSearchLength = 2;
const maxUserSearchResults = 20;

export function getParameterKind(param: ReportParameter): ParameterKind {
    const { type, itemType, fieldKey, jqlField } = param;

    if (directKinds.includes(type as ParameterKind)) {
        return type as ParameterKind;
    }

    if (isNumberParameter(param)) {
        return 'number';
    }

    const kind = fieldKinds.find((k) => k === type || k === itemType);
    if (kind) {
        return kind;
    }

    return fieldKey || jqlField ? 'suggestion' : 'text';
}

export function getOptionsLoader(kind: ParameterKind): OptionsLoader | undefined {
    switch (kind) {
        case 'user':
            return createUserLoader();
        case 'project':
            return createListLoader(getProjectOptions);
        default: {
            const source = namedListSources[kind];

            return source ? createListLoader(() => getNamedOptions(source)) : undefined;
        }
    }
}

function filterOptions(options: ParameterOption[], query: string) {
    const text = query.trim().toLowerCase();

    return text ? options.filter(({ label }) => label.toLowerCase().includes(text)) : options;
}

function createListLoader(getOptions: () => Promise<ParameterOption[]>): OptionsLoader {
    let optionsPromise: Promise<ParameterOption[]> | undefined;

    return async (query) => {
        optionsPromise ??= getOptions().catch((err) => {
            optionsPromise = undefined;
            throw err;
        });

        return filterOptions(await optionsPromise, query);
    };
}

async function getProjectOptions(): Promise<ParameterOption[]> {
    const { $jira } = inject('JiraService');
    const projects: JiraProjectItem[] = (await $jira.getProjects()) || [];

    return projects.map(({ key, name, avatarUrls }) => ({ value: key, label: `${name} (${key})`, iconUrl: avatarUrls?.['16x16'] }));
}

async function getNamedOptions(source: NamedListSource): Promise<ParameterOption[]> {
    const { $jira } = inject('JiraService');
    const list: JiraNamedEntity[] = (await $jira[source]()) || [];
    const options = new Map<string, ParameterOption>();

    list.forEach(({ name, iconUrl }) => {
        const nameLCase = name?.toLowerCase();
        if (nameLCase && !options.has(nameLCase)) {
            options.set(nameLCase, { value: name, label: name, iconUrl });
        }
    });

    return [...options.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function createUserLoader(): OptionsLoader {
    return async (query) => {
        const text = query.trim();

        return text.length >= minUserSearchLength ? searchUserOptions(text) : [];
    };
}

async function searchUserOptions(text: string): Promise<ParameterOption[]> {
    const { $jira } = inject('JiraService');
    const users: JiraUser[] = (await $jira.searchUsers(text, maxUserSearchResults)) || [];

    return users.reduce<ParameterOption[]>((options, user) => {
        const value = user.accountId || getUserName(user);
        if (value) {
            options.push({ value, label: user.displayName || value, iconUrl: user.avatarUrls?.['24x24'] });
        }

        return options;
    }, []);
}

export async function resolveSuggestionLoader({ fieldKey, customType, jqlField }: ReportParameter): Promise<OptionsLoader | null> {
    const isSprint = customType === sprintCustomType;

    if (jqlField) {
        return createSuggestionLoader(jqlField, isSprint);
    }

    if (!fieldKey) {
        return null;
    }

    const [baseKey, prop] = fieldKey.split('.');
    if (prop && prop !== 'name') {
        return null;
    }

    const { $jira } = inject('JiraService');
    const [fields, autocomplete] = await Promise.all([$jira.getCustomFields() as Promise<JiraFieldDefinition[]>, $jira.getJQLAutocomplete()]);

    const field = fields.find((f) => f.key === baseKey || f.id === baseKey);
    const clauseNames = (field?.clauseNames || []).map((c) => c.toLowerCase());
    const jqlFields = (autocomplete?.visibleFieldNames || []).filter(
        (f) => f.auto === 'true' && [unquoteJqlLiteral(f.value), f.cfid].some((name) => !!name && clauseNames.includes(name.toLowerCase())),
    );
    const matchedField = jqlFields.find((f) => f.cfid && customFieldClauseRegex.test(f.cfid)) || jqlFields[0];

    if (!matchedField) {
        return null;
    }

    const fieldName = matchedField.cfid && customFieldClauseRegex.test(matchedField.cfid) ? matchedField.cfid : matchedField.value;

    return createSuggestionLoader(fieldName, isSprint);
}

function createSuggestionLoader(fieldName: string, isSprint: boolean): OptionsLoader {
    const { $jira } = inject('JiraService');

    return async (query) => {
        const { results = [] } = await $jira.getJQLSuggestions(fieldName, query.trim());

        return results.map((suggestion) => toSuggestionOption(suggestion, isSprint)).filter(({ value }) => value !== '');
    };
}

function toSuggestionOption({ value, displayName }: JiraJqlSuggestion, isSprint: boolean): ParameterOption {
    const text = unquoteJqlLiteral(value);
    const label = htmlToText(displayName) || text;

    if (isSprint && /^\d+$/.test(text)) {
        return { value: Number(text), label };
    }

    return { value: text, label };
}

function unquoteJqlLiteral(value: string) {
    const text = (value || '').trim();

    if (text.length > 1 && text.startsWith('"') && text.endsWith('"')) {
        return text.substring(1, text.length - 1).replace(/\\(.)/g, '$1');
    }

    return text;
}

function htmlToText(html: string) {
    return html ? new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() || '' : '';
}
