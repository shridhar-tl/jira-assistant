import React, { PureComponent } from 'react';
import './Calendar.scss';
import { Calendar } from '../../gadgets';

class CalendarView extends PureComponent {
    render() {
        return (
            <div className="">
                <Calendar isGadget={false} />
            </div>
        );
    }
}

export default CalendarView;