import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import { view } from '@forge/bridge';
import './common/extensions';
import './common/linq';
import './scss/style.scss';
import './scss/plugin.scss';
import '@atlaskit/css-reset';

(async function () {
    const context = await view.getContext();
    const { moduleKey } = context;

    const root = ReactDOM.createRoot(document.getElementById('root'));
    if (moduleKey === 'jira-assistant-app') {
        const App = React.lazy(() => import('./App'));
        root.render(<Router><App jiraContext={context} /></Router>);
    }

    else if (moduleKey === 'ja-date-wise-worklog') {
        const DayWiseWorklogGadget = React.lazy(() => import('./jcloud/gadgets/date-wise-worklog'));
        root.render(<DayWiseWorklogGadget jiraContext={context} />);
    }

    else if (moduleKey === 'ja-worklog-timer') {
        const WorklogTimerGadget = React.lazy(() => import('./jcloud/gadgets/worklog-timer'));
        root.render(<WorklogTimerGadget jiraContext={context} />);
    }

    else {
        root.render(<div>Unknown module: {moduleKey}</div>);
    }
})();