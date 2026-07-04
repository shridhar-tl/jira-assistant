import React from 'react';

import GridCellBase from './GridCellBase';
import { GridCellProps } from './types';

function GridCell(props: GridCellProps) {
    return <GridCellBase {...props} cellType="cell" elementType="td" />;
}

function HeaderCell(props: GridCellProps) {
    const customDisplayControl = () => {
        const { column } = props;
        if (column.headerTemplate) {
            return column.headerTemplate(column, props.index);
        }
        return column.displayText || column.field;
    };

    return <GridCellBase {...props} cellType="header" elementType="th" customDisplayControl={customDisplayControl} />;
}

function FooterCell(props: GridCellProps) {
    const customDisplayControl = () => null;

    return <GridCellBase {...props} cellType="footer" elementType="td" customDisplayControl={customDisplayControl} />;
}

export { GridCell, HeaderCell, FooterCell };
