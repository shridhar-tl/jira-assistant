import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router';

import { executeService } from '@/common/proxy';
import { isExtnAccessDenied } from '@/common/proxy-helper';
import { ApiUrls } from '@/constants/api-urls';
import { buildMode, isExtnBuild, isQuickView, isWebBuild, redirectToRoute } from '@/constants/build-info';
import { getJiraCloudOAuthAuthorizeUrl } from '@/constants/oauth';
import config from '@/customize';
import BackupImporter from '@/layouts/default-layout/BackupImporter';
import { useService } from '@/services/injector';
import { BROWSER_NAME } from '@/utils/browsers';
import { clearEnd } from '@/utils/helpers';
import { assertJiraUserProfile, type JiraUserProfile } from '@/utils/jira-profile';

import { Button, TextInput } from '@components';

import { getJiraUrlError, reportIntegrationFailure } from './integration-helpers';
import SettingsMenu from './SettingsMenu';

const isFirefox = BROWSER_NAME === 'firefox';
const unauthorizedMessage = 'You are not authenticated with Jira to integrate. Login to Jira in browser and then retry.';
const permissionDeniedMessage = isWebBuild
    ? 'Permission denied to access this Url. Try integrating directly from extension using JA icon or manually grant permission and retry.'
    : 'Permission denied to access this Url. Manually grant permission and then retry. For more details, visit #214 in GitHub issue tracker.';

