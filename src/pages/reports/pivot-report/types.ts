export interface PivotReportDefinition {
    id?: number;
    queryName: string;
    reportType: 'pivot';
    dataSourceType: number;
    jql: string;
    fields: PivotFieldConfig[];
    parameters?: ReportParameters;
    createdBy?: string;
    hasChanges?: boolean;
}

export interface PivotFieldConfig {
    id: string;
    key: string;
    name: string;
    schema?: FieldSchema;
    displayText?: string;
    headerText?: string;
    colGroup?: boolean;
    enableGrouping?: boolean;
    showTotal?: boolean;
    showTotalFirst?: boolean;
    agrFunc?: string;
    format?: string;
    filter?: string;
    subItems?: PivotFieldConfig[];
    dateRange?: {
        fromDate: Date;
        toDate: Date;
    };
    rangeType?: string;
    filterField?: string;
    useDistinct?: boolean;
}

export interface FieldSchema {
    type?: string;
    derived?: boolean;
    computed?: boolean;
    depth?: number;
    isArray?: boolean;
    custom?: boolean;
}

export interface JiraField {
    id: string;
    key: string;
    name: string;
    custom?: boolean;
    schema?: FieldSchema;
}

export interface ReportParameters {
    [key: string]: {
        name: string;
        type: string;
        isArray?: boolean;
        value?: any;
    };
}

export interface FieldGroup {
    label: string;
    items: JiraField[];
}

export interface ReportCell {
    value?: any;
    headerText?: string;
    tagProps?: Record<string, any>;
    renderer?: {
        Component?: any;
        props?: Record<string, any>;
    };
    subRows?: any;
    cellProps?: any;
}

export interface ReportData {
    header: ReportCell[][][];
    body: ReportCell[][];
    footer: ReportCell[][];
}
