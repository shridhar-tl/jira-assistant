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
    if (!chr) {
        throw new Error("Unable to connect to extension. Ensure if Jira Assistant extension is installed and not disabled!");
    }

    args = convertToStorableValue(args);
    return new Promise((resolve, reject) => {
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
    });
}

window.executeService = executeService;