import React from 'react';
import { ColumnHeader, CollapsedColumnHeader } from './ColumnHeader';
import { ColumnBody, CollapsedBody } from './ColumnBody';
import './Board.scss';

function KanbanBoard({
    columns, columnTemplate, templateScope,
    columnKeyField, headerTextField,
    bodyHeaderTemplate: BodyHeaderTemplate,
    filterItems, itemsTemplate, placeholder,
    onChange
}) {
    const [collapsedStates, setCollapsedStates] = React.useState({});
    const toggleCollapse = React.useCallback((colId, collapse) => setCollapsedStates(state => ({ ...state, [colId]: collapse })), [setCollapsedStates]);

    return (<div className="board-container">
        <table className="board w-100">
            <BoardHeader
                columns={columns}
                columnKeyField={columnKeyField}
                collapsedStates={collapsedStates}
                columnTemplate={columnTemplate}
                templateScope={templateScope}
                toggleCollapse={toggleCollapse}
            />
            {BodyHeaderTemplate && <BodyHeaderTemplate columns={columns} collapsedStates={collapsedStates} />}
            <BoardBody columns={columns}
                columnKeyField={columnKeyField}
                collapsedStates={collapsedStates}
                itemsTemplate={itemsTemplate}
                headerTextField={headerTextField}
                templateScope={templateScope}
                filterItems={filterItems}
                placeholder={placeholder}
                toggleCollapse={toggleCollapse}
                onChange={onChange}
            />
        </table>
    </div>);
}

export default KanbanBoard;

function BoardHeader({
    columns, columnKeyField, collapsedStates,
    columnTemplate, templateScope, toggleCollapse
}) {
    return (<thead className="header">
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
    </thead>);
}

function BoardBody({ columns, columnKeyField, collapsedStates, itemsTemplate, headerTextField, templateScope, filterItems, placeholder, toggleCollapse, onChange }) {
    return (<tbody className="body">
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
                />);
            })}
        </tr>
    </tbody>);
}