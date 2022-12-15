import React, { useEffect, useState } from 'react';
import { inject } from '../../services/injector-service';
import getLoader from '../../components/loader';
import Page401 from '../../views/pages/p401/Page401';
import { withRouter } from '../../pollyfills';

const nonAuthPages = ['integrate', 'options', 'poker'];

const withAuthInfo = function (Component) {
    const AuthComponent = function (props) {
        const [authInfo, setAuthInfo] = useState(false);

        let { pathname } = props.location;

        if (!pathname || pathname === '/') {
            pathname = '/dashboard/0';
        }

        const userId = getUserIdFromPathOrSession(pathname);
        const shouldAuth = !!userId || needsAuth(pathname);

        const tryAuthorize = () => {
            if (shouldAuth) {
                authenticateUser(userId, authInfo, pathname, props.navigate).then((result) => {
                    if (result !== undefined) {
                        setAuthInfo(result);
                    }
                });
            }
        };

        useEffect(tryAuthorize, [userId, shouldAuth]); // eslint-disable-line react-hooks/exhaustive-deps

        if (shouldAuth) {
            if (!authInfo) {
                return getLoader('Authorizing... Please wait...');
            } else if (!authInfo.authenticated) {
                return (<Page401 jiraUrl={authInfo.jiraUrl} validate={() => { setAuthInfo(false); tryAuthorize(); }} />);
            }
        }

        return (<Component {...props} authInfo={authInfo} />);
    };

    return React.memo(withRouter(AuthComponent));
};

export default withAuthInfo;

async function authenticateUser(userIdFromPath, authInfo, pathname, navigate) {
    const { $auth, $session, $settings } = inject('AuthService', 'SessionService', 'SettingsService');

    if (userIdFromPath && userIdFromPath === $session.userId && $session.authenticated) {
        if (authInfo?.userId !== $session.userId) {
            return {
                authenticated: $session.authenticated,
                jiraUrl: $session.rootUrl,
                userId: $session.userId
            };
        }

        return; // Avoid updating state and rerendering if already session is updated
    }

    try {
        const authenticated = await $auth.authenticate(userIdFromPath);
        const userId = $session.userId || null;
        const jiraUrl = $session.rootUrl;

        if (!userIdFromPath && userId) {
            navigate(userId + pathname);
        } else if (userIdFromPath) { // If userid comes from url, then update the user id in db
            // ToDo: Ensuring if value from db is different would be more appropriate
            await $settings.set("CurrentJiraUrl", jiraUrl);
            await $settings.set("CurrentUserId", userId);
        }

        return { authenticated, jiraUrl, userId };
    } catch {
        const { needIntegration, rootUrl: jiraUrl } = $session;

        if (needIntegration) {
            navigate('/integrate');
        }

        return { needIntegration, jiraUrl };
    }
}


// Utils function
function getUserIdFromPathOrSession(pathname) {
    const parts = pathname.split("/");

    let userId = parseInt(parts[1]);
    if (!userId || isNaN(userId)) {
        const { $session } = inject('SessionService');
        if ($session.authenticated) {
            userId = $session.userId;
        } else {
            userId = null;
        }
    }

    return userId;
}

function needsAuth(pathname) {
    const parts = pathname.split("/").filter(Boolean);
    return !nonAuthPages.includes(parts[0].toLowerCase());
}