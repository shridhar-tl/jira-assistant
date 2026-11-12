import { isAppBuild, isPluginBuild, isWebBuild } from '../constants/build-info';
import { SystemUserId } from '../constants/common';
import { SettingsCategory } from '../constants/settings';
import browserInfo, { BROWSER_NAME } from '../utils/browsers';

import { isExtnAccessDenied, processResponse } from './proxy-helper';
import { convertToStorableValue } from './storage-helpers';

declare const chrome: any;
declare const browser: any;

const extensionId = {
    chrome: 'momjbjbjpbcbnepbgkkiaofkgimihbii',
    firefox: '586beec1-c37c-4a1a-820f-a221e8c557ab',
    edge: 'aoenpdbabcjnjbjpegeenodfknllmaoi',
    opera: 'eldbfdnolaccbfiffkefkahicdpjjgfk',
} as const;

// The extension opens the web app with ?authType=1 so the page uses the extension's Jira integration.
export const isExtnLaunch = isWebBuild && new URLSearchParams(window.location.search).get('authType') === '1';

const extnId = extensionId[BROWSER_NAME as keyof typeof extensionId];

type ExtnAccessDeniedListener = (reason: string) => void;
const accessDeniedListeners = new Set<ExtnAccessDeniedListener>();

export function onExtnAccessDenied(listener: ExtnAccessDeniedListener): () => void {
    accessDeniedListeners.add(listener);
    return () => {
        accessDeniedListeners.delete(listener);
    };
}
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
    const request = new Promise((resolve, reject) => {
        const responder =
            isAppBuild || isPluginBuild
                ? resolve
                : (response: any) => {
                      if (response === undefined || response === null) {
                          const lastError = chr.runtime?.lastError?.message;
                          reject(new Error(lastError ? `No response from extension: ${lastError}` : 'No response from extension'));
                          return;
                      }
                      processResponse(response, $message, resolve, reject);
                  };

        try {
            if (injected) {
                (window as any)._executeJASvc(extnId, { svcName, action, args }, responder, reject);
            } else if (!isWebBuild && browserInfo.isFirefox) {
                chr.runtime.sendMessage({ svcName, action, args }, responder);
            } else {
                chr.runtime.sendMessage(extnId, { svcName, action, args }, responder);
            }
        } catch (err) {
            reject(err);
        }
    });

    return request.catch((err: unknown) => {
        console.error(`JA: Extension request ${svcName}.${action} failed:`, err);
        if (isExtnAccessDenied(err)) {
            accessDeniedListeners.forEach((listener) => listener(err.message));
        }
        throw err;
    });
}

export interface WebAppState {
    extnUnavailable?: boolean;
    isExtnValid?: boolean;
    extnVersion?: number;
    needIntegration?: boolean;
    authReady?: boolean;
    extnAccessDeniedReason?: string;
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
            // Reads the integrated user the same way authentication does, so that the extension
            // reports an access denial for this site here instead of failing later during authentication.
            const userSetting = await executeService('StorageService', 'getSetting', [SystemUserId, SettingsCategory.System, 'CurrentUserId']);
            const isIntegrated = userSetting?.value > 0;
            state.needIntegration = !isIntegrated;
            state.authReady = state.isExtnValid && isIntegrated;
        } catch (err) {
            if (isExtnAccessDenied(err)) {
                state.extnAccessDeniedReason = err.message;
                state.authReady = false;
            }
            console.error('JA: Webapp validation error:', err);
        }

        return state;
    }
    return false;
}

export async function getExtnLaunchUrl(userId: number, $message?: any): Promise<string> {
    return await executeService('AppBrowserService', 'getLaunchUrl', [`/index.html#/${userId}/dashboard/0`], $message);
}
