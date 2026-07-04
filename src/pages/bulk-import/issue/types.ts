// Type definitions for bulk import issue functionality

export interface ValueObj {
    value?: any;
    displayText?: string;
    avatarUrl?: string;
    jiraValue?: any;
    error?: string;
    warning?: string;
    allowedValues?: any[];
    autoCompleteUrl?: string;
    isArray?: boolean;
    delete?: boolean;
    clearValue?: boolean;
}

export interface ImportStatus {
    hasError?: boolean;
    hasWarning?: boolean;
    error?: string;
    warning?: string;
    imported?: boolean;
    actions?: Record<string, boolean>;
    createMetadata?: any;
    updateMetadata?: any;
}

export interface IssueRow {
    [key: string]: ValueObj | any;
    issuekey: ValueObj;
    project: ValueObj;
    issuetype: ValueObj;
    parent: ValueObj;
    summary: ValueObj;
    importStatus?: ImportStatus;
    disabled?: boolean;
    selected?: boolean;
    delete?: boolean;
    clone?: boolean;
    raw?: any;
}

export interface IssueColumn {
    field: string;
    displayText?: string;
    fieldType?: string;
    custom?: boolean;
    headerEditable?: boolean;
    cellEditable?: boolean;
    footerEditable?: boolean;
    required?: boolean;
    hasError?: boolean;
    width?: number;
}

export interface ImportData {
    columns: IssueColumn[];
    importData: IssueRow[];
    addedFields: Record<string, boolean>;
}

export interface ImportStats {
    total: number;
    selected: number;
    withErrors: number;
    withWarnings: number;
    toCreate: number;
    toUpdate: number;
    toClone: number;
    toDelete: number;
}