function getJiraRootUrl(url: string): string {
    return url.replace(/^(.*\/\/[^/?#]*).*$/, '$1');
}

interface CookieIntegrationProps {
    setAuthType?: (authType: string) => void;
}

function CookieIntegration({ setAuthType }: CookieIntegrationProps) {
    const navigate = useNavigate();
    const [jiraUrl, setJiraUrl] = useState(config.settings.defaultIntegrateUrl || '');
    const [isLoading, setIsLoading] = useState(false);

    const services = useService('AjaxService', 'MessageService', 'SessionService', 'SettingsService', 'UserService', 'AppBrowserService');

    useEffect(() => {
        if (isExtnBuild && !jiraUrl) {
            services.$jaBrowserExtn
                .getCurrentUrl()
                .then((url: string) => {
                    const root = getJiraRootUrl(url);
                    if (root && root.length > 20 && root.startsWith('http')) {
                        setJiraUrl(root);
                    }
                })
                .catch(console.error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openDashboard = useCallback(
        async (id: number) => {
            if (id <= 0) {
                return;
            }

            try {
                await executeService('SELF', 'RELOAD', [], services.$message);
            } catch (err) {
                console.error('Unable to reload BG Listeners', err);
            }

            await services.$settings.set('CurrentUserId', id);

            if (setAuthType) {
                setAuthType('1');
            } else if (isExtnBuild) {
                services.$jaBrowserExtn.openTab('/index.html');
                window.close();
            } else {
                redirectToRoute();
            }
        },
        [services, setAuthType],
    );

    const handleDBError = useCallback(() => {
        services.$message.error('Unable to save the changes. Verify if you have sufficient free space in your drive', 'Allocation failed');
        return -1;
    }, [services]);

    const integrateWith = useCallback(
        async (root: string, retryWith: (root: string) => void) => {
            const hasPermission = await services.$jaBrowserExtn.requestPermission(null, root);
            services.$session.userId = undefined;

            let profile: JiraUserProfile;
            try {
                const response: unknown = await services.$ajax.request('GET', ApiUrls.mySelf, undefined, undefined, true);
                assertJiraUserProfile(response);
                profile = response;
            } catch (err) {
                reportIntegrationFailure(err, {
                    root,
                    $message: services.$message,
                    retryWith,
                    unauthorizedMessage,
                    permissionDeniedMessage: hasPermission ? undefined : permissionDeniedMessage,
                });
                return;
            }

            try {
                const userId = await services.$user.createUser(profile, root);
                await openDashboard(userId);
            } catch (err) {
                if (isExtnAccessDenied(err)) {
                    throw err;
                }
                console.error('JA: Unable to save the integration:', err);
                handleDBError();
            }
        },
        [services, openDashboard, handleDBError],
    );

    const tryIntegrate = useCallback(
        async (root: string) => {
            setJiraUrl(root);
            services.$session.rootUrl = root;
            setIsLoading(true);

            try {
                await integrateWith(root, tryIntegrate);
            } catch (err) {
                if (isExtnAccessDenied(err)) {
                    services.$message.error(err.message, 'Extension access denied');
                } else {
                    console.error('JA: Integration failed:', err);
                    services.$message.error('Unable to integrate with Jira. Check browser console for more details.', 'Integration failed');
                }
            } finally {
                setIsLoading(false);
            }
        },
        [services, integrateWith],
    );

    const integrate = useCallback(() => {
        const root = clearEnd(clearEnd(jiraUrl.trim(), '/'), '\\');
        const urlError = getJiraUrlError(root);
        if (urlError) {
            services.$message.warning(urlError, 'Invalid url');
            return;
        }
        tryIntegrate(root);
    }, [jiraUrl, tryIntegrate, services]);

    const useOAuth = useCallback(() => {
        const url = getJiraCloudOAuthAuthorizeUrl({
            initSource: buildMode,
            authType: '1',
        });

        if (isWebBuild || !isQuickView) {
            document.location.href = url;
        } else {
            services.$jaBrowserExtn.openTab(url, 'JAOAuth2Win');
            window.close();
        }
    }, [services]);

    const handleMenuClick = useCallback(
        (index: number, importSettings: () => void) => {
            switch (index) {
                case 0: // Import Settings
                    importSettings();
                    break;
                case 1: // Options
                    services.$jaBrowserExtn.openTab(isWebBuild ? '/options' : '/index.html#/options');
                    break;
                case 3: // Use Jira OAuth
                    useOAuth();
                    break;
                case 4: // Use Basic Auth
                    navigate('/integrate/basic');
                    break;
            }
        },
        [services, useOAuth, navigate],
    );

    const onSettingsImport = useCallback(() => {
        if (isWebBuild && setAuthType) {
            setAuthType('1');
        } else if (isQuickView) {
            services.$jaBrowserExtn.openTab('/index.html');
            window.close();
        } else {
            redirectToRoute();
        }
    }, [services, setAuthType]);

    const showSettingsMenu = !isFirefox || !isQuickView;
    const showOpenInNewTab = isFirefox && isQuickView;

    return (
        <>
            <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Jira Assistant</h1>
                <div className="flex items-center gap-2">
                    {showOpenInNewTab && (
                        <button
                            className="text-blue-600 hover:text-blue-800 text-lg cursor-pointer p-1 transition-colors"
                            onClick={() => services.$jaBrowserExtn.openTab('/index.html')}
                            title="Click to open in new tab and see more integration options"
                        >
                            <i className="fa fa-external-link" />
                        </button>
                    )}
                    {showSettingsMenu && (
                        <BackupImporter cleanImport onImport={onSettingsImport}>
                            {(importSettings) => <SettingsMenu onItemClick={(index) => handleMenuClick(index, importSettings)} />}
                        </BackupImporter>
                    )}
                </div>
            </div>
            <p className="text-(--text-secondary) mb-4 sm:mb-6">
                <strong>Integrate</strong> with your Jira account
            </p>

            <div className="mb-4">
                <TextInput
                    value={jiraUrl}
                    onChange={(e) => setJiraUrl(e.value)}
                    placeholder="Jira root url (eg: https://jira.example.com)"
                    leftIcon={<i className="fa fa-external-link text-[var(--text-tertiary)]" />}
                />
            </div>

            <p className="text-sm text-(--text-secondary) mb-4 sm:mb-5">
                Login to your Jira in current tab or provide the Url of your Jira server to integrate. Ensure you have already been
                authenticated in Jira before you click on Integrate button.
            </p>

            <Button
                variant="primary"
                leftIcon={<i className="fa fa-unlock-alt" />}
                isLoading={isLoading}
                disabled={!jiraUrl.trim() || isLoading}
                onClick={integrate}
                className="w-full"
            >
                Integrate
            </Button>
        </>
    );
}

export default CookieIntegration;
