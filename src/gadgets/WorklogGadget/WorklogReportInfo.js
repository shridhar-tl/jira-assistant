import React, { PureComponent } from 'react';

class WorklogReportInfo extends PureComponent {
    render() {
        return (<div className="pad-15">
            <h2>DEPRECATED</h2>
            <ul>
                <li>This Old worklog report is depricated. Please use new worklog report</li>
                <li>This report would be removed over time after New Worklog report is stable</li>
                <li>No new enhancments / bug fixes would be provided in this report</li>
                <li>If you face any issue with new Worklog report, please report that issue so that it is resolved before this report is removed</li>
            </ul>
        </div>
        );
    }
}

export default WorklogReportInfo;