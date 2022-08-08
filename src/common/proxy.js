import { BROWSER_NAME } from '../common/browsers';
import { convertToStorableValue, convertToUsableValue } from './storage-helpers';

const extensionId = {
    chrome: 'momjbjbjpbcbnepbgkkiaofkgimihbii',
    firefox: '586beec1-c37c-4a1a-820f-a221e8c557ab',
    edge: 'aoenpdbabcjnjbjpegeenodfknllmaoi',
    opera: ''
};

const extnId = extensionId[BROWSER_NAME];
const chr = window.chrome || window.browser;

function hasInjection() { return typeof window._executeJASvc === 'function'; }

export function executeService(svcName, action, args, $message) {
    const injected = hasInjection();
    if (!injected && !chr?.runtime) {
        throw new Error("Unable to connect to extension. Ensure if Jira Assistant extension is installed and not disabled!");
    }

    args = convertToStorableValue(args);
    return new Promise((resolve, reject) => {
        const responder = (response) => processResponse(response, $message, resolve, reject);
        try {
            if (injected) {
                window._executeJASvc(extnId, { svcName, action, args }, responder, reject);
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

function processResponse(response, $message, resolve, reject) {
    try {
        // Response received through content script would be JSON string
        if (response && typeof response === 'string') {
            response = JSON.parse(response);
        }

        const { success, error, messages } = response;

        if ($message && messages?.length) {
            messages.forEach($message.handler);
        }

        if (success || !error) {
            resolve(convertToUsableValue(success));
        } else {
            reject(error);
        }
    } catch (err) {
        console.error("Extension response error:", err);
        reject(err);
    }
}

export async function validateIfWebApp(state) {
    if (process.env.REACT_APP_WEB_BUILD === 'true') {
        state.extnUnavailable = true;
        state.isExtnValid = false;

        if (!window.chrome && !window.browser && !hasInjection()) {
            state.extnUnavailable = true;
            return state;
        }

        try {
            const version = await executeService('SELF', 'VERSION');
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