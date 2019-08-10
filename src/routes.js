import React from 'react';

// common
const CalendarViewComponent = React.lazy(() => import('./views/calendar-view/Calendar'));
const DashboardComponent = React.lazy(() => import('./views/dashboard/Dashboard'));

/*
const BulkImportComponent = React.lazy(() => import('./views/'));

// reports
const CustomReportComponent = React.lazy(() => import('./views/'));*/
const EstimateActualComponent = React.lazy(() => import('./views/reports/estimate-actual/EstimateActualReport'));
//const SprintReportComponent = React.lazy(() => import('./views/'));
const UserDaywiseReportComponent = React.lazy(() => import('./views/reports/user-daywise-report/UserDaywiseReport'));

/*const AdvancedReportComponent = React.lazy(() => import('./views/'));

const GeneralComponent = React.lazy(() => import('./views/'));
*/
const UserGroupsComponent = React.lazy(() => import('./components/UserGroup'));

const FaqViewComponent = React.lazy(() => import('./views/faq-view/FaqView'));
const ContributeComponent = React.lazy(() => import('./views/contribute/Contribute'));
const FeedbackViewComponent = React.lazy(() => import('./views/feedback-view/FeedbackView'));

export const isQuickView = document.location.href.indexOf('?quick=true') > -1;

var sessionBasedRoute = [
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
        component: UserDaywiseReportComponent
    },
    {
        path: '/reports/estimateactual',
        component: EstimateActualComponent
    },
    /*{
        path: '/reports/sprint',
        component: SprintReportComponent
    },
    {
        path: '/reports/customgrouped/:queryId',
        component: CustomReportComponent
    },
    {
        path: '/reports/customgrouped',
        component: CustomReportComponent
    },
    {
        path: '/reports/advanced/:queryId',
        component: AdvancedReportComponent
    },
    {
        path: '/reports/advanced',
        component: AdvancedReportComponent
    },
    {
        path: '/bulkimport',
        component: BulkImportComponent
    },
    {
        path: '/settings/general',
        component: GeneralComponent
    },*/
    {
        path: '/settings/usergroups',
        component: UserGroupsComponent
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

var routes = [
    {
        path: '',
        redirectTo: 'dashboard/0',
        pathMatch: 'full',
    },
    //ToDo: need to handle session
    /*{
        path: '',
        component: FullLayoutComponent,
        canActivate: [SessionService],
        data: {
            title: 'Home'
        },
        children: sessionBasedRoute
    },
    {
        path: ':sessionId?',
        component: FullLayoutComponent,
        canActivate: [SessionService],
        data: {
            title: 'Home'
        },
        children: sessionBasedRoute
    },
    {
        path: 'pages',
        component: SimpleLayoutComponent,
        data: {
            title: 'Pages'
        },
        children: [
            {
                path: '',
                loadChildren: './views/pages/pages.module#PagesModule',
            }
        ]
    }*/
];
// ToDo
//export default routes;