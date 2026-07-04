import React from 'react';

import config from './customize';

// Core
const DashboardComponent = config.modules.dashboards && React.lazy(() => import('./pages/dashboard/Dashboard'));
const CalendarViewComponent = config.modules.calendar && React.lazy(() => import('./pages/calendar/CalendarPage'));

// Bulk Import
const ImportWorklogComponent = config.modules.importWorklog && React.lazy(() => import('./pages/bulk-import/worklog/ImportWorklog'));
const BulkImportIssueComponent = config.modules.importIssues && React.lazy(() => import('./pages/bulk-import/issue/BulkImportIssue'));

// Reports
const PivotReportComponent = config.modules.pivotReport && React.lazy(() => import('./pages/reports/pivot-report'));
const SayDoRatioReportComponent = config.modules.sayDoRatioReport && React.lazy(() => import('./pages/reports/say-do-ratio'));
const EstimateActualComponent = config.modules.estimateVsActual && React.lazy(() => import('./pages/reports/estimate-actual'));
const SprintReportComponent = config.modules.sprintReport && React.lazy(() => import('./pages/reports/sprint-report/SprintReport'));
const NewWorklogReportComponent =
    config.modules.worklogReport && React.lazy(() => import('./pages/reports/worklog-report/NewWorklogReport'));

// Settings
const GeneralSettingsComponent = config.modules.generalSettings && React.lazy(() => import('./pages/settings/general/GeneralSettings'));
const UserGroupsComponent = config.modules.userGroups && React.lazy(() => import('./components/user-group/UserGroup'));
const GlobalSettings = config.modules.advancedSettings && React.lazy(() => import('./pages/settings/global/GlobalSettings'));

// Other
const FeedbackViewComponent = config.modules.contactUs && React.lazy(() => import('./pages/feedback/FeedbackPage'));
const ContributeComponent = config.modules.contribute && React.lazy(() => import('./pages/contribute/ContributePage'));

export const isQuickView = document.location.href.indexOf('?quick=true') > -1;

interface RouteItem {
    path: string;
    component: any;
    name?: string;
}

const sessionBasedRoute: RouteItem[] = [
    DashboardComponent && {
        path: '/dashboard/:index',
        component: DashboardComponent,
    },
    DashboardComponent && {
        path: '/dashboard',
        component: DashboardComponent,
    },
    CalendarViewComponent && {
        path: '/calendar',
        component: CalendarViewComponent,
    },
    NewWorklogReportComponent && {
        path: '/reports/worklog',
        component: NewWorklogReportComponent,
    },
    PivotReportComponent && {
        path: '/reports/pivot',
        component: PivotReportComponent,
    },
    PivotReportComponent && {
        path: '/reports/pivot/:reportId',
        component: PivotReportComponent,
    },
    SayDoRatioReportComponent && {
        path: '/reports/say-do-ratio',
        component: SayDoRatioReportComponent,
    },
    EstimateActualComponent && {
        path: '/reports/estimateactual',
        component: EstimateActualComponent,
    },
    SprintReportComponent && {
        path: '/reports/sprint',
        component: SprintReportComponent,
    },
    ImportWorklogComponent && {
        path: '/import/worklog',
        component: ImportWorklogComponent,
    },
    BulkImportIssueComponent && {
        path: '/import/issue',
        component: BulkImportIssueComponent,
    },
    GeneralSettingsComponent && {
        path: '/settings/general',
        component: GeneralSettingsComponent,
    },
    UserGroupsComponent && {
        path: '/settings/usergroups',
        component: UserGroupsComponent,
    },
    GlobalSettings && {
        path: '/settings/global',
        component: GlobalSettings,
    },
    ContributeComponent && {
        path: '/contribute',
        component: ContributeComponent,
    },
    FeedbackViewComponent && {
        path: '/contact-us',
        component: FeedbackViewComponent,
    },
].filter(Boolean) as RouteItem[];

export default sessionBasedRoute;
