import React from 'react';
import { inject } from '../services/injector-service';
import BaseControl from './BaseControl';

class TimeSpentDisplay extends BaseControl {
    constructor(props) {
        super(props);
        inject(this, "UtilsService");
    }

    renderControl() {
        const { value, inputType = "secs", days } = this.props;
        let { timespent = value } = this.props;

        if (!timespent) { return null; }

        if (inputType === "ticks" && timespent > 500) {
            timespent = parseInt(timespent / 1000);
        }

        return (
            <span>{this.$utils.formatSecs(timespent, undefined, undefined, days)} </span>
        );
    }
}

export default TimeSpentDisplay;