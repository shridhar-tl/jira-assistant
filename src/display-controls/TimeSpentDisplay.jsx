import React from 'react';
import { inject } from '../services/injector-service';
import BaseControl from './BaseControl';

class TimeSpentDisplay extends BaseControl {
    constructor(props) {
        super(props);
        inject(this, "UtilsService");
    }

    renderControl(badge) {
        const { value, inputType = "secs", format = true, days, converter } = this.props;
        let { timespent = value } = this.props;

        if (converter) { timespent = converter(timespent); }

        if (!timespent) { return badge; }

        if (inputType === "ticks" && timespent > 500) {
            timespent = parseInt(timespent / 1000);
        }


        if (timespent?.text) {
            timespent = timespent.text;
        } else if (format === false) {
            timespent = this.$utils.convertSecs(timespent, { showZeroSecs: true });
        } else {
            timespent = this.$utils.formatSecs(timespent, undefined, undefined, days);
        }

        return (
            <span>{timespent} {badge}</span>
        );
    }
}

export default TimeSpentDisplay;