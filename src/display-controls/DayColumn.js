import React from 'react';
import './DayColumn.scss';

function DayColumn(props) {
    const { value, tagProps = {} } = props;

    if (!value) { return null; }

    return (
        <th data-test-id={value.prop} className={`day-head${value.isHoliday ? ' holiday' : ''}`}{...tagProps}>
            {value.dateNum}<br /><span className="day-name">{value.day}</span>
        </th>
    );
}

export default DayColumn;