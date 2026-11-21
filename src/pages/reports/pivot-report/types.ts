import type { AgileBoard, SprintSelectionMap } from '@components/shared/sprint-selector';

import type { UserGroup } from '@types';

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
    createdBy?: string;
    hasChanges?: boolean;
}

export type SortOrder = 'asc' | 'desc';

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
    itemFilterValues?: string[];
    sortOrder?: SortOrder;
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
    items?: string;
    system?: string;
    custom?: string | boolean;
}

export interface JiraField {
    id: string;
    key: string;
    name: string;
    custom?: boolean;
    schema?: FieldSchema;
}

export interface ParameterOption {
    value: string | number;
    label: string;
    iconUrl?: string;
}

export type ReportParameterValue = string | number | boolean | Date | string[] | DateRangeSelection | ParameterOption[] | UserGroup[];

export interface ReportParameterDefinition {
    name: string;
    type: string;
    isArray?: boolean;
    fieldKey?: string;
    itemType?: string;
    customType?: string;
}

export interface ReportParameter extends ReportParameterDefinition {
    value?: ReportParameterValue;
}

export type ReportParameters = Record<string, ReportParameter>;

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
    header: ReportCell[][];
    body: ReportCell[][];
    footer: ReportCell[][];
}
