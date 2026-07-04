export interface GridColumn {
    field: string;
    displayText?: string;
    width?: number;
    editable?: boolean;
    headerEditable?: boolean;
    cellEditable?: boolean;
    footerEditable?: boolean;
    style?: React.CSSProperties;
    headerTemplate?: (column: GridColumn, index: number) => React.ReactNode;
    cellTemplate?: (column: GridColumn, data: any, index: number, rowIndex: number, modProps?: any) => React.ReactNode;
    footerTemplate?: (column: GridColumn, data: any, index: number, rowIndex: number, modProps?: any) => React.ReactNode;
    headerEditorTemplate?: (
        data: any,
        column: GridColumn,
        rowIndex: number,
        index: number,
        setNewValue: (value: any) => void,
        cancelEdit: () => void,
    ) => React.ReactNode | undefined;
    cellEditorTemplate?: (
        data: any,
        column: GridColumn,
        rowIndex: number,
        index: number,
        setNewValue: (value: any) => void,
        cancelEdit: () => void,
    ) => React.ReactNode | undefined;
    footerEditorTemplate?: (
        data: any,
        column: GridColumn,
        rowIndex: number,
        index: number,
        setNewValue: (value: any) => void,
        cancelEdit: () => void,
    ) => React.ReactNode | undefined;
}

export interface EditableGridProps {
    columns: GridColumn[];
    rows: any[];
    onChange?: (rows: any[], columns: GridColumn[], rowIndex?: number, cellIndex?: number) => void;
    onHeaderChange?: (column: GridColumn, cellIndex: number) => void;
    showFooter?: boolean;
    width?: string | number;
    height?: string | number;
    noRowMessage?: React.ReactNode;
    getRowHeaderClassName?: (row: any, index: number) => string;
    className?: string;
    tabIndex?: number;
}

export interface GridCellProps {
    column: GridColumn;
    data?: any;
    index: number;
    rowIndex: number;
    className?: string;
    domProps?: React.TdHTMLAttributes<HTMLTableCellElement>;
    isLastCell?: boolean;
}
