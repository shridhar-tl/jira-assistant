import type { ComponentType } from 'react';
import { memo, useEffect, useState } from 'react';

import { inject, registerDepnServices } from '@services/index.plugin';

import { BlockLoading } from '@components';

import { ApiUrls } from '@constants';

import { clearEnd } from '@/utils/helpers';

interface PluginInitProps {
    jiraContext?: {
        siteUrl?: string;
        [key: string]: any;
    };
}

export function withInitParams<P extends PluginInitProps>(Component: ComponentType<P>): ComponentType<P> {
    registerDepnServices();

    return memo(function (props: P) {
        const [initValue, setInitValue] = useState<true | string | false>(false);

        useEffect(() => {
            initializeApp(props.jiraContext).then(setInitValue);
        }, []);

        if (initValue === true) {
            return <Component {...props} />;
        } else if (typeof initValue === 'string') {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50">
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
                        <div className="text-2xl font-bold text-red-600 mb-4">Setup Failed</div>
                        <div className="text-gray-700">
                            <div className="font-semibold mb-2">Error Details:</div>
                            <div className="bg-red-50 p-4 rounded border border-red-200 mb-4">{initValue}</div>
                            <div className="text-sm text-gray-600">Look at console log for more details.</div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return <BlockLoading text="Setting up... Please wait..." />;
        }
    }) as ComponentType<P>;
}

async function initializeApp(jiraContext?: { siteUrl?: string }): Promise<true | string> {
    try {
        const { $user } = inject('UserService');
        const users = await $user.getUsersList();
        console.log('Count of user found in cache:', users.length);

        if (!users.length) {
            const { $request } = inject('AjaxRequestService');

            let jiraUrl = jiraContext?.siteUrl;
            if (!jiraUrl) {
                jiraUrl = await getInstanceUrl();
            }

            const profile = await $request.execute('GET', ApiUrls.mySelf.replace('~', jiraUrl));
            console.log('User profile pulled from Jira');
            await $user.createUser(profile, jiraUrl);
            console.log('User created in browser cache');
        }

        return true;
    } catch (err) {
        console.error('Error setting up Jira Assistant:', err);
        return String(err);
    }
}

const dummyInstUrl = 'https://api.atlassian.net';

async function getInstanceUrl(): Promise<string> {
    try {
        console.log('About to fetch Server Info');
        const { requestJira } = await import('@forge/bridge');
        const response = await requestJira('/rest/api/3/serverInfo');
        const result = await response.json();
        console.log('Received server info', result);
        const baseUrl = result.baseUrl as string | undefined;
        return (baseUrl && clearEnd(baseUrl, '/')) || dummyInstUrl;
    } catch {
        console.error('Fetching server info failed. Falling back to: ', dummyInstUrl);
        return dummyInstUrl;
    }
}
