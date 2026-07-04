import { convertToUsableValue } from './storage-helpers';

interface ProxyResponse {
    success?: any;
    error?: any;
    messages?: any[];
}

interface MessageService {
    handler: (msg: any) => void;
}

export function processResponse(
    response: ProxyResponse | string,
    $message: MessageService | undefined,
    resolve: (value: any) => void,
    reject: (reason: any) => void,
): void {
    try {
        if (response && typeof response === 'string') {
            response = JSON.parse(response);
        }

        const { success, error, messages } = response as ProxyResponse;

        if ($message && messages?.length) {
            messages.forEach($message.handler);
        }

        if (success || !error) {
            resolve(convertToUsableValue(success));
        } else {
            reject(convertToUsableValue(error));
        }
    } catch (err) {
        console.error('Extension response error:', err);
        reject(err);
    }
}
