import type { ReportTag } from '@components/shared/report-gallery';

import { sprintDataSource, type JiraField, type PivotFieldConfig, type PivotReportDefinition } from '../types';

import { isFieldUnavailable, resolveFieldReferences } from './field-references';
import { getParameterNames } from './jql-parameters';
import { sprintsParameterName } from './sprints-parameter';

type DefinitionSummarySource = Pick<PivotReportDefinition, 'dataSourceType' | 'jql' | 'fields' | 'sprintsParameter'>;

function collectFieldParameterNames(fields: PivotFieldConfig[] | undefined, names: string[]) {
    fields?.forEach(({ filter, dateRangeParameter, subItems }) => {
        names.push(...getParameterNames(filter));
        if (dateRangeParameter?.trim()) {
            names.push(dateRangeParameter.trim());
        }
        collectFieldParameterNames(subItems, names);
    });
}

function countFields(fields: PivotFieldConfig[] | undefined): number {
    return fields?.reduce((count, { subItems }) => count + 1 + countFields(subItems), 0) || 0;
}

function collectUnavailableFields(fields: PivotFieldConfig[] | undefined, fieldsMap: Record<string, JiraField>, names: Set<string>) {
    fields?.forEach((field) => {
        if (isFieldUnavailable(field, fieldsMap)) {
            names.add(field.name);
        }
        collectUnavailableFields(field.subItems, fieldsMap, names);
    });
}

export function getParameterNamesOf(definition: DefinitionSummarySource): string[] {
    const names: string[] = [];

    if (definition.dataSourceType === sprintDataSource && definition.sprintsParameter) {
        names.push(sprintsParameterName);
    }

    names.push(...getParameterNames(definition.jql));
    collectFieldParameterNames(definition.fields, names);

    const unique = new Map(names.map((name) => [name.toLowerCase(), name]));

    return [...unique.values()];
}

export function getUnavailableFieldNames(fields: PivotFieldConfig[], customFields: JiraField[], fieldsMap: Record<string, JiraField>): string[] {
    if (!customFields.length || !Object.keys(fieldsMap).length) {
        return [];
    }

    const names = new Set<string>();
    collectUnavailableFields(resolveFieldReferences(fields, customFields), fieldsMap, names);

    return [...names];
}

export function getStructureTags(definition: DefinitionSummarySource): ReportTag[] {
    const isSprintSource = definition.dataSourceType === sprintDataSource;
    const fieldCount = countFields(definition.fields);

    return [
        isSprintSource ? { icon: 'fa-flag-checkered', label: 'Sprints' } : { icon: 'fa-code', label: 'JQL', title: definition.jql },
        { icon: 'fa-table-columns', label: `${fieldCount} field${fieldCount === 1 ? '' : 's'}` },
    ];
}

export function getRequirementTags(definition: DefinitionSummarySource, unavailableFields: string[] = []): ReportTag[] {
    const parameterNames = getParameterNamesOf(definition);
    const tags: ReportTag[] = [];

    if (parameterNames.length) {
        tags.push({
            icon: 'fa-list-check',
            label: `Asks for ${parameterNames.join(', ')}`,
            title: 'Values asked while generating the report',
            tone: 'info',
        });
    }

    if (unavailableFields.length) {
        tags.push({
            icon: 'fa-exclamation-triangle',
            label: `${unavailableFields.join(', ')} not found`,
            title: 'These fields are not available in your Jira. Replace them with equivalent fields after opening the report.',
            tone: 'warning',
        });
    }

    return tags;
}
