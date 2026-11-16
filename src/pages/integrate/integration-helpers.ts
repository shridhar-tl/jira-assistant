import { isExtnAccessDenied } from '@/common/proxy-helper';
import { Dialog } from '@/dialogs';
import type MessageService from '@/services/message-service';
import { clearEnd, getOriginFromUrl, isInvalidJiraProfileError } from '@/utils';

export interface IntegrationFailureOptions {
    root: string;
    $message: MessageService;
    retryWith: (root: string) => void;
    unauthorizedMessage: string;
    permissionDeniedMessage?: string;
}

const invalidUrlMessage = 'Provide a valid Jira root url (eg: https://jira.example.com or https://your-site.atlassian.net).';

export function getJiraUrlError(url: string): string | undefined {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return invalidUrlMessage;
    }

    if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || !parsed.hostname) {
        return invalidUrlMessage;
    }

    return undefined;
}

function getHttpStatus(error: unknown): number | undefined {
    if (!error || typeof error !== 'object') {
        return undefined;
    }

    const { status } = error as { status?: unknown };
    return typeof status === 'number' ? status : undefined;
}

export function reportIntegrationFailure(error: unknown, options: IntegrationFailureOptions): void {
    const { root, $message, retryWith, unauthorizedMessage, permissionDeniedMessage } = options;
    const status = getHttpStatus(error);
    const isInvalidProfile = isInvalidJiraProfileError(error);

    if (isExtnAccessDenied(error)) {
        $message.error(error.message, 'Extension access denied');
        return;
    }

    if (!isInvalidProfile && status === undefined) {
        console.error('JA: Integration failed:', error);
        $message.error('Unable to integrate with Jira. Check browser console for more details.', 'Integration failed');
        return;
    }

    if (status === 401) {
        $message.warning(unauthorizedMessage, 'Unauthorized');
        return;
    }

    if (status === 403) {
        $message.error(
            'Jira denied access to your profile. Login to Jira in browser, complete any CAPTCHA or verification prompted and then retry.',
            'Access denied',
        );
        return;
    }

    if (status !== undefined && status >= 500) {
        $message.error(`Jira server responded with an error (HTTP ${status}). Retry after some time.`, 'Server error');
        return;
    }

    if (status === 0) {
        if (permissionDeniedMessage) {
            $message.error(permissionDeniedMessage, 'Permission Denied');
        } else {
            $message.error(`Unable to connect to "${root}". Verify the url and your network connectivity.`, 'Unable to connect');
        }
        return;
    }

    const origin = getOriginFromUrl(root);
    const cleanOrigin = origin ? clearEnd(origin, '/') : '';
    if (cleanOrigin && cleanOrigin !== root) {
        Dialog.yesNo(
            `"${root}" is not a valid Jira Api base path. Would you like to try with "${cleanOrigin}" instead?`,
            'Change URL',
        ).then(() => retryWith(cleanOrigin));
        return;
    }

    $message.error(`"${root}" is not a Jira server. ${invalidUrlMessage}`, 'Not a Jira server');
}
