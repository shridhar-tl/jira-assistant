import React from 'react';
import config from './customize';

// Core
const DashboardComponent = config.modules.dashboards && React.lazy(() => import('./views/dashboard/Dashboard'));
const CalendarViewComponent = config.modules.calendar && React.lazy(() => import('./views/calendar-view/Calendar'));

// Bulk Import
const ImportWorklogComponent = config.modules.importWorklog && React.lazy(() => import('./views/bulk-import/worklog/ImportWorklog'));
const BulkImportIssueComponent = config.modules.importIssues && React.lazy(() => import('./views/bulk-import/issue/BulkImportIssue'));

// Reports
const PivotReportComponent = config.modules.pivotReport && React.lazy(() => import('./views/reports/pivot-report'));
const SayDoRatioReportComponent = config.modules.sayDoRatioReport && React.lazy(() => import('./views/reports/say-do-ratio'));
const CustomReportComponent = config.modules.customReport && React.lazy(() => import('./views/reports/custom-groupable/CustomReport'));
const EstimateActualComponent = config.modules.estimateVsActual && React.lazy(() => import('./views/reports/estimate-actual/EstimateActualReport'));
const SprintReportComponent = config.modules.sprintReport && React.lazy(() => import('./views/reports/sprint-report/SprintReport'));
const WorklogReportComponent = config.modules.worklogReportOld && React.lazy(() => import('./views/reports/worklog-report/WorklogReport'));
const NewWorklogReportComponent = config.modules.worklogReport && React.lazy(() => import('./views/reports/worklog-report/NewWorklogReport'));
const ReportBuilderComponent = config.modules.reportBuilder && React.lazy(() => import('./views/reports/report-builder/ReportBuilder'));

// Settings
const GeneralSettingsComponent = config.modules.generalSettings && React.lazy(() => import('./views/settings/general/GeneralSettings'));
const UserGroupsComponent = config.modules.userGroups && React.lazy(() => import('./components/user-group/UserGroup'));
const GlobalSettings = config.modules.advancedSettings && React.lazy(() => import('./views/settings/global/GlobalSettings'));

// Other
const FeedbackViewComponent = config.modules.contactUs && React.lazy(() => import('./views/feedback-view/FeedbackView'));
const ContributeComponent = config.modules.contribute && React.lazy(() => import('./views/contribute/Contribute'));

export const isQuickView = document.location.href.indexOf('?quick=true') > -1;

const sessionBasedRoute = [
    DashboardComponent && {
        path: '/dashboard/:index',
        component: DashboardComponent
    },
    DashboardComponent && {
        path: '/dashboard',
        component: DashboardComponent
    },
    CalendarViewComponent && {
        path: '/calendar',
        component: CalendarViewComponent
    },
    WorklogReportComponent && {
        path: '/reports/userdaywise',
        component: WorklogReportComponent
    },
    NewWorklogReportComponent && {
        path: '/reports/worklog',
        component: NewWorklogReportComponent
    },
    PivotReportComponent && {
        path: '/reports/pivot',
        component: PivotReportComponent
    },
    PivotReportComponent && {
        path: '/reports/pivot/:reportId',
        component: PivotReportComponent
    },
    SayDoRatioReportComponent && {
        path: '/reports/say-do-ratio',
        component: SayDoRatioReportComponent
    },
    EstimateActualComponent && {
        path: '/reports/estimateactual',
        component: EstimateActualComponent
    },
    SprintReportComponent && {
        path: '/reports/sprint',
        component: SprintReportComponent
    },
    CustomReportComponent && {
        path: '/reports/custom/:reportId',
        component: CustomReportComponent
    },
    CustomReportComponent && {
        path: '/reports/custom',
        component: CustomReportComponent
    },
    ReportBuilderComponent && {
        path: '/reports/advanced/:reportId',
        component: ReportBuilderComponent
    },
    ReportBuilderComponent && {
        path: '/reports/advanced',
        component: ReportBuilderComponent
    },
    ImportWorklogComponent && {
        path: '/import/worklog',
        component: ImportWorklogComponent
    },
    BulkImportIssueComponent && {
        path: '/import/issue',
        component: BulkImportIssueComponent
    },
    GeneralSettingsComponent && {
        path: '/settings/general',
        component: GeneralSettingsComponent
    },
    UserGroupsComponent && {
        path: '/settings/usergroups',
        component: UserGroupsComponent
    },
    GlobalSettings && {
        path: '/settings/global',
        component: GlobalSettings
    },
    ContributeComponent && {
        path: '/contribute',
        component: ContributeComponent
    },
    FeedbackViewComponent && {
        path: '/contact-us',
        component: FeedbackViewComponent
    }
].filter(Boolean);

export default sessionBasedRoute;
