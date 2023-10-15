import React from 'react';
import { useGanttProps } from '../store';
import TaskProgress, { widthOfDayInPx } from './TaskProgress';
import Markers from './markers';
import './TimelineBlock.scss';

function DateRangeContainer({ items, leftBlock, rightBlock }) {
    const markerRef = React.useRef();
    const holidayRef = React.useRef();

    const tableHeader = React.useRef(null);

    const scrollHandler = React.useCallback((e) => {
        const left = `${-e.target.scrollLeft}px`;

        if (tableHeader.current) {
            tableHeader.current.style.marginLeft = left;
        }

        const top = e.target.scrollTop;

        if (leftBlock.current) {
            leftBlock.current.scrollTo({ top });
        }

        const marginTop = `${top}px`;
        if (markerRef.current) {
            markerRef.current.style.marginTop = marginTop;
        }

        if (holidayRef.current) {
            holidayRef.current.style.marginTop = marginTop;
        }
    }, [leftBlock]);

    const weekHeader = useGanttProps(s => s.weekHeader);
    const dateRange = useGanttProps(s => s.dateRange);

    return (
        <div className="gantt-table-container">
            <table ref={tableHeader} className="gantt-chart-header days-header">
                <thead>
                    <tr className="group-head">
                        {weekHeader.map((week, i) => (<th key={i} colSpan={week.values.length} style={{ width: `${week.values.length * widthOfDayInPx}px` }}>{week.display}</th>))}
                    </tr>
                    <tr className="days-head">
                        {dateRange.map(date => (<th key={date.prop}>{date.dateNum}<br />
                            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>
                                {date.day}
                            </span>
                        </th>))}
                    </tr>
                </thead>
            </table>
            <div ref={rightBlock} className="gantt-body-container relative" onScroll={scrollHandler}>
                <HolidayMarker dateRange={dateRange} divRef={holidayRef} />
                <Markers columns={dateRange} divRef={markerRef} />
                <TaskListFields items={items} columns={dateRange} />
            </div>
        </div>
    );
}

export default DateRangeContainer;

function HolidayMarker({ dateRange, divRef }) {
    return <div ref={divRef} className="abs-height">
        {dateRange.map((d, i) => (d.isHoliday ? (<div className="weekend-marker" style={{ left: `${i * widthOfDayInPx}px` }} />) : null))}
    </div>;
}

function TaskListFields({ columns, items }) {
    return (
        <table className="absolute gantt-chart-body days-body">
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
