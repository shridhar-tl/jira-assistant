import type { ComponentType } from 'react';
import { memo, useCallback, useEffect, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { isWebBuild } from '@/constants/build-info';
import { clearInstances } from '@/services/injector';

import { inject } from '@services';

import { BlockLoading } from '@components/Loading';

import { UnauthorizedPage } from '../../pages/p401';

const bgAuthRoutes = ['poker'];
const nonAuthPages = ['integrate', 'options'];

interface AuthInfo {
    authenticated: boolean;
    jiraUrl?: string;
    userId?: number | null;
    needIntegration?: boolean;
}

interface WithAuthInfoProps {
    switchUser?: (url: string) => void;
    authInfo?: AuthInfo | false;
}

export function withAuthInfo<P extends WithAuthInfoProps>(Component: ComponentType<P>) {
    const AuthComponent = memo(function (props: Omit<P, keyof WithAuthInfoProps>) {
        const [authInfo, setAuthInfo] = useState<AuthInfo | false>(false);
        const location = useLocation();
        const navigate = useNavigate();

        const rawPathname = location.pathname;
        let pathname = rawPathname;
        if (!pathname || pathname === '/') {
            pathname = '/dashboard/0';
        }

        const switchUser = useCallback(
            (url: string) => {
                clearInstances();
                setAuthInfo(false);
                navigate(url);
            },
            [navigate],
        );

        const userId = getUserIdFromPathOrSession(pathname);
        const bgAuth = needsBackgroundAuth(pathname);
        const shouldAuth = !bgAuth && webAuthTypeReady() && (!!userId || needsAuth(pathname));

        const tryAuthorize = useCallback(() => {
            if (shouldAuth || bgAuth) {
                authenticateUser(userId, authInfo, pathname, !bgAuth && navigate).then((result) => {
                    if (result !== undefined) {
                        setAuthInfo(result);
                        console.log('JA: Auth result:', result);

                        if (!bgAuth && result.needIntegration && !pathname.startsWith('/integrate')) {
                            navigate('/integrate');
                        }
                    }
                });
            }
        }, [userId, shouldAuth, bgAuth, authInfo, pathname, navigate]);

        useEffect(tryAuthorize, [userId, shouldAuth]);

        useEffect(() => {
            if ((!rawPathname || rawPathname === '/') && authInfo && authInfo.authenticated && authInfo.userId) {
                navigate(`/${authInfo.userId}/dashboard/0`, { replace: true });
            }
        }, [rawPathname, authInfo, navigate]);

        if (shouldAuth) {
            if (!authInfo) {
                return <BlockLoading text="Authorizing... Please wait..." />;
            } else if (!authInfo.authenticated && !authInfo.needIntegration) {
                return (
                    <UnauthorizedPage
                        jiraUrl={authInfo.jiraUrl}
                        validate={() => {
                            setAuthInfo(false);
                            tryAuthorize();
                        }}
                    />
                );
            }
        }

        return <Component {...(props as P)} switchUser={switchUser} authInfo={authInfo} />;
    });

    return AuthComponent;
}

async function authenticateUser(
    userIdFromPath: number | null,
    authInfo: AuthInfo | false,
    pathname: string,
    navigate: ReturnType<typeof useNavigate> | false,
): Promise<AuthInfo | undefined> {
    const { $auth, $session, $settings } = inject('AuthService', 'SessionService', 'SettingsService');

    console.log('JA: Validating user auth settings...');

    if (userIdFromPath && userIdFromPath === $session.userId && $session.authenticated) {
        if (authInfo && 'userId' in authInfo && authInfo.userId !== $session.userId) {
            return {
                authenticated: $session.authenticated,
                jiraUrl: $session.rootUrl,
                userId: $session.userId,
            };
        }
        return;
    }

    try {
        console.log('JA: Authenticating user');
        const authenticated = await $auth.authenticate(userIdFromPath ?? undefined);
        const jiraUrl = $session.rootUrl;

        if (authenticated) {
            console.log('JA: User is authenticated');
            const userId = $session.userId || null;

            if (navigate) {
                if (!userIdFromPath && userId) {
                    navigate(`/${userId}${pathname}`);
                } else if (userIdFromPath && userId) {
                    await $settings.set('CurrentUserId', userId);
                }
            }

            console.log('JA: Authenticated jira url:', jiraUrl, userId);
            return { authenticated, jiraUrl, userId };
        }
        return { authenticated, jiraUrl, needIntegration: $session.needIntegration };
    } catch (err) {
        console.error('JA: Authentication failed with following error:', err);
        const { needIntegration, rootUrl: jiraUrl } = $session;
        return { authenticated: false, needIntegration, jiraUrl };
    }
}

function getUserIdFromPathOrSession(pathname: string): number | null {
    const parts = pathname.split('/');
    let userId = parseInt(parts[1]);

    if (!userId || isNaN(userId)) {
        const { $session } = inject('SessionService');
        if ($session.authenticated) {
            userId = $session.userId as number;
        } else {
            return null;
        }
    }

    return userId;
}

function webAuthTypeReady(): boolean {
    if (!isWebBuild) {
        return true;
    }
    return !!localStorage.getItem('authType');
}

function needsAuth(pathname: string): boolean {
    return !isInList(pathname, nonAuthPages);
}

function needsBackgroundAuth(pathname: string): boolean {
    return isInList(pathname, bgAuthRoutes);
}

function isInList(pathname: string, list: string[]): boolean {
    const parts = pathname.split('/').filter(Boolean);
    return list.includes(parts[0].toLowerCase());
}
