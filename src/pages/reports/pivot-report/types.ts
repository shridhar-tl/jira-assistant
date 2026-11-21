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
    sprintsParameter?: SprintsParameterConfig;
    sampleId?: string;
    createdBy?: string;
    hasChanges?: boolean;
}

/**
 * When available, the agile boards and their sprints are chosen while running the report instead of being saved with it
 */
export interface SprintsParameterConfig {
    range: number;
}

export interface SavedPivotReport extends PivotReportDefinition {
    id: number;
    dateCreated?: Date | string;
    dateUpdated?: Date | string;
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
    dateRangeParameter?: string;
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

export interface SprintsParameterValue {
    boards: AgileBoard[];
    selection: SprintSelectionMap;
}

export type ReportParameterValue =
    | string
    | number
    | boolean
    | Date
    | string[]
    | DateRangeSelection
    | SprintsParameterValue
    | ParameterOption[]
    | UserGroup[];

export interface ReportParameterDefinition {
    name: string;
    type: string;
    isArray?: boolean;
    fieldKey?: string;
    itemType?: string;
    customType?: string;
    jqlField?: string;
    sprintRange?: number;
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
