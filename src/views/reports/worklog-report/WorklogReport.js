import React, { PureComponent } from 'react';
import { WorklogGadget } from '../../../gadgets';

class WorklogReport extends PureComponent {
    render() {
        return (
            <WorklogGadget className="widget-cntr" isGadget={false} />
        );
    }
}

export default WorklogReport;