import React, { PureComponent } from 'react';
import { inject } from '../services/injector-service';

class TicketDisplay extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "UserUtilsService");
    }

    render() {
        const { value, url = this.$userutils.getTicketUrl(value) } = this.props;
        return (
            <a href={url} className="link" target="_blank" rel="noopener noreferrer">{value}</a>
        );
    }
}

export default TicketDisplay;