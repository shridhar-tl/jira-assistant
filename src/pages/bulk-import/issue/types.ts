import type { GridColumn } from '@components';

import type { JiraCreateIssueType, JiraFieldDefinition, JiraFieldMetaMap, JiraTransition } from '@types';

export type FieldKind =
    | 'issuekey'
    | 'project'
    | 'issuetype'
    | 'parent'
    | 'status'
    | 'comment'
    | 'originalEstimate'
    | 'remainingEstimate'
    | 'string'
    | 'text'
    | 'url'
    | 'number'
    | 'date'
    | 'datetime'
    | 'labels'
    | 'strings'
    | 'user'
    | 'users'
    | 'group'
    | 'groups'
    | 'option'
    | 'options'
    | 'cascading'
    | 'issuelink'
    | 'sprint'
    | 'raw';

export type ColumnRole = 'selector' | 'rowStatus' | 'clone' | 'delete' | 'field';

export type ImportAction = 'create' | 'update' | 'clone' | 'delete' | 'none';

export type RowState = 'ready' | 'importing' | 'imported' | 'failed';

export interface DisplayItem {
    text: string;
    avatarUrl?: string;
    issueKey?: string;
}

export interface ImportCell {
    input?: string;
    clear?: boolean;
    display?: DisplayItem[];
    payload?: unknown;
    deferred?: boolean;
    unchanged?: boolean;
    error?: string;
    warning?: string;
}

export interface ImportColumn extends GridColumn {
    field: string;
    role: ColumnRole;
    kind?: FieldKind;
    header: string;
    definition?: JiraFieldDefinition;
    invalid?: string;
    warning?: string;
}

export interface ExistingIssue {
    key: string;
    projectKey: string;
    issueTypeId: string;
    issueTypeName: string;
    isSubtask: boolean;
    statusName: string;
    summary: string;
    parentKey?: string;
    subtaskCount: number;
    fields: Record<string, unknown>;
}

export interface RowContext {
    projectKey?: string;
    issueTypes?: JiraCreateIssueType[];
    issueType?: JiraCreateIssueType;
    fieldsMeta?: JiraFieldMetaMap;
    existing?: ExistingIssue;
    transition?: JiraTransition;
    parentFieldId?: string;
    cloneAsCopy?: boolean;
}

export interface RowConflict {
    message: string;
    isError: boolean;
}

export interface RowStatus {
    action: ImportAction;
    state: RowState;
    validating?: boolean;
    error?: string;
    warnings: string[];
    conflict?: RowConflict;
    resultKey?: string;
}

export interface ImportRow {
    rowId: number;
    revision: number;
    line?: number;
    selected: boolean;
    /** Left out because the row could not be imported, as opposed to being left out by the user. */
    blocked: boolean;
    clone: boolean;
    delete: boolean;
    cells: Record<string, ImportCell>;
    existingDisplay: Record<string, DisplayItem[]>;
    status: RowStatus;
    context: RowContext;
}

export type RawRecord = Record<string, string>;

export interface ImportStats {
    total: number;
    selected: number;
    errors: number;
    warnings: number;
    toCreate: number;
    toUpdate: number;
    toClone: number;
    toDelete: number;
    imported: number;
    failed: number;
}

export interface ImportProgress {
    current: number;
    total: number;
}
