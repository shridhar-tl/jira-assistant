import { isAppBuild, isPluginBuild, isWebBuild } from '../constants/build-info';
import browserInfo, { BROWSER_NAME } from '../utils/browsers';

import { processResponse } from './proxy-helper';
import { convertToStorableValue } from './storage-helpers';

declare const chrome: any;
declare const browser: any;

const extensionId = {
    chrome: 'momjbjbjpbcbnepbgkkiaofkgimihbii',
    firefox: '586beec1-c37c-4a1a-820f-a221e8c557ab',
    edge: 'aoenpdbabcjnjbjpegeenodfknllmaoi',
    opera: 'eldbfdnolaccbfiffkefkahicdpjjgfk',
} as const;

const extnId = extensionId[BROWSER_NAME as keyof typeof extensionId];
const chr = typeof chrome !== 'undefined' ? chrome : typeof browser !== 'undefined' ? browser : {};

function hasInjection(): boolean {
    return typeof (window as any)._executeJASvc === 'function';
}

export function executeService(svcName: string, action: string, args?: any[], $message?: any): Promise<any> {
    const injected = hasInjection();
    if (!injected && !chr?.runtime) {
        throw new Error('Unable to connect to extension. Ensure if Jira Assistant extension is installed and not disabled!');
    }
    if (!isAppBuild && !isPluginBuild && args) {
        args = convertToStorableValue(args) as any;
    }
    return new Promise((resolve, reject) => {
        const responder = isAppBuild || isPluginBuild ? resolve : (response: any) => processResponse(response, $message, resolve, reject);

        try {
            if (injected) {
                (window as any)._executeJASvc(extnId, { svcName, action, args }, responder, reject);
            } else if (!isWebBuild && browserInfo.isFirefox) {
                chr.runtime.sendMessage({ svcName, action, args }, responder);
            } else {
                chr.runtime.sendMessage(extnId, { svcName, action, args }, responder);
            }
        } catch (err) {
            console.error('Extension response error:', err);
            reject(err);
        }
    });
}

interface WebAppState {
    extnUnavailable?: boolean;
    isExtnValid?: boolean;
    extnVersion?: number;
    needIntegration?: boolean;
    authReady?: boolean;
}

export async function validateIfWebApp(state: WebAppState): Promise<WebAppState | false> {
    if (isWebBuild) {
        state.extnUnavailable = true;
        state.isExtnValid = false;

        if (!(window as any).chrome && !(window as any).browser && !hasInjection()) {
            return state;
        }

        try {
            const version = await executeService('SELF', 'VERSION');
            state.extnVersion = version;
            state.extnUnavailable = !version || !(version >= 2.38);
            state.isExtnValid = version >= 2.38;
            const isIntegrated = await executeService('SELF', 'IS_INTEGRATED');
            state.needIntegration = !isIntegrated;
            state.authReady = state.isExtnValid && isIntegrated;
        } catch (err) {
            console.error('Webapp validation error:', err);
        }

        return state;
    }
    return false;
}

export async function getExtnLaunchUrl(userId: number, $message?: any): Promise<string> {
    return await executeService('AppBrowserService', 'getLaunchUrl', [`/index.html#/${userId}/dashboard/0`], $message);
}
