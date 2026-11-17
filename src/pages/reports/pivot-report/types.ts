import type { AgileBoard, SprintSelectionMap } from '@components/shared/sprint-selector';

export const jqlDataSource = 1;
export const sprintDataSource = 2;

export type PivotDataSourceType = typeof jqlDataSource | typeof sprintDataSource;

export interface PivotReportDefinition {
    id?: number;
    queryName: string;
    reportType: 'pivot';
    dataSourceType: PivotDataSourceType;
    jql: string;
    sprintBoards: AgileBoard[];
    sprintSelection: SprintSelectionMap;
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
    dateRange?: DateRangeSelection;
    rangeType?: string;
    filterField?: string;
    useDistinct?: boolean;
}

export interface DateRangeSelection {
    fromDate: Date;
    toDate: Date;
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
