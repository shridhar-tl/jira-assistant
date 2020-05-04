import React, { PureComponent } from 'react';
import { inject } from '../services/injector-service';

class TimeSpentDisplay extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "UtilsService");
    }

    render() {
        const { tag: Tag = "span", className, value, inputType = "secs", days } = this.props;
        let { timespent = value } = this.props;

        if (!timespent) { return null; }

        if (inputType === "ticks" && timespent > 500) {
            timespent = parseInt(timespent / 1000);
        }

        return (
            <Tag className={className}>{this.$utils.formatSecs(timespent, undefined, undefined, days)} </Tag>
        );
    }
}

export default TimeSpentDisplay;