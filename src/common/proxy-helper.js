import { convertToUsableValue } from "./storage-helpers";

export function processResponse(response, $message, resolve, reject) {
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
            reject(convertToUsableValue(error));
        }
    } catch (err) {
        console.error("Extension response error:", err);
        reject(err);
    }
}