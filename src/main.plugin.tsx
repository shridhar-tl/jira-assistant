import { lazy, StrictMode, Suspense } from 'react';

import { createRoot } from 'react-dom/client';

import { HashRouter } from 'react-router-dom';

import { FullContext, view } from '@forge/bridge';

import { BlockLoading } from '@components';
import './index.css';

const App = lazy(() => import('./App'));

const UserGroups = lazy(() => import('./jcloud/modals/UserGroup'));
const WLReportConfig = lazy(() => import('./jcloud/gadgets/team-worklog/ConfigModal'));
const DayWiseWorklogGadget = lazy(() => import('./jcloud/gadgets/date-wise-worklog'));
const WorklogBarChartGadget = lazy(() => import('./jcloud/gadgets/worklog-bar-chart'));
const WorklogTimerGadget = lazy(() => import('./jcloud/gadgets/worklog-timer'));
const TeamWorklogGadget = lazy(() => import('./jcloud/gadgets/team-worklog'));
const IssueGlance = lazy(() => import('./jcloud/issue-glance'));

const fallback = <BlockLoading text="Loading... Please wait..." />;

(async function () {
    const context: FullContext = await view.getContext();
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
        render(
            <HashRouter>
                <App jiraContext={context} /> {/* It appears like jiraContext is not required here as props. need to validate. */}
            </HashRouter>,
        );
    } else if (moduleKey === 'ja-date-wise-worklog') {
        render(<DayWiseWorklogGadget jiraContext={context} />);
    } else if (moduleKey === 'ja-worklog-barchart') {
        render(<WorklogBarChartGadget jiraContext={context} />);
    } else if (moduleKey === 'ja-worklog-timer') {
        render(<WorklogTimerGadget />); // It appears like jiraContext is not required here as props. need to validate.
    } else if (moduleKey === 'ja-team-worklog') {
        render(<TeamWorklogGadget jiraContext={context} />);
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
