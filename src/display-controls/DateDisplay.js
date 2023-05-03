import React from 'react';
import { inject } from '../services';
import BaseControl from './BaseControl';

class DateDisplay extends BaseControl {
    constructor(props) {
        super(props);
        inject(this, "UserUtilsService");
    }

    renderControl(badge) {
        const { value, date = value, quick, dateOnly } = this.props;

        if (!date) { return badge; }

        if (value?.text) {
            return <>{value.text} {badge}</>;
        }

        const format = dateOnly ? this.$userutils.formatDate : this.$userutils.formatDateTime;

        return (
            <span title={quick ? format(date) : null}>
                {quick && "about "} {format(date, quick ? "quick" : null)}
            </span>
        );
    }
}

export default DateDisplay;