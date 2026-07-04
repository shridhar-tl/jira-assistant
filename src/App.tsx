import 'moment-timezone/builds/moment-timezone-with-data.min.js';

import { ContextMenuManager, TooltipManager } from 'fluxo-ui';

import { isPluginBuild } from '@/constants/build-info';

import { inject } from '@services';

import { ErrorBoundary } from '@components';

import { withAuthInfo } from './layouts/authorization';
import { withInitParams } from './layouts/initialization';
import MessageBox from './layouts/MessageBox';
import RootContext from './layouts/renderer';
import UrlWatcher from './layouts/UrlWatcher';

interface AppProps {
    initValue?: any;
    authInfo?: any;
    authTypeChosen?: (authType: string) => void;
    switchUser?: (url: string) => void;
    jiraContext?: any; // This is applicable only for plugins. Added it here to solve build issue
}

function App({ authTypeChosen, switchUser, authInfo, initValue }: AppProps) {
    const { $analytics, $session, $message } = inject('AnalyticsService', 'SessionService', 'MessageService');

    const onRouteChanged = (pathname: string) => $analytics.trackPageView(pathname);

    return (
        <ErrorBoundary>
            <MessageBox $message={$message} />
            {!isPluginBuild && <UrlWatcher onChange={onRouteChanged} />}
            <ContextMenuManager />
            <TooltipManager />
            <RootContext
                initValue={initValue}
                authInfo={authInfo}
                authTypeChosen={authTypeChosen}
                switchUser={switchUser}
                $session={$session}
            />
        </ErrorBoundary>
    );
}

export default withInitParams(withAuthInfo(App));
