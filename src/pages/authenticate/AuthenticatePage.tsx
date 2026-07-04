import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { validateIfWebApp } from '@/common/proxy';
import { buildMode, isAppBuild, isWebBuild } from '@/constants/build-info';
import { getJiraCloudOAuthAuthorizeUrl } from '@/constants/oauth';
import { StoreUrls, WebSiteUrl } from '@/constants/urls';
import { Dialog } from '@/dialogs';
import { BROWSER_NAME } from '@/utils/browsers';

import AuthFooter from './AuthFooter';
import AuthTypeCard from './AuthTypeCard';
import ExtensionMessage from './ExtensionMessage';
import type { AuthenticatePageProps, ExtensionState } from './types';

const storeUrl = StoreUrls[BROWSER_NAME as keyof typeof StoreUrls] || WebSiteUrl;

const oauthConfirmMessage = (
    <span>
        You will be redirected to Jira Cloud where you can Authorize Jira Assistant to access Jira API&apos;s.
        <br />
        <br />
        This is a one time activity and the authorization code would be stored in your browser cache which would be used in future for
        accessing Jira.
    </span>
);

export default function AuthenticatePage({
    isExtnValid: propExtnValid,
    extnUnavailable: propExtnUnavailable,
    needIntegration: propNeedIntegration,
    onAuthTypeChosen,
}: AuthenticatePageProps) {
    const navigate = useNavigate();
    const hasRendererProps = propExtnValid !== undefined || propExtnUnavailable !== undefined;

    const [extnState, setExtnState] = useState<ExtensionState>({
        extnUnavailable: propExtnUnavailable ?? true,
        isExtnValid: propExtnValid ?? false,
        needIntegration: propNeedIntegration ?? false,
        loading: !hasRendererProps,
    });

    useEffect(() => {
        if (hasRendererProps || !isWebBuild) {
            setExtnState((prev) => ({ ...prev, loading: false }));
            return;
        }

        const state = {
            extnUnavailable: true,
            isExtnValid: false,
            needIntegration: false,
        };

        validateIfWebApp(state)
            .then((result) => {
                if (result && typeof result === 'object') {
                    setExtnState({
                        extnUnavailable: result.extnUnavailable ?? true,
                        isExtnValid: result.isExtnValid ?? false,
                        needIntegration: result.needIntegration ?? false,
                        loading: false,
                    });

                    if (result.authReady) {
                        if (onAuthTypeChosen) {
                            onAuthTypeChosen('1');
                        } else {
                            navigate('/integrate');
                        }
                    }
                } else {
                    setExtnState((prev) => ({ ...prev, loading: false }));
                }
            })
            .catch(() => {
                setExtnState((prev) => ({ ...prev, loading: false }));
            });
    }, [navigate, hasRendererProps, onAuthTypeChosen]);

    const navigateToStore = useCallback(() => {
        window.open(storeUrl);
    }, []);

    const extnSelected = useCallback(() => {
        if (extnState.needIntegration) {
            navigate('/integrate/extn');
        } else if (onAuthTypeChosen) {
            onAuthTypeChosen('1');
        } else {
            navigate('/integrate');
        }
    }, [extnState.needIntegration, navigate, onAuthTypeChosen]);

    const basicAuthSelected = useCallback(() => {
        navigate('/integrate/basic');
    }, [navigate]);

    const oAuthSelected = useCallback(() => {
        Dialog.yesNo(oauthConfirmMessage, 'Jira Cloud - OAuth2 Integration').then(() => {
            document.location.href = getJiraCloudOAuthAuthorizeUrl({
                initSource: buildMode,
                authType: '2',
            });
        });
    }, []);

    const allowExtn = !extnState.extnUnavailable && extnState.isExtnValid;

    const extensionBadge = extnState.extnUnavailable ? (
        <button
            className="bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:bg-emerald-600 transition-colors shadow-sm"
            onClick={(e) => {
                e.stopPropagation();
                navigateToStore();
            }}
            title="Click to visit webstore and install the extension"
        >
            Install
        </button>
    ) : !extnState.isExtnValid ? (
        <button
            className="bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:bg-amber-600 transition-colors shadow-sm"
            onClick={(e) => {
                e.stopPropagation();
                navigateToStore();
            }}
            title="Click to visit webstore and update the extension"
        >
            Update
        </button>
    ) : null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-[520px]">
                <div className="bg-[var(--bg-primary)]/95 backdrop-blur-sm rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden border border-[var(--border-primary)]">
                    <div className="p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <i className="fa fa-bolt text-white text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">Jira Assistant</h1>
                                <p className="text-sm text-[var(--text-secondary)]">Choose your integration method</p>
                            </div>
                        </div>

                        <div className="space-y-0">
                            {!isAppBuild && !extnState.loading && (
                                <AuthTypeCard
                                    title="Browser Extension"
                                    icon={<i className="fa fa-puzzle-piece text-lg" />}
                                    onClick={extnSelected}
                                    disabled={!allowExtn}
                                    testId="extn-auth"
                                    badge={extensionBadge}
                                    accentColor="green"
                                >
                                    <ExtensionMessage
                                        extnUnavailable={extnState.extnUnavailable}
                                        isExtnValid={extnState.isExtnValid}
                                        needIntegration={extnState.needIntegration}
                                    />
                                </AuthTypeCard>
                            )}

                            <AuthTypeCard
                                title="OAuth2 Integration"
                                description="Securely authorize Jira Assistant to access your Jira Cloud instance without storing credentials. Recommended for Jira Cloud users."
                                icon={<i className="fa fa-shield text-lg" />}
                                onClick={oAuthSelected}
                                testId="o-auth"
                                accentColor="blue"
                            />

                            <AuthTypeCard
                                title="User ID &amp; Password"
                                description="Authenticate using your Jira credentials or API token. Works with both Jira Cloud and self-hosted instances."
                                icon={<i className="fa fa-key text-lg" />}
                                onClick={basicAuthSelected}
                                testId="basic-auth"
                                accentColor="purple"
                            />
                        </div>
                    </div>
                    <AuthFooter />
                </div>
            </div>
        </div>
    );
}
