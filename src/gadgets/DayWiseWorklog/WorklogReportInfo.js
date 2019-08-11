import React, { PureComponent } from 'react';

class WorklogReportInfo extends PureComponent {
    render() {
        return (<div className="pad-15">
            <strong>How to use:</strong>
            <ul>
                <li>
                    Choose a date for which you would like to view the report or click the refresh
                      ( <i className="fa fa-refresh"></i> ) icon to load the report if date is already selected.
                 </li>
                <li>You can choose the list of users by clicking the ( <i className="fa fa-users"></i> ) icon.</li>
                <li>
                    Click on Settings <i className="fa fa-arrow-right"></i> User groups from left hand menu to add users
                    permenantly to a group and use it in future.
                </li>
                <li>Click on ( <i className="fa fa-cogs"></i> ) icon to change the settings of the report.</li>
                <li>
                    Time zone settings - Configure the time zone of each user & group properly
                    while adding in group and select appropriate option in settings as well.
                </li>
                <li>
                    You have additional settings affecting this report in Settings <i className="fa fa-arrow-right"></i>
                    General menu in left hand side.
                </li>
            </ul>
            <p>
                <strong>Note:</strong> Any changes you make to the group or the users under the group in this page will
                not get saved and is only for this session.
            </p>
            <div>
                <strong>Planned enhancements:</strong> Some of the enhancements in roadmap for this reports are as follows
                <ul>
                    <li>Viewing report based on sprint as an additional option alternate for date selection</li>
                    <li>Add custom columns to the report</li>
                </ul>
            </div>
        </div>
        );
    }
}

export default WorklogReportInfo;