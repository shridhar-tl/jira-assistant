import React from 'react';
import { ColumnHeader, CollapsedColumnHeader } from './ColumnHeader';
import { ColumnBody, CollapsedBody } from './ColumnBody';
import './Board.scss';

function KanbanBoard({
    columns, columnTemplate, templateScope,
    columnKeyField, headerTextField,
    bodyHeaderTemplate: BodyHeaderTemplate,
    filterItems, itemsTemplate, placeholder,
    onChange, onDrop
}) {
    const [collapsedStates, setCollapsedStates] = React.useState({});
    const toggleCollapse = React.useCallback((colId, collapse) => setCollapsedStates(state => ({ ...state, [colId]: collapse })), [setCollapsedStates]);

    return (<div className="board-container">
        <table className="board w-100">
            <thead className="header">
                <tr>
                    {columns.map((column, i) => {
                        const keyValue = columnKeyField ? column[columnKeyField] : i;
                        const collapsed = collapsedStates[keyValue];
                        const ColumnHeaderTemplate = collapsed ? CollapsedColumnHeader : ColumnHeader;

                        return (<ColumnHeaderTemplate key={i}
                            column={column}
                            keyField={keyValue}
                            template={columnTemplate}
                            scope={templateScope}
                            collapsed={collapsedStates[column[columnKeyField]]}
                            setCollapse={toggleCollapse}
                        />);
                    })}
                </tr>
            </thead>
            {BodyHeaderTemplate && <BodyHeaderTemplate collapsedStates={collapsedStates} />}
            <tbody className="body">
                <tr>
                    {columns.map((column, i) => {
                        const keyValue = columnKeyField ? column[columnKeyField] : i;
                        const collapsed = collapsedStates[keyValue];
                        const ColumnBodyTemplate = collapsed ? CollapsedBody : ColumnBody;

                        return (<ColumnBodyTemplate
                            key={i}
                            column={column}
                            keyField={keyValue}
                            template={itemsTemplate}
                            headerTextField={headerTextField}
                            scope={templateScope}
                            filterItems={filterItems}
                            placeholder={placeholder}
                            setCollapse={toggleCollapse}
                            onChange={onChange}
                            onDrop={onDrop}
                        />);
                    })}
                </tr>
            </tbody>
        </table>
    </div>);
}

export default KanbanBoard;
