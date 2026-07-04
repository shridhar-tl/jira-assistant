import type { ComponentType } from 'react';
import { memo, useCallback, useEffect, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { getExtnLaunchUrl, validateIfWebApp } from '@/common/proxy';
import { redirectToRoute } from '@/constants';

import registerServices from '@services/index-register';
import { inject, registerDepnServices } from '@services/index.web';

import { BlockLoading } from '@components';

import { getCurrentQueryParams } from '@utils';

interface InitValue {
    authType?: string;
    extnUnavailable?: boolean;
    isExtnValid?: boolean;
    extnVersion?: number;
    needIntegration?: boolean;
    authReady?: boolean;
}

interface WebInitProps {
    initValue?: InitValue;
    authTypeChosen?: (authType: string) => void;
}

export function withInitParams<P extends WebInitProps>(Component: ComponentType<P>): ComponentType<Omit<P, keyof WebInitProps>> {
    registerServices();

    return memo(function (props: Omit<P, keyof WebInitProps>) {
        const location = useLocation();
        const navigate = useNavigate();
        const [initValue, setInitValue] = useState<InitValue | false>(false);

        const authTypeChosen = useCallback(
            (authType: string) => {
                localStorage.setItem('authType', authType);
                registerDepnServices(authType);
                if (initValue) {
                    setInitValue({ ...initValue, authType });
                }
                navigate('/');
            },
            [navigate, initValue],
        );

        useEffect(() => {
            initializeApp(location, navigate).then(setInitValue);
        }, []);

        if (initValue) {
            return <Component {...(props as P)} key={initValue.authType || '1'} initValue={initValue} authTypeChosen={authTypeChosen} />;
        } else {
            return <BlockLoading text="Loading... Please wait..." />;
        }
    }) as ComponentType<Omit<P, keyof WebInitProps>>;
}

async function initializeApp(location: ReturnType<typeof useLocation>, navigate: ReturnType<typeof useNavigate>): Promise<InitValue> {
    const { oauth, code, state } = parseQueryParams();

    if (oauth === 'jc') {
        await processJiraCloudOAuth(code, state);
    } else if (oauth === 'ol') {
        await processOutlookOAuth(code, state);
        return {};
    } else {
        const authType = localStorage.getItem('authType');
        registerDepnServices(authType || '1');
    }

    const result = await validateIfExtnReadyForUse(location.pathname, navigate);

    if (result.extnUnavailable || !result.isExtnValid) {
        if (location.pathname.includes('/poker')) {
            registerDepnServices('2');
        }
    }

    return result;
}

async function processJiraCloudOAuth(code: string, state: any): Promise<void> {
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
    }

    switch (initSource.toUpperCase()) {
        case 'WEB':
            localStorage.setItem('authType', authType);
            redirectToRoute(`/${userId}/dashboard/0`);
            break;

        default:
            const url = await getExtnLaunchUrl(userId, {});
            if (url) {
                window.location.href = url;
            } else {
                window.close();
            }
            break;
    }
}

async function processOutlookOAuth(code: string, state: any): Promise<void> {
    registerDepnServices(state.authType || '1');

    const { $msoAuth } = inject('OutlookOAuthService');
    const token = await $msoAuth.getAndSaveToken(code, undefined, state.userId);

    if (window.opener) {
        window.opener.postMessage({ type: 'mso_auth', result: !!token }, '*');
    } else {
        console.error('Unable to pass back success response. Close this window and refresh Jira Assistant to load settings.');
    }

    window.close();
}

const extnAuth = document.location.href.indexOf('?authType=1') > 0;

async function validateIfExtnReadyForUse(pathname: string, navigate: ReturnType<typeof useNavigate>): Promise<InitValue> {
    let authType = localStorage.getItem('authType');
    const newState: InitValue = { authType: authType || undefined };

    if (((authType || '1') === '1' || pathname.startsWith('/integrate')) && (await validateIfWebApp(newState))) {
        if (extnAuth && !authType && newState.authReady) {
            localStorage.setItem('authType', '1');
            newState.authType = '1';
            authType = '1';
        }
    }

    if (!authType || (authType === '1' && !newState.authReady)) {
        if (!pathname?.startsWith('/poker')) {
            navigate('/integrate');
        }
    }

    return newState;
}

interface QueryParams {
    oauth?: string;
    code: string;
    state: any;
}

function parseQueryParams(): QueryParams {
    const params = getCurrentQueryParams() as any;

    if (typeof params.state === 'string') {
        try {
            params.state = JSON.parse(atob(params.state));
        } catch {}
    }

    return params;
}
