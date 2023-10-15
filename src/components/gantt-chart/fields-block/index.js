import React from 'react';
import { getPathValue } from 'react-controls/common/utils';
import './FieldBlockStyles.scss';

function FieldsContainer({ columns, items, leftBlock, rightBlock }) {
    const tableHeader = React.useRef(null);

    const scrollHandler = React.useCallback((e) => {
        const left = `${-e.target.scrollLeft}px`;

        if (rightBlock.current) {
            rightBlock.current.scrollTo({ top: e.target.scrollTop });
        }

        if (tableHeader.current) {
            tableHeader.current.style.marginLeft = left;
        }
    }, [rightBlock]);

    return (<div className="gantt-table-container">
        <table ref={tableHeader} className="gantt-chart-header fields-header">
            <thead>
                <tr>
                    {columns.map(column => (<th key={column.field} style={{ width: column.width }}>{column.headerText}</th>))}
                </tr>
            </thead>
        </table>
        <TaskListFields columns={columns} items={items} containerRef={leftBlock} onScroll={scrollHandler} />
    </div>);
}

export default FieldsContainer;

function TaskListFields({ columns, items, onScroll, containerRef }) {
    return (
        <div ref={containerRef} className="gantt-body-container hide-scroll-v" onScroll={onScroll}>
            <table className="gantt-chart-body fields-body">
                <tbody>
                    <TaskRenderer depth={0} columns={columns} items={items} />
                </tbody>
            </table>
        </div>);
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