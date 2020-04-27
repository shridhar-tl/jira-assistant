import React, { PureComponent } from 'react';
import { inject } from '../services';

class DateDisplay extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "UserUtilsService");
    }

    render() {
        const { tag: Tag = "span", className, date, quick } = this.props;

        return (
            <Tag className={className} title={quick ? this.$userutils.formatDateTime(date) : null}>
                {quick && "about "} {this.$userutils.formatDateTime(date, quick ? "quick" : null)}
            </Tag>
        );
    }
}

export default DateDisplay;