import type { DatasourceConfig, ReportDefinition } from '@components/report-builder';

import type { JiraFieldMeta, SelectedIssueField } from '../config/jira-fields';

/**
 * Custom field ids differ between Jira instances, so samples use placeholder ids
 * that are replaced with the matching field of the instance when a sample is opened.
 */
export const storyPointsFieldId = 'sample:storyPoints';

interface PlaceholderField {
    id: string;
    label: string;
    names: string[];
    schemaType: string;
}

const placeholders: PlaceholderField[] = [
    { id: storyPointsFieldId, label: 'Story Points', names: ['story points', 'story point estimate'], schemaType: 'number' },
];

const fieldListKeys = ['fields', 'issueFields'] as const;

function isSelectedField(value: unknown): value is SelectedIssueField {
    const f = value as SelectedIssueField | null;
    return !!f && typeof f === 'object' && typeof f.id === 'string' && typeof f.alias === 'string';
}

function fieldLists(ds: DatasourceConfig): SelectedIssueField[][] {
    return fieldListKeys
        .map((key) => ds.config[key])
        .filter((list): list is SelectedIssueField[] => Array.isArray(list) && list.every(isSelectedField));
}

function findMatch(placeholder: PlaceholderField, jiraFields: JiraFieldMeta[]): JiraFieldMeta | undefined {
    return jiraFields.find(
        (f) => f.custom && f.schema?.type === placeholder.schemaType && placeholder.names.includes(f.name.trim().toLowerCase()),
    );
}

function usedPlaceholders(definition: Pick<ReportDefinition, 'datasources'>): PlaceholderField[] {
    const ids = new Set(definition.datasources.flatMap((ds) => fieldLists(ds).flat().map((f) => f.id)));
    return placeholders.filter((p) => ids.has(p.id));
}

/** Labels of the custom fields a sample needs that the connected Jira does not have. */
export function getMissingSampleFields(definition: Pick<ReportDefinition, 'datasources'>, jiraFields: JiraFieldMeta[]): string[] {
    return usedPlaceholders(definition)
        .filter((p) => !findMatch(p, jiraFields))
        .map((p) => p.label);
}

/** Replaces the placeholder ids with the instance's field ids. Fields the instance does not have are left out, so their values are empty. */
export function resolveSampleFields(definition: ReportDefinition, jiraFields: JiraFieldMeta[]): ReportDefinition {
    const matches = new Map(placeholders.map((p) => [p.id, findMatch(p, jiraFields)]));
    const resolveList = (list: SelectedIssueField[]) =>
        list.flatMap((f) => {
            if (!matches.has(f.id)) return [f];
            const match = matches.get(f.id);
            return match ? [{ ...f, id: match.id, name: match.name }] : [];
        });

    return {
        ...definition,
        datasources: definition.datasources.map((ds) => {
            const config = { ...ds.config };
            for (const key of fieldListKeys) {
                const list = config[key];
                if (Array.isArray(list) && list.every(isSelectedField)) config[key] = resolveList(list);
            }
            return { ...ds, config };
        }),
    };
}
