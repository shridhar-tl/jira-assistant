import React from 'react';

function WorklogReportInfo() {
    return (<div className="pad-15">
        <strong>How to use:</strong>
        <ul>
            <li>
                By default this page lets you to generate worklog report based on the selected date range.
            </li>
            <li>If you want to generate the report based on one or more sprints,
                click on ( <i className="fa fa-cogs"></i>) icon to change the settings of the report.
            </li>
            <li>Click on ( <i className="fa fa-cogs"></i>) icon to change multiple other settings of the report
                like formating of display, add additional columns, setting threshold date to filter worklogs, JQL to filter data, etc..
            </li>
            <li>
                Choose a date or sprint for which you would like to view the report or click the refresh
                ( <i className="fa fa-refresh"></i> ) icon to load the report if date or sprint is already selected.
            </li>
            <li>You can choose the list of users by clicking the ( <i className="fa fa-users"></i> ) icon.</li>
            <li>
                Click on Settings <i className="fa fa-arrow-right"></i> User groups from left hand menu to add users
                permanently to a group and use it in future.
            </li>
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
            <strong>What is new?</strong>
            <ul>
                <li>Viewing report based on sprint as an additional option along with date range selection</li>
                <li>Option to eliminate or identify the worklogs created after the threshold date</li>
                <li>Options to pull the report without specifiying the user group</li>
                <li>Automatically group the users based on project when user group is not provided and worklog pulled based on date range</li>
            </ul>
        </div>
    </div>
    );
}

export default WorklogReportInfo;