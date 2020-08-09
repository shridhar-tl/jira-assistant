import React from 'react';
import { inject } from '../services';
import BaseControl from './BaseControl';

class DateDisplay extends BaseControl {
    constructor(props) {
        super(props);
        inject(this, "UserUtilsService");
    }

    renderControl() {
        const { value, date = value, quick } = this.props;

        return (
            <span title={quick ? this.$userutils.formatDateTime(date) : null}>
                {quick && "about "} {this.$userutils.formatDateTime(date, quick ? "quick" : null)}
            </span>
        );
    }
}

export default DateDisplay;