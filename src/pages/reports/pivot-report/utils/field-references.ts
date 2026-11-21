import type { JiraField, PivotFieldConfig } from '../types';

const customFieldIdPrefix = 'customfield_';
const customFieldIdPattern = /\bcustomfield_\d+\b/gi;

/**
 * Jira creates at most one field of these types per instance,
 * so a field of the same type is the same field even when its id or name differs.
 */
const singleInstanceCustomTypes = new Set([
    'com.pyxis.greenhopper.jira:gh-sprint',
    'com.pyxis.greenhopper.jira:gh-epic-link',
    'com.pyxis.greenhopper.jira:gh-epic-label',
    'com.pyxis.greenhopper.jira:gh-epic-status',
    'com.pyxis.greenhopper.jira:gh-epic-color',
    'com.pyxis.greenhopper.jira:gh-lexo-rank',
    'com.pyxis.greenhopper.jira:jsw-story-points',
    'com.atlassian.jpo:jpo-custom-field-parent',
    'com.atlassian.jpo:jpo-custom-field-baseline-start',
    'com.atlassian.jpo:jpo-custom-field-baseline-end',
    'com.atlassian.jira.plugins.jira-development-integration-plugin:devsummarycf',
    'com.atlassian.jira.ext.charting:firstresponsedate',
    'com.atlassian.jira.ext.charting:timeinstatus',
    'com.atlassian.servicedesk:vp-origin',
    'com.atlassian.servicedesk:sd-request-participants',
    'com.atlassian.servicedesk:sd-request-feedback',
    'com.atlassian.servicedesk:sd-request-feedback-date',
    'com.atlassian.servicedesk:sd-customer-organizations',
    'com.atlassian.servicedesk.servicedesk-lingo-integration-plugin:sd-request-language',
    'com.atlassian.servicedesk.sentiment:sd-sentiment',
]);

type FieldMapping = Map<string, JiraField | null>;

function isJiraCustomField(field: Pick<PivotFieldConfig, 'id' | 'schema'>): boolean {
    return !!field.id?.startsWith(customFieldIdPrefix) && !field.schema?.derived && !field.schema?.computed;
}

function customTypeOf(field: Pick<JiraField, 'schema'>): string | undefined {
    const custom = field.schema?.custom;
    return typeof custom === 'string' ? custom : undefined;
}

function singleMatch(fields: JiraField[]): JiraField | null {
    return fields.length === 1 ? fields[0] : null;
}

function findEquivalentField(field: PivotFieldConfig, customFields: JiraField[]): JiraField | null {
    const savedType = customTypeOf(field);
    const candidates = savedType ? customFields.filter((f) => customTypeOf(f) === savedType) : customFields;
    const sameId = candidates.find((f) => f.id === field.id);
    const savedName = field.name?.trim().toLowerCase();
    const isSavedName = (f: JiraField) => f.name.trim().toLowerCase() === savedName;

    if (sameId && (!savedName || isSavedName(sameId))) {
        return sameId;
    }

    const byName = savedName ? singleMatch(candidates.filter(isSavedName)) : null;
    const byType = savedType && singleInstanceCustomTypes.has(savedType) ? singleMatch(candidates) : null;

    return byName || sameId || byType;
}

function collectFieldMapping(fields: PivotFieldConfig[] | undefined, customFields: JiraField[], mapping: FieldMapping) {
    fields?.forEach((field) => {
        if (isJiraCustomField(field) && !mapping.has(field.id)) {
            mapping.set(field.id, findEquivalentField(field, customFields));
        }
        collectFieldMapping(field.subItems, customFields, mapping);
    });
}

function replaceFieldIds(text: string, mapping: FieldMapping): string {
    return text.replace(customFieldIdPattern, (id) => mapping.get(id.toLowerCase())?.id || id);
}

function remapField(field: PivotFieldConfig, mapping: FieldMapping): PivotFieldConfig {
    const target = isJiraCustomField(field) ? mapping.get(field.id) : undefined;
    const filterFieldTarget = field.filterField ? mapping.get(field.filterField) : undefined;
    const remapped: PivotFieldConfig = { ...field };

    if (target && target.id !== field.id) {
        Object.assign(remapped, { id: target.id, key: target.key, name: target.name, schema: target.schema });
    }

    if (filterFieldTarget) {
        remapped.filterField = filterFieldTarget.key;
    }

    if (field.filter) {
        remapped.filter = replaceFieldIds(field.filter, mapping);
    }

    if (field.subItems) {
        remapped.subItems = field.subItems.map((f) => remapField(f, mapping));
    }

    return remapped;
}

/**
 * Custom field ids differ between Jira instances. Fields of a report saved in another instance are matched by their type and name,
 * so that shared and imported reports keep working wherever an equivalent field exists.
 */
export function resolveFieldReferences(fields: PivotFieldConfig[], customFields: JiraField[]): PivotFieldConfig[] {
    const mapping: FieldMapping = new Map();
    collectFieldMapping(fields, customFields, mapping);

    const needsChange = [...mapping].some(([id, target]) => target && target.id !== id);

    return needsChange ? fields.map((f) => remapField(f, mapping)) : fields;
}

export function isFieldUnavailable(field: Pick<PivotFieldConfig, 'id' | 'key' | 'schema'>, fieldsMap: Record<string, JiraField>): boolean {
    if (!isJiraCustomField(field) || !Object.keys(fieldsMap).length) {
        return false;
    }

    const jiraField = fieldsMap[field.key.toLowerCase()] || fieldsMap[field.id.toLowerCase()];
    const savedType = customTypeOf(field);

    return !jiraField || jiraField.id !== field.id || (!!savedType && customTypeOf(jiraField) !== savedType);
}

export function isFilterFieldUnavailable(filterField: string | undefined, fieldsMap: Record<string, JiraField>): boolean {
    return !!filterField?.startsWith(customFieldIdPrefix) && !!Object.keys(fieldsMap).length && !fieldsMap[filterField.toLowerCase()];
}
