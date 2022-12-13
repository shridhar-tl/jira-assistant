/* global chrome browser */
import browserInfo, { BROWSER_NAME } from '../common/browsers';
import { isAppBuild, isWebBuild } from '../constants/build-info';
import { processResponse } from './proxy-helper';
import { convertToStorableValue } from './storage-helpers';

const extensionId = {
    chrome: 'momjbjbjpbcbnepbgkkiaofkgimihbii',
    firefox: '586beec1-c37c-4a1a-820f-a221e8c557ab',
    edge: 'aoenpdbabcjnjbjpegeenodfknllmaoi',
    opera: 'eldbfdnolaccbfiffkefkahicdpjjgfk'
};

const extnId = extensionId[BROWSER_NAME];
const chr = typeof chrome !== 'undefined' ? chrome : typeof browser !== 'undefined' ? browser : {};

function hasInjection() { return typeof window._executeJASvc === 'function'; }

export function executeService(svcName, action, args, $message) {
    const injected = hasInjection();
    if (!injected && !chr?.runtime) {
        throw new Error("Unable to connect to extension. Ensure if Jira Assistant extension is installed and not disabled!");
    }
    if (!isAppBuild) {
        args = convertToStorableValue(args);
    }
    return new Promise((resolve, reject) => {
        const responder = isAppBuild ? resolve : (response) => processResponse(response, $message, resolve, reject);

        try {
            if (injected) {
                window._executeJASvc(extnId, { svcName, action, args }, responder, reject);
            }
            else if (!isWebBuild && browserInfo.isFirefox) {
                chr.runtime.sendMessage({ svcName, action, args }, responder);
            }
            else {
                chr.runtime.sendMessage(extnId, { svcName, action, args }, responder);
            }
        } catch (err) {
            console.error("Extension response error:", err);
            reject(err);
        }
    });
}

export async function validateIfWebApp(state) {
    if (isWebBuild) {
        state.extnUnavailable = true;
        state.isExtnValid = false;

        if (!window.chrome && !window.browser && !hasInjection()) {
            return state;
        }

        try {
            const version = await executeService('SELF', 'VERSION');
            state.extnVersion = version;
            // This value should never be changed as this is the first version where this feature is introduced
            state.extnUnavailable = !version || !(version >= 2.38);
            // This version can be changed when specific change is available only after a specific version
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

export async function getExtnLaunchUrl(userId, $message) {
    return await executeService('AppBrowserService', 'getLaunchUrl', [`/index.html#/${userId}/dashboard`], $message);
}