import React from 'react';
import { getPathValue } from 'react-controls/common/utils';
import './FieldBlockStyles.scss';

function FieldsContainer({ columns, items }) {
    return (<div className="gantt-table-container">
        <table className="gantt-chart-header fields-header">
            <thead>
                <tr>
                    {columns.map(column => (<th key={column.field} style={{ width: column.width }}>{column.headerText}</th>))}
                </tr>
            </thead>
        </table>
        <TaskListFields columns={columns} items={items} />
    </div>);
}

export default FieldsContainer;

function TaskListFields({ columns, items }) {
    return (
        <table className="gantt-chart-body fields-body">
            <tbody>
                <TaskRenderer depth={0} columns={columns} items={items} />
            </tbody>
        </table>);
}

function TaskRenderer({ columns, items, depth }) {
    return items?.map((item, i) => (
        <React.Fragment>
            <tr key={i}>
                {columns.map((column, c) => {
                    const { field, template, width } = column;
                    const Template = template;
                    const value = getPathValue(item, field);
                    let output = value;

                    if (Template) {
                        output = (<Template value={value} taskData={item} column={column} depth={depth} />);
                    }

                    return (<td key={column.field}
                        style={{ width, paddingLeft: !c && `${20 + (depth * 25)}px` }}>
                        <div className="cell-data">
                            {!c && !!item.child?.length && <span className="fa-solid fa-caret-down pe-2" />}
                            {output}</div>
                    </td>);
                })}
            </tr>
            {!!item.child?.length && <TaskRenderer depth={depth + 1} columns={columns} items={item.child} />}
        </React.Fragment>
    ));
}