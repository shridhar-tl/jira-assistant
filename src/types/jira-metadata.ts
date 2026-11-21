export interface JiraFieldSchema {
    type: string;
    items?: string;
    system?: string;
    custom?: string;
    customId?: number;
}

export interface JiraAllowedValue {
    id?: string;
    key?: string;
    name?: string;
    value?: string;
    iconUrl?: string;
    avatarUrls?: Record<string, string>;
    children?: JiraAllowedValue[];
    disabled?: boolean;
    archived?: boolean;
    released?: boolean;
}

/** Field metadata as returned by createmeta, editmeta and transition screens. Normalized so that `key` is always present. */
export interface JiraFieldMeta {
    key: string;
    name: string;
    required: boolean;
    hasDefaultValue?: boolean;
    schema: JiraFieldSchema;
    allowedValues?: JiraAllowedValue[];
    autoCompleteUrl?: string;
    operations?: string[];
}

export type JiraFieldMetaMap = Record<string, JiraFieldMeta>;

/** Field definition as returned by /rest/api/2/field */
export interface JiraFieldDefinition {
    id: string;
    key?: string;
    name: string;
    custom?: boolean;
    clauseNames?: string[];
    schema?: JiraFieldSchema;
}

export interface JiraCreateIssueType {
    id: string;
    name: string;
    subtask: boolean;
    iconUrl?: string;
    hierarchyLevel?: number;
}

export interface JiraIssueLinkType {
    id: string;
    name: string;
    inward: string;
    outward: string;
}

export interface JiraNamedEntity {
    id: string;
    name: string;
    iconUrl?: string;
    description?: string;
}

export interface JiraJqlSuggestion {
    value: string;
    displayName: string;
}

export interface JiraJqlField {
    value: string;
    displayName: string;
    auto?: string;
    cfid?: string;
    types?: string[];
}

export interface JiraJqlAutocompleteData {
    visibleFieldNames?: JiraJqlField[];
    visibleFunctionNames?: unknown[];
    jqlReservedWords?: string[];
}

export interface JiraStatusRef {
    id: string;
    name: string;
}

export interface JiraTransition {
    id: string;
    name: string;
    to: JiraStatusRef;
    fields: JiraFieldMetaMap;
}

export interface JiraSprintRef {
    id: number;
    name: string;
    state?: string;
    closed?: boolean;
}

export interface JiraErrorResponse {
    errorMessages?: string[];
    errors?: Record<string, string>;
}

export interface JiraRequestError {
    status?: number;
    response?: string;
    error?: JiraErrorResponse | string;
}
