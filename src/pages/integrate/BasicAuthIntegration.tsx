import { useCallback, useState } from 'react';

import { useParams } from 'react-router-dom';

import { executeService } from '@/common/proxy';
import { isExtnBuild, redirectToRoute } from '@/constants/build-info';
import { ApiTokenHelpPage } from '@/constants/urls';
import Link from '@/controls/Link';
import { Dialog } from '@/dialogs';
import { useService } from '@/services/injector';
import { clearEnd, getOriginFromUrl } from '@/utils/helpers';

import { registerDepnServices } from '@services';

import { Button, Password, TextInput } from '@components';

interface BasicAuthIntegrationProps {
    setAuthType?: (authType: string) => void;
}

function BasicAuthIntegration({ setAuthType }: BasicAuthIntegrationProps) {
    const { store } = useParams<{ store?: string }>();
    const useExtn = store === '1';
    const authType = useExtn ? '1' : '2';

    registerDepnServices(authType);

    const [jiraUrl, setJiraUrl] = useState('');
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const services = useService('MessageService', 'SessionService', 'JiraAuthService', 'AppBrowserService');

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

            if (setAuthType) {
                setAuthType(authType);
            } else if (isExtnBuild) {
                services.$jaBrowserExtn.openTab('/index.html');
                window.close();
            } else {
                redirectToRoute();
            }
        },
        [services, setAuthType, authType],
    );

    const tryIntegrate = useCallback(
        async (root: string) => {
            setJiraUrl(root);
            services.$session.rootUrl = root;
            setIsLoading(true);

            try {
                const id = await services.$jAuth.integrateWithCred(root, userId, password);
                await openDashboard(id);
            } catch (response: any) {
                const res = response || {};
                if (res.status === 401) {
                    services.$message.warning(
                        'You are not authenticated with Jira to integrate. Please verify your credentials.',
                        'Unauthorized',
                    );
                } else {
                    const origin = getOriginFromUrl(root);
                    const cleanOrigin = origin ? clearEnd(origin, '/') : '';
                    if (cleanOrigin && cleanOrigin !== root) {
                        Dialog.yesNo(
                            `"${root}" is not a valid Jira Api base path. Would you like to try with "${cleanOrigin}" instead?`,
                            'Change URL',
                        ).then(() => {
                            tryIntegrate(cleanOrigin);
                        });
                    } else {
                        services.$message.error('This is not a valid Jira server url or the server does not respond.', 'Unknown server');
                    }
                }
            } finally {
                setIsLoading(false);
            }
        },
        [services, userId, password, openDashboard],
    );

    const integrate = useCallback(() => {
        const root = clearEnd(clearEnd(jiraUrl.trim(), '/'), '\\');
        tryIntegrate(root);
    }, [jiraUrl, tryIntegrate]);

    return (
        <>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">Jira Assistant</h1>
            <p className="text-[var(--text-secondary)] mb-6">
                <strong>Integrate</strong> with your Jira account
            </p>

            <div className="space-y-4 mb-4">
                <TextInput
                    value={jiraUrl}
                    onChange={(e) => setJiraUrl(e.value)}
                    placeholder="Jira root url (eg: https://jira.example.com)"
                    leftIcon={<i className="fa fa-external-link text-[var(--text-tertiary)]" />}
                />
                <TextInput
                    value={userId}
                    onChange={(e) => setUserId(e.value)}
                    placeholder="Your Jira login id"
                    leftIcon={<i className="fa fa-user text-[var(--text-tertiary)]" />}
                />
                <Password value={password} onChange={(e) => setPassword(e.value)} placeholder="Password / Rest API Token" />
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-5">
                <strong>Note:</strong> Credentials are stored in browser&apos;s cache storage. Use Jira Rest Api Token instead of password
                for better security. Learn more about{' '}
                <Link href={ApiTokenHelpPage} className="text-blue-600 hover:text-blue-800 underline">
                    Rest Api Tokens
                </Link>
                .
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

export default BasicAuthIntegration;
