import React, { PureComponent } from 'react';
import { WorklogReport as WorklogReportGadget } from '../../../gadgets';

class WorklogReport extends PureComponent {
    render() {
        return (
            <WorklogReportGadget className="widget-cntr" isGadget={false} />
        );
    }
}

export default WorklogReport;