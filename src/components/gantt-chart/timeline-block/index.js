import React from 'react';
import { useGanttProps } from '../store';
import TaskProgress, { widthOfDayInPx } from './TaskProgress';
import './TimelineBlock.scss';

function DateRangeContainer({ items }) {
    const weekHeader = useGanttProps(s => s.weekHeader);
    const dateRange = useGanttProps(s => s.dateRange);

    return (<div className="relative h-100">
        <HolidayMarker dateRange={dateRange} />
        <div className="absolute gantt-table-container">
            <table className="gantt-chart-header days-header">
                <thead>
                    <tr className="group-head">
                        {weekHeader.map((week, i) => (<th key={i} colSpan={week.values.length} style={{ width: `${week.values.length * widthOfDayInPx}px` }}>{week.display}</th>))}
                    </tr>
                    <tr className="days-head">
                        {dateRange.map(date => (<th key={date.prop}>{date.dateNum}<br /><span style={{ fontSize: '10px', fontWeight: 'bold' }}>{date.day}</span></th>))}
                    </tr>
                </thead>
            </table>
            <TaskListFields items={items} columns={dateRange} />
        </div>
    </div>
    );
}

export default DateRangeContainer;

function HolidayMarker({ dateRange }) {
    return (<div className="relative h-100">
        {dateRange.map((d, i) => (d.isHoliday ? (<div className="weekend-marker" style={{ left: `${i * widthOfDayInPx}px` }} />) : null))}
    </div>);
}

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
