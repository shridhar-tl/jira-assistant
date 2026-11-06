import { ReportInfoNote, ReportInfoSection } from '../shared';

const howToUseItems = [
    <>
        By default, this page generates a worklog report based on the selected <strong>date range</strong>.
    </>,
    <>
        To generate a report based on <strong>sprints</strong>, click the <i className="fa fa-cogs" /> settings icon to customize the data
        source.
    </>,
    <>
        Use the <i className="fa fa-cogs" /> settings icon to access advanced options including display formatting, additional columns,
        worklog filtering, and JQL data filtering.
    </>,
    <>
        Choose a date or sprint, then click <i className="fa fa-refresh" /> refresh to load the report.
    </>,
    <>
        Manage user lists by clicking the <i className="fa fa-users" /> icon in the toolbar.
    </>,
    <>
        Access <strong>Settings &rarr; User Groups</strong> in the left menu to create and manage user groups for future reports.
    </>,
    'Configure time zone settings for each user and group when adding them. Select matching options in report settings as well.',
];

const whatsNewItems = [
    'Alternate option to view the report based on sprints instead of date range selection.',
    'Option to filter or identify worklogs created after the threshold date.',
    'Ability to generate a report without specifying a user group.',
    'Option to pull all worklogs based on a selected project.',
    'Automatic grouping of users and worklogs by project, epic, or issue type.',
];

function WorklogReportInfo() {
    return (
        <div className="p-6 space-y-4">
            <ReportInfoSection title="How to Use" icon="fa-info-circle" items={howToUseItems} defaultOpen />
            <ReportInfoSection title="What's New" icon="fa-star" variant="new" items={whatsNewItems} />
            <ReportInfoNote>Any changes made to groups or users on this page are temporary and will not be saved permanently.</ReportInfoNote>
        </div>
    );
}

export default WorklogReportInfo;
