import React from 'react';
import { DefaultWorkingDays } from '../../../constants/settings';

const shortDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function WeekDaysSelector({ field, value: inputValue, onChange }) {
    const value = inputValue || WeekDaysSelector.defaultSelection || [];

    const getClass = ($index) => (value.includes($index) ? 'day day-on' : 'day');

    const daySelected = (val) => {
        let newValue = value;

        if (newValue.includes(val)) {
            newValue = newValue.filter(v => v !== val);
        } else {
            newValue = newValue.concat(val).sort();
        }

        onChange(newValue, field);
    };

    return (
        <div className="days-in-week">
            {shortDays.map((day, i) => <div key={day} className={getClass(i)} onClick={() => daySelected(i)}>{day}</div>)}
        </div>
    );
}

export default WeekDaysSelector;

WeekDaysSelector.defaultSelection = DefaultWorkingDays;