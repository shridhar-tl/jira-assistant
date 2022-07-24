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

export function executeService(svcName, action, args, $message) {
    if (!chr?.runtime) {
        throw new Error("Unable to connect to extension. Ensure if Jira Assistant extension is installed and not disabled!");
    }

    args = convertToStorableValue(args);
    return new Promise((resolve, reject) => {
        try {
            chr.runtime.sendMessage(
                extnId,
                { svcName, action, args },
                (response) => {
                    const { success, error, messages } = response;

                    if ($message && messages?.length) {
                        messages.forEach($message.handler);
                    }

                    if (success || !error) {
                        resolve(convertToUsableValue(success));
                    } else {
                        reject(error);
                    }
                }
            );
        } catch (err) {
            console.error("Extension response error:", err);
            reject(err);
        }
    });
}

window.executeService = executeService;

export async function validateIfWebApp(state) {
    if (process.env.REACT_APP_WEB_BUILD === 'true') {
        state.extnUnavailable = true;
        state.isExtnValid = false;
        if (!window.chrome && !window.browser) {
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