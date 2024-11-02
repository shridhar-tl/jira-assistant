import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getExtnLaunchUrl, validateIfWebApp } from "../../common/proxy";
import { getCurrentQueryParams } from "../../common/utils";
import { redirectToRoute } from "../../constants/build-info";
import registerServices, { inject, registerDepnServices } from '../../services';
import getLoader from '../../components/loader';

// Takes care of initializing the web app with oAuth related preprocessing and proxy info
const withInitParams = function (Component) {
    registerServices();

    return React.memo(function () {
        const location = useLocation();
        const navigate = useNavigate();
        const [initValue, setInitValue] = useState(false);

        const authTypeChosen = useCallback((authType) => {
            localStorage.setItem('authType', authType);
            registerDepnServices(authType);
            if (initValue) {
                setInitValue({ ...initValue, authType });
            }
            navigate('/');
        }, [navigate, initValue]);

        useEffect(() => {
            initializeApp(location, navigate).then(setInitValue);
        }, []);// eslint-disable-line react-hooks/exhaustive-deps

        if (initValue) {
            return (<Component key={initValue.authType || '1'} initValue={initValue} authTypeChosen={authTypeChosen} />);
        } else {
            return getLoader('Loading... Please wait...');
        }
    });
};

export default withInitParams;

async function initializeApp(location, navigate) {
    const { oauth, code, state } = parseQueryParams();

    if (oauth === 'jc') {
        await processJiraCloudOAuth(code, state);
    } else if (oauth === 'ol') {
        await processOutlookOAuth(code, state);
        return;
    } else {
        const authType = localStorage.getItem('authType');
        registerDepnServices(authType || '1');
    }

    const result = await validateIfExtnReadyForUse(location.pathname, navigate);

    // If extension is not available while loading poker, do not use proxy services
    if (result.extnUnavailable || !result.isExtnValid) {
        if (location.pathname.includes('/poker')) {
            registerDepnServices('2');
        }
    }

    return result;
}

// Internal functions

// #region Jira Cloud oAuth

async function processJiraCloudOAuth(code, state) {
    if (!state) {
        throw new Error('Invalid integration request. Code: Missing State');
    }

    const { initSource, authType } = state;
    if (!initSource || !authType) {
        throw new Error('Invalid integration request. Code: Missing Attr');
    }

    registerDepnServices(authType || '1');

    const { $jAuth } = inject('JiraAuthService');
    const { success, message, userId } = await $jAuth.integrate(code);

    if (!success) {
        throw Error(message);
        /*const newState = {};
        await validateIfWebApp(newState); // This function would not have got called as its a oauth request.
        this.setState(newState);
        this.$message.error(message, 'Jira Cloud Integration Failed');*/
    }

    switch (initSource.toUpperCase()) {
        case 'WEB': // If request initiated from web, then redirect
            localStorage.setItem('authType', authType);
            redirectToRoute(`/${userId}/dashboard/0`);

            break;

        default: // Launch the extension page
            const url = await getExtnLaunchUrl(userId, {});
            if (url) {
                window.location.href = url;
            } else {
                window.close();
            }

            break;
    }
}
// #endregion

// #region Outlook oAuth

async function processOutlookOAuth(code, state) {
    registerDepnServices(state.authType || '1'); // Register services

    const { $msoAuth } = inject('OutlookOAuthService');

    const token = await $msoAuth.getAndSaveToken(code, undefined, state.userId);

    if (window.opener) {
        window.opener.postMessage({ type: 'mso_auth', result: !!token }, "*");
    } else {
        console.error('Unable to pass back success response. Close this window and refresh Jira Assistant to load settings.');
    }

    window.close();
}

// #endregion

// #region Verify extension availability

const extnAuth = document.location.href.indexOf('?authType=1') > 0;

async function validateIfExtnReadyForUse(pathname, navigate) {
    let authType = localStorage.getItem('authType');

    const newState = { authType };
    //const pathname = this.props.location?.pathname;
    if (((authType || '1') === '1' || pathname.startsWith('/integrate')) && await validateIfWebApp(newState)) {
        if (extnAuth && !authType && newState.authReady) {
            localStorage.setItem('authType', 1);
            newState.authType = '1';
            authType = '1';
        }
    }

    if (!authType || (authType === '1' && !newState.authReady)) {
        if (!pathname?.startsWith('/poker')) {
            navigate(`/integrate`);
        }
    }

    return newState;
}

// #endregion


// Helper functions
function parseQueryParams() {
    const params = getCurrentQueryParams();

    if (typeof params.state === 'string') {
        try {
            params.state = JSON.parse(atob(params.state));
        } catch { /* No need to handle */ }
    }

    return params;
}