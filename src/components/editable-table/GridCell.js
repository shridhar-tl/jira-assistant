import GridCellBase from './GridCellBase';

class GridCell extends GridCellBase {
    static cellType = 'cell';
    cellType = 'cell';
}

class HeaderCell extends GridCellBase {
    static setWidth = true;
    static cellType = 'header';
    cellType = 'header';
    elementType = 'th';

    getDisplayControl = () => {
        const { column } = this.props;
        if (column.headerTemplate) {
            return column.headerTemplate(column, this.index);
        }

        return column.displayText || column.field;
    };
}

class FooterCell extends GridCellBase {
    static setWidth = true;
    static cellType = 'footer';
    cellType = 'footer';

    getDisplayControl = () => null;
}

export { GridCell, HeaderCell, FooterCell };