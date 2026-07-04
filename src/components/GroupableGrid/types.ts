import type { ComponentType, ReactNode } from 'react';

export interface ColumnSchema {
    id: string;
    field: string;
    fieldKey?: string;
    hasPath?: boolean;
    displayText: string;
    visible: boolean;
    allowSorting?: boolean;
    groupText?: string;
    allowGrouping?: boolean;
    groupOptions?: GroupOption[];
    format?: ((value: any, row?: any, field?: string) => any) | string;
    type?: string;
    viewComponent?: ComponentType<any>;
    props?: Record<string, any>;
    sortValueFun?: ((value: any) => any) | null;
    groupValueFunc?: ((value: any) => any) | null;
}

export interface ColumnDefinition {
    field: string;
    id?: string;
    fieldKey?: string;
    displayText?: string;
    allowSorting?: boolean;
    allowGrouping?: boolean;
    groupText?: string;
    groupOptions?: GroupOption[];
    format?: ((value: any, row?: any, field?: string) => any) | string;
    type?: string;
    viewComponent?: ComponentType<any>;
    props?: Record<string, any>;
    sortValueFun?: ((value: any) => any) | null;
    groupValueFunc?: ((value: any) => any) | null;
}

export interface GroupByOption {
    id?: string;
    field?: string;
    fieldKey?: string;
    groupKey?: string;
    sortDesc?: boolean;
    settings?: GroupSettings;
}

export interface GroupSettings {
    funcType?: string;
    valueType?: string;
    [key: string]: any;
}

export interface GroupOption {
    label: string;
    type: 'check' | 'radio';
    prop: string;
    value?: any;
    default?: any;
    separator?: boolean;
    aggregate?: string;
}

export interface GroupedColumnSchema extends ColumnSchema {
    sortDesc?: boolean;
    settings?: GroupSettings;
}

export interface GroupedRow {
    key: any;
    keyObj?: any;
    path: string;
    rowSpan: number;
    values: any[];
    hidden?: boolean;
}

export interface GroupableGridSettings {
    groupBy?: (string | GroupByOption)[] | null;
    groupFoldable?: boolean;
    displayColumns?: string[] | null;
    sortField?: string | null;
    isDesc?: boolean;
}

export interface GroupableGridProps {
    dataset: any[];
    columns: ColumnDefinition[];
    displayColumns?: string[] | null;
    groupBy?: (string | GroupByOption)[] | null;
    groupFoldable?: boolean;
    allowSorting?: boolean;
    allowGrouping?: boolean;
    noRowsMessage?: string;
    exportSheetName?: string;
    sortField?: string | null;
    isDesc?: boolean;
    hideGroups?: boolean;
    className?: string;
    onChange?: (settings: GroupableGridSettings) => void;
}

export interface ColumnListProps {
    columns: ColumnSchema[];
    displayColumns?: string[] | null;
    onChange: (displayColumns: string[] | null) => void;
}

export interface GroupedColumnListProps {
    groupBy: GroupedColumnSchema[];
    allColumns: ColumnSchema[];
    displayColumns?: string[] | null;
    foldable?: boolean;
    showColumns?: boolean | null;
    onChange: (groupBy: GroupedColumnSchema[], foldable: boolean, type: string) => void;
    toggleColumns: () => void;
}

export type RenderRow = (row: any, index: number) => ReactNode;
