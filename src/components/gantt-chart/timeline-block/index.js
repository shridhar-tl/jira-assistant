import React from 'react';
import { useGanttProps } from '../store';
import TaskProgress from './TaskProgress';
import './TimelineBlock.scss';

function DateRangeContainer({ items }) {
    const weekHeader = useGanttProps(s => s.weekHeader);
    const dateRange = useGanttProps(s => s.dateRange);

    return (<div className="gantt-table-container">
        <table className="gantt-chart-header days-header">
            <thead>
                <tr className="group-head">
                    {weekHeader.map((week, i) => (<th key={i} colSpan={week.values.length} style={{ width: `${week.values.length * 35}px` }}>{week.display}</th>))}
                </tr>
                <tr className="days-head">
                    {dateRange.map(date => (<th key={date.prop}>{date.dateNum}<br />{date.day}</th>))}
                </tr>
            </thead>
        </table>
        <TaskListFields items={items} columns={dateRange} />
    </div>);
}

export default DateRangeContainer;

function TaskListFields({ columns, items }) {
    return (
        <table className="gantt-chart-body days-body">
            <tbody>
                <TaskRenderer depth={0}
                    columns={columns}
                    columnCount={columns.length}
                    items={items} />
            </tbody>
        </table>);
}

function TaskRenderer({ columns, columnCount, items, depth }) {
    return items?.map((item, i) => (
        <React.Fragment key={i}>
            <tr key={i}>
                <td style={{ width: `${columnCount * 35}px` }}>
                    <TaskProgress columns={columns} item={item} />
                </td>
            </tr>
            {!!item.child?.length && <TaskRenderer
                depth={depth + 1}
                columns={columns}
                columnCount={columnCount}
                items={item.child} />}
        </React.Fragment>
    ));
}
