import { type ComponentType, lazy, type LazyExoticComponent, StrictMode, Suspense } from 'react';

import { createRoot } from 'react-dom/client';

import { HashRouter } from 'react-router';

import { FullContext, view } from '@forge/bridge';

import { BlockLoading } from '@components';

import { dashboardModuleKeys, type DashboardItemProps, setupDashboardHost } from './jcloud/dashboard-host';
import { applyPokerDeepLink } from './pages/poker/deep-link.plugin';
import './index.css';
import './index.plugin.css';
import { syncJiraTheme } from './jcloud/jira-theme';

const App = lazy(() => import('./App'));

const UserGroups = lazy(() => import('./jcloud/modals/UserGroup'));
const WLReportConfig = lazy(() => import('./jcloud/gadgets/team-worklog/ConfigModal'));
const DayWiseWorklogGadget = lazy(() => import('./jcloud/gadgets/date-wise-worklog'));
const WorklogBarChartGadget = lazy(() => import('./jcloud/gadgets/worklog-bar-chart'));
const WorklogTimerGadget = lazy(() => import('./jcloud/gadgets/worklog-timer'));
const TeamWorklogGadget = lazy(() => import('./jcloud/gadgets/team-worklog'));
const WorkloadHeatmapWidget = lazy(() => import('./jcloud/gadgets/workload-heatmap'));
const TimeInStatusWidget = lazy(() => import('./jcloud/gadgets/time-in-status'));
const IssueGlance = lazy(() => import('./jcloud/issue-glance'));

const fallback = <BlockLoading text="Loading... Please wait..." />;

const dashboardItems: Record<string, LazyExoticComponent<ComponentType<DashboardItemProps>>> = {
    [dashboardModuleKeys.dateWiseWorklog.gadget]: DayWiseWorklogGadget,
    [dashboardModuleKeys.dateWiseWorklog.widget]: DayWiseWorklogGadget,
    [dashboardModuleKeys.worklogTimer.gadget]: WorklogTimerGadget,
    [dashboardModuleKeys.worklogTimer.widget]: WorklogTimerGadget,
    [dashboardModuleKeys.worklogBarChart.gadget]: WorklogBarChartGadget,
    [dashboardModuleKeys.worklogBarChart.widget]: WorklogBarChartGadget,
    [dashboardModuleKeys.teamWorklog.gadget]: TeamWorklogGadget,
    [dashboardModuleKeys.teamWorklog.widget]: TeamWorklogGadget,
    [dashboardModuleKeys.workloadHeatmap.widget]: WorkloadHeatmapWidget,
    [dashboardModuleKeys.timeInStatus.widget]: TimeInStatusWidget,
};

(async function () {
    const context: FullContext = await view.getContext();
    await syncJiraTheme(context);
    const { moduleKey, extension } = context;
    const modalId = extension?.modal?.modalId;

    const root = createRoot(document.getElementById('root')!);

    const render = (element: React.ReactNode) => {
        root.render(
            <StrictMode>
                <Suspense fallback={fallback}>{element}</Suspense>
            </StrictMode>,
        );
    };

    if (modalId === 'ja-dlg-user-groups') {
        render(<UserGroups jiraContext={context} />);
    } else if (modalId === 'ja-dlg-wl-report-config') {
        render(<WLReportConfig jiraContext={context} />);
    } else if (moduleKey === 'jira-assistant-app') {
        await applyPokerDeepLink();
        render(
            <HashRouter>
                <App jiraContext={context} /> {/* It appears like jiraContext is not required here as props. need to validate. */}
            </HashRouter>,
        );
    } else if (dashboardItems[moduleKey]) {
        const DashboardItem = dashboardItems[moduleKey];
        setupDashboardHost(context);
        render(<DashboardItem jiraContext={context} />);
    } else if (moduleKey === 'ja-issue-glance') {
        render(<IssueGlance jiraContext={context} />);
    } else {
        render(
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-800">Unknown module: {moduleKey}</div>
            </div>,
        );
    }
})();
