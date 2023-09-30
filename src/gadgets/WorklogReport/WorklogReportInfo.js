import React from 'react';

function WorklogReportInfo() {
    return (<div className="pad-15">
        <section>
            <h2>How to Use</h2>
            <ul>
                <li>
                    By default, this page allows you to generate a worklog report based on the selected date range.
                </li>
                <li>
                    To generate a report based on one or more sprints, click the
                    <i className="fa fa-cogs"></i> icon to customize report settings.
                </li>
                <li>
                    Click the <i className="fa fa-cogs"></i> icon to access advanced report settings,
                    including display formatting, additional columns, worklog filtering by threshold date,
                    JQL data filtering, and more.
                </li>
                <li>
                    Choose a date or sprint to view the report, or click the refresh
                    <i className="fa fa-refresh"></i> icon to reload the report if a date or sprint is already selected.
                </li>
                <li>
                    Manage user lists by clicking the <i className="fa fa-users"></i> icon.
                </li>
                <li>
                    Access Settings <i className="fa fa-arrow-right"></i> User Groups in the left-hand menu
                    to create and manage user groups for future use.
                </li>
                <li>
                    Configure time zone settings for each user and group when adding them to a group.
                    Select the appropriate options in settings as well.
                </li>
                <li>
                    Additional settings for this report can be found in Settings <i className="fa fa-arrow-right"></i>
                    General in the left-hand menu.
                </li>
            </ul>
            <p>
                <strong>Note:</strong> Any changes made to the group or users under the group on this page
                will not be saved and are only applicable for this session.
            </p>
        </section>
        <section>
            <h2>What's New</h2>
            <ul>
                <li>Alternate option to view the report based on sprints instead of date range selection.</li>
                <li>Option to filter or identify worklogs created after the threshold date.</li>
                <li>Ability to generate a report without specifying a user group.</li>
                <li>Option to pull all worklogs based on a selected project.</li>
                <li>Automatic grouping of users and worklogs by project, epic, or issue type when pulling worklogs
                    based on a date range.
                </li>
            </ul>
        </section>
    </div>
    );
}

export default WorklogReportInfo;