import type { JiraFieldDefinition, JiraFieldMeta, JiraFieldSchema } from '@types';

import type { FieldKind, ImportColumn } from './types';

export const pseudoFields = {
    issuekey: 'issuekey',
    project: 'project',
    issuetype: 'issuetype',
    parent: 'parent',
    status: 'status',
    comment: 'comment',
    clone: 'clone',
    delete: 'delete',
    originalEstimate: 'timetracking.originalEstimate',
    remainingEstimate: 'timetracking.remainingEstimate',
} as const;

export const timeTrackingField = 'timetracking';
export const selectorField = '@selected';
export const rowStatusField = '@status';
export const epicLinkCustomType = 'com.pyxis.greenhopper.jira:gh-epic-link';
export const sprintCustomType = 'com.pyxis.greenhopper.jira:gh-sprint';

const customTypePrefix = 'com.atlassian.jira.plugin.system.customfieldtypes:';
const singleLineCustomTypes = [`${customTypePrefix}textfield`];
const urlCustomTypes = [`${customTypePrefix}url`];
const labelCustomTypes = [`${customTypePrefix}labels`];
const allowedValueTypes = ['option', 'priority', 'resolution', 'version', 'component', 'securitylevel', 'project'];

const pseudoKinds: Record<string, FieldKind> = {
    [pseudoFields.issuekey]: 'issuekey',
    [pseudoFields.project]: 'project',
    [pseudoFields.issuetype]: 'issuetype',
    [pseudoFields.parent]: 'parent',
    [pseudoFields.status]: 'status',
    [pseudoFields.comment]: 'comment',
    [pseudoFields.originalEstimate]: 'originalEstimate',
    [pseudoFields.remainingEstimate]: 'remainingEstimate',
};

const headerAliases: Record<string, string> = {
    key: pseudoFields.issuekey,
    id: pseudoFields.issuekey,
    issue: pseudoFields.issuekey,
    issuekey: pseudoFields.issuekey,
    issueid: pseudoFields.issuekey,
    ticket: pseudoFields.issuekey,
    ticketno: pseudoFields.issuekey,

    project: pseudoFields.project,
    projectkey: pseudoFields.project,
    projectid: pseudoFields.project,

    issuetype: pseudoFields.issuetype,
    type: pseudoFields.issuetype,

    parent: pseudoFields.parent,
    parentkey: pseudoFields.parent,
    parentid: pseudoFields.parent,
    parentissue: pseudoFields.parent,
    parentticket: pseudoFields.parent,
    parentticketno: pseudoFields.parent,
    epic: pseudoFields.parent,
    epickey: pseudoFields.parent,

    status: pseudoFields.status,
    issuestatus: pseudoFields.status,

    comment: pseudoFields.comment,
    comments: pseudoFields.comment,
    addcomment: pseudoFields.comment,

    estimate: pseudoFields.originalEstimate,
    originalestimate: pseudoFields.originalEstimate,
    initialestimate: pseudoFields.originalEstimate,
    timeoriginalestimate: pseudoFields.originalEstimate,
    remaining: pseudoFields.remainingEstimate,
    remainingestimate: pseudoFields.remainingEstimate,
    currentestimate: pseudoFields.remainingEstimate,
    timeestimate: pseudoFields.remainingEstimate,

    clone: pseudoFields.clone,
    copy: pseudoFields.clone,
    delete: pseudoFields.delete,
    remove: pseudoFields.delete,

    summary: 'summary',
    title: 'summary',
    description: 'description',
    desc: 'description',
    assignee: 'assignee',
    assigned: 'assignee',
    assignto: 'assignee',
    assignedto: 'assignee',
    reporter: 'reporter',
    reported: 'reporter',
    reportedby: 'reporter',
    priority: 'priority',
    resolution: 'resolution',
    label: 'labels',
    labels: 'labels',
    component: 'components',
    components: 'components',
    fixversion: 'fixVersions',
    fixversions: 'fixVersions',
    fixfor: 'fixVersions',
    version: 'versions',
    versions: 'versions',
    affectsversion: 'versions',
    affectsversions: 'versions',
    affectedversion: 'versions',
    affectedversions: 'versions',
    due: 'duedate',
    duedate: 'duedate',
    environment: 'environment',
};

const unsupportedFields: Record<string, string> = {
    attachment: 'Attachments cannot be imported',
    issuelinks: 'Issue links cannot be imported',
    subtasks: 'Use the Parent column of sub-tasks instead',
    watches: 'Watchers cannot be imported',
    votes: 'Votes cannot be imported',
    worklog: 'Use "Bulk import worklog" to import worklogs',
    thumbnail: 'Read only field',
    timetracking: 'Use "Original Estimate" and "Remaining Estimate" columns instead',
    timespent: 'Time spent is calculated from worklogs. Use "Bulk import worklog" instead',
    aggregatetimespent: 'Read only field',
    aggregatetimeestimate: 'Read only field',
    aggregatetimeoriginalestimate: 'Read only field',
    aggregateprogress: 'Read only field',
    progress: 'Read only field',
    workratio: 'Read only field',
    created: 'Read only field',
    updated: 'Read only field',
    creator: 'Read only field',
    resolutiondate: 'Read only field',
    lastViewed: 'Read only field',
    statuscategorychangedate: 'Read only field',
    statusCategory: 'Read only field',
};

export interface ResolvedHeader {
    field: string;
    kind?: FieldKind;
    definition?: JiraFieldDefinition;
    invalid?: string;
    warning?: string;
}

export function normalizeForCompare(value: unknown): string {
    if (value === undefined || value === null) {
        return '';
    }
    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

export function getKindFromSchema(schema: JiraFieldSchema | undefined, fieldId: string): FieldKind {
    if (pseudoKinds[fieldId]) {
        return pseudoKinds[fieldId];
    }

    if (!schema) {
        return 'raw';
    }

    const { type, items, system, custom } = schema;

    if (custom === sprintCustomType) {
        return 'sprint';
    }
    if (custom === epicLinkCustomType) {
        return 'issuelink';
    }

    switch (type) {
        case 'string':
            if (system === 'summary' || (custom && singleLineCustomTypes.includes(custom))) {
                return 'string';
            }
            if (custom && urlCustomTypes.includes(custom)) {
                return 'url';
            }
            return 'text';
        case 'number':
            return 'number';
        case 'date':
            return 'date';
        case 'datetime':
            return 'datetime';
        case 'user':
            return 'user';
        case 'group':
            return 'group';
        case 'option-with-child':
            return 'cascading';
        case 'issuelink':
            return 'issuelink';
        case 'array':
            if (items === 'user') {
                return 'users';
            }
            if (items === 'group') {
                return 'groups';
            }
            if (items === 'string') {
                return system === 'labels' || (custom && labelCustomTypes.includes(custom)) ? 'labels' : 'strings';
            }
            if (items && allowedValueTypes.includes(items)) {
                return 'options';
            }
            return 'raw';
        default:
            return allowedValueTypes.includes(type) ? 'option' : 'raw';
    }
}

export function getKindFromMeta(meta: JiraFieldMeta | undefined, column: ImportColumn): FieldKind {
    if (column.kind && column.kind !== 'raw') {
        return column.kind;
    }
    return getKindFromSchema(meta?.schema, column.field);
}

export function isMultiValueKind(kind: FieldKind): boolean {
    return kind === 'labels' || kind === 'strings' || kind === 'users' || kind === 'groups' || kind === 'options';
}

export function createHeaderResolver(fields: JiraFieldDefinition[]): (header: string) => ResolvedHeader {
    const byId = new Map<string, JiraFieldDefinition>();
    const byName = new Map<string, JiraFieldDefinition[]>();

    fields.forEach((field) => {
        byId.set(normalizeForCompare(field.id), field);
        if (field.key) {
            byId.set(normalizeForCompare(field.key), field);
        }

        const names = [field.name, ...(field.clauseNames || [])];
        names.forEach((name) => {
            const normalized = normalizeForCompare(name);
            const list = byName.get(normalized) || [];
            if (!list.includes(field)) {
                list.push(field);
            }
            byName.set(normalized, list);
        });
    });

    const fieldsById = new Map(fields.map((f) => [f.id, f]));

    return (header: string) => {
        const normalized = normalizeForCompare(header);
        if (!normalized) {
            return { field: header, invalid: 'Column header is empty' };
        }

        const alias = headerAliases[normalized];
        if (alias) {
            const aliasDefinition = fieldsById.get(alias);
            if (pseudoKinds[alias] || alias === pseudoFields.clone || alias === pseudoFields.delete) {
                return { field: alias, kind: pseudoKinds[alias], definition: aliasDefinition };
            }
            if (!aliasDefinition) {
                return { field: alias, invalid: 'This field is not available in your Jira' };
            }
            return { field: alias, definition: aliasDefinition, kind: getKindFromSchema(aliasDefinition.schema, alias) };
        }

        const definitionById = byId.get(normalized);
        const candidates = definitionById ? [definitionById] : byName.get(normalized) || [];
        const definition = candidates[0];

        if (!definition) {
            return { field: header, invalid: 'No field with this name or id exists in Jira' };
        }

        if (unsupportedFields[definition.id]) {
            return { field: definition.id, definition, invalid: unsupportedFields[definition.id] };
        }

        const warning =
            candidates.length > 1
                ? `${candidates.length} fields are named "${definition.name}". Using ${definition.id}. Use the field id as column header to choose a different field.`
                : undefined;

        return { field: definition.id, definition, kind: getKindFromSchema(definition.schema, definition.id), warning };
    };
}

export function getUnsupportedReason(fieldId: string): string | undefined {
    return unsupportedFields[fieldId];
}
