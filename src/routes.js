import React from 'react';

// Core
const DashboardComponent = React.lazy(() => import('./views/dashboard/Dashboard'));
const CalendarViewComponent = React.lazy(() => import('./views/calendar-view/Calendar'));

// Bulk Import
const ImportWorklogComponent = React.lazy(() => import('./views/bulk-import/worklog/ImportWorklog'));
const BulkImportIssueComponent = React.lazy(() => import('./views/bulk-import/issue/BulkImportIssue'));

// Reports
const CustomReportComponent = React.lazy(() => import('./views/reports/custom-groupable/CustomReport'));
const EstimateActualComponent = React.lazy(() => import('./views/reports/estimate-actual/EstimateActualReport'));
const SprintReportComponent = React.lazy(() => import('./views/reports/sprint-report/SprintReport'));
const WorklogReportComponent = React.lazy(() => import('./views/reports/worklog-report/WorklogReport'));
const NewWorklogReportComponent = React.lazy(() => import('./views/reports/worklog-report/NewWorklogReport'));
const ReportBuilderComponent = React.lazy(() => import('./views/reports/report-builder/ReportBuilder'));

// Settings
const GeneralSettingsComponent = React.lazy(() => import('./views/settings/general/GeneralSettings'));
const UserGroupsComponent = React.lazy(() => import('./components/user-group/UserGroup'));
const GlobalSettings = React.lazy(() => import('./views/settings/global/GlobalSettings'));

// Other
const FeedbackViewComponent = React.lazy(() => import('./views/feedback-view/FeedbackView'));
const ContributeComponent = React.lazy(() => import('./views/contribute/Contribute'));

export const isQuickView = document.location.href.indexOf('?quick=true') > -1;

const sessionBasedRoute = [
    {
        path: '/dashboard/:index',
        component: DashboardComponent
    },
    {
        path: '/calendar',
        component: CalendarViewComponent
    },
    {
        path: '/reports/userdaywise',
        component: WorklogReportComponent
    },
    {
        path: '/reports/worklog',
        component: NewWorklogReportComponent
    },
    {
        path: '/reports/estimateactual',
        component: EstimateActualComponent
    },
    {
        path: '/reports/sprint',
        component: SprintReportComponent
    },
    {
        path: '/reports/custom/:reportId',
        component: CustomReportComponent
    },
    {
        path: '/reports/custom',
        component: CustomReportComponent
    },
    {
        path: '/reports/advanced/:reportId',
        component: ReportBuilderComponent
    },
    {
        path: '/reports/advanced',
        component: ReportBuilderComponent
    },
    {
        path: '/import/worklog',
        component: ImportWorklogComponent
    },
    {
        path: '/import/issue',
        component: BulkImportIssueComponent
    },
    {
        path: '/settings/general',
        component: GeneralSettingsComponent
    },
    {
        path: '/settings/usergroups',
        component: UserGroupsComponent
    },
    {
        path: '/settings/global',
        component: GlobalSettings
    },
    {
        path: '/contribute',
        component: ContributeComponent
    },
    {
        path: '/contactus',
        component: FeedbackViewComponent
    }
];

export default sessionBasedRoute;
