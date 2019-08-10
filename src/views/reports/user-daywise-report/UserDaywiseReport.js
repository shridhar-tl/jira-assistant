import React, { PureComponent } from 'react';
import { DayWiseWorklog } from '../../../gadgets';

class UserDaywiseReport extends PureComponent {
    render() {
        return (
            <DayWiseWorklog className="widget-cntr" isGadget={false} />
        );
    }
}

export default UserDaywiseReport;