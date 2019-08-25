import React, { PureComponent } from 'react';
import { Calendar } from '../../gadgets';
import './Calendar.scss';

class CalendarView extends PureComponent {
    render() {
        return (
            <div className="calendar-view">
                <Calendar isGadget={false} />
            </div>
        );
    }
}

export default CalendarView;