import React from 'react';

export interface GridContextType {
    beginSelect: (startRow: number, startCell: number) => void;
    endSelect: (endRow: number, endCell: number) => void;
    onSelecting: (endRow: number, endCell: number) => void;
    beginEdit: (editingRow: number, editingCell: number) => void;
    endEdit: (value: any, rowIndex: number, cellIndex: number) => void;
    repeatSelectedCells: () => void;
    beginResize: (index: number, e: React.MouseEvent) => void;
}

const GridContext = React.createContext<GridContextType>({} as GridContextType);
const GridData = GridContext.Provider;

export { GridContext, GridData };
