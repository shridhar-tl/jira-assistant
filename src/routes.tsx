import React from 'react';

import config from './customize';

// Compared inline (not via build-info) so the bundler drops the page from builds that have no poker route.
const hasPokerRoute = import.meta.env.VITE_BUILD_MODE === 'WEB' || import.meta.env.VITE_BUILD_MODE === 'PLUGIN';

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
const WorkloadHeatmapComponent =
    config.modules.workloadHeatmap && React.lazy(() => import('./pages/reports/workload-heatmap/WorkloadHeatmapReport'));
const TimeInStatusComponent =
    config.modules.timeInStatus && React.lazy(() => import('./pages/reports/time-in-status/TimeInStatusReport'));
const NewWorklogReportComponent =
    config.modules.worklogReport && React.lazy(() => import('./pages/reports/worklog-report/NewWorklogReport'));

// Settings
const GeneralSettingsComponent = config.modules.generalSettings && React.lazy(() => import('./pages/settings/general/GeneralSettings'));
const UserGroupsComponent = config.modules.userGroups && React.lazy(() => import('./components/user-group/UserGroup'));
const GlobalSettings = config.modules.advancedSettings && React.lazy(() => import('./pages/settings/global/GlobalSettings'));

// Activities
const PokerComponent = hasPokerRoute && config.modules.planningPoker && React.lazy(() => import('./pages/poker/PokerPage'));

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
    WorkloadHeatmapComponent && {
        path: '/reports/workload-heatmap',
        component: WorkloadHeatmapComponent,
    },
    TimeInStatusComponent && {
        path: '/reports/time-in-status',
        component: TimeInStatusComponent,
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
    PokerComponent && {
        path: '/poker/*',
        component: PokerComponent,
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
