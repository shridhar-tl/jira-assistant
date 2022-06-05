import React from 'react';
import GlobalSettings from './views/settings/global/GlobalSettings';

// common
const CalendarViewComponent = React.lazy(() => import('./views/calendar-view/Calendar'));
const DashboardComponent = React.lazy(() => import('./views/dashboard/Dashboard'));

// Bulk Import
const ImportWorklogComponent = React.lazy(() => import('./views/bulk-import/worklog/ImportWorklog'));
const ImportIssueComponent = React.lazy(() => import('./views/bulk-import/issue/ImportIssue'));

// reports
const CustomReportComponent = React.lazy(() => import('./views/reports/custom-report/CustomReport'));
const NewCustomReportComponent = React.lazy(() => import('./views/reports/custom-groupable/CustomReport'));
const EstimateActualComponent = React.lazy(() => import('./views/reports/estimate-actual/EstimateActualReport'));
const SprintReportComponent = React.lazy(() => import('./views/reports/sprint-report/SprintReport'));
const WorklogReportComponent = React.lazy(() => import('./views/reports/worklog-report/WorklogReport'));

const ReportBuilderComponent = React.lazy(() => import('./views/reports/report-builder/ReportBuilder'));

const GeneralSettingsComponent = React.lazy(() => import('./views/settings/general/GeneralSettings'));

const UserGroupsComponent = React.lazy(() => import('./components/user-group/UserGroup'));

const FaqViewComponent = React.lazy(() => import('./views/faq-view/FaqView'));
const ContributeComponent = React.lazy(() => import('./views/contribute/Contribute'));
const FeedbackViewComponent = React.lazy(() => import('./views/feedback-view/FeedbackView'));

export const isQuickView = document.location.href.indexOf('?quick=true') > -1;

const sessionBasedRoute = [
    {
        path: '/dashboard/:index/:isQuickView',
        component: DashboardComponent
    },
    {
        path: '/dashboard/:index',
        component: DashboardComponent,
        isExact: true
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
        path: '/reports/estimateactual',
        component: EstimateActualComponent
    },
    {
        path: '/reports/sprint',
        component: SprintReportComponent
    },
    {
        path: '/reports/customgrouped/:reportId',
        component: CustomReportComponent
    },
    {
        path: '/reports/customgrouped',
        component: CustomReportComponent
    },
    {
        path: '/reports/custom/:reportId',
        component: NewCustomReportComponent
    },
    {
        path: '/reports/custom',
        component: NewCustomReportComponent
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
        component: ImportIssueComponent
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
        path: '/faq/:query',
        component: FaqViewComponent
    },
    {
        path: '/faq',
        component: FaqViewComponent,
        isExact: true
    },
    {
        path: '/feedback',
        component: FeedbackViewComponent
    }
];
export default sessionBasedRoute;
