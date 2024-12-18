import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import { view } from '@forge/bridge';
import './common/extensions';
import './common/linq';
import './scss/style.scss';
import './scss/plugin.scss';

(async function () {
    const context = await view.getContext();
    const { moduleKey, extension: { modal: { modalId } = {} } = {} } = context;

    const root = ReactDOM.createRoot(document.getElementById('root'));

    //#region Modal Dialogs
    if (modalId === 'ja-dlg-user-groups') {
        const UserGroups = React.lazy(() => import('./jcloud/modals/UserGroup'));
        root.render(<UserGroups jiraContext={context} />);
    }

    else if (modalId === 'ja-dlg-wl-report-config') {
        const WLReportConfig = React.lazy(() => import('./jcloud/gadgets/team-worklog/ConfigModal'));
        root.render(<WLReportConfig jiraContext={context} />);
    }
    //#endregion

    else if (moduleKey === 'jira-assistant-app') {
        const App = React.lazy(() => import('./App'));
        root.render(<Router><App jiraContext={context} /></Router>);
    }

    //#region Gadgets
    else if (moduleKey === 'ja-date-wise-worklog') {
        const DayWiseWorklogGadget = React.lazy(() => import('./jcloud/gadgets/date-wise-worklog'));
        root.render(<DayWiseWorklogGadget jiraContext={context} />);
    }

    else if (moduleKey === 'ja-worklog-barchart') {
        const WorklogBarChartGadget = React.lazy(() => import('./jcloud/gadgets/worklog-bar-chart'));
        root.render(<WorklogBarChartGadget jiraContext={context} />);
    }

    else if (moduleKey === 'ja-worklog-timer') {
        const WorklogTimerGadget = React.lazy(() => import('./jcloud/gadgets/worklog-timer'));
        root.render(<WorklogTimerGadget jiraContext={context} />);
    }

    else if (moduleKey === 'ja-team-worklog') {
        const TeamWorklogGadget = React.lazy(() => import('./jcloud/gadgets/team-worklog'));
        root.render(<TeamWorklogGadget jiraContext={context} />);
    }
    //#endregion

    else if (moduleKey === 'ja-issue-glance') {
        const IssueGlance = React.lazy(() => import('./jcloud/issue-glance'));
        root.render(<IssueGlance jiraContext={context} />);
    }

    else {
        root.render(<div>Unknown module: {moduleKey}</div>);
    }
})();