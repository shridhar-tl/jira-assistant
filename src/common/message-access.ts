import { convertToUsableValue } from './storage-helpers';
import { getSenderOrigin, isHttpsOriginOfDomain, isJAWebAppOrigin, isTrustedJAOrigin } from './trusted-origin';

export interface ExtnMessageRequest {
    svcName: string;
    action: string;
    args: unknown[];
}

export interface ExtnMessageSender {
    id?: string;
    origin?: string;
    url?: string;
    tab?: unknown;
}

export interface MessageAccessContext {
    isExternal: boolean;
    ownId: string;
    ownOrigin: string;
    allowLocalOrigin: boolean;
}

type ArgsValidator = (args: unknown[], senderOrigin: string) => boolean;

type ActionRules = Readonly<Record<string, true | ArgsValidator>>;

const contentScriptRules: Readonly<Record<string, ActionRules>> = {
    SELF: {
        GET_CS_SETTINGS: (args, senderOrigin) => args[0] === senderOrigin,
    },
    WorklogTimerService: {
        startTimer: true,
        stopTimer: true,
        pauseTimer: true,
        resumeTimer: true,
    },
    SettingsService: {
        set: (args) => args[0] === 'TR_ShowTimer' && args[1] === false,
    },
};

const jaSiteServices: readonly string[] = ['SELF'];

const externalServicesByDomain: ReadonlyArray<{ rootDomain: string; services: readonly string[] }> = [
    { rootDomain: 'jiraassistant.com', services: jaSiteServices },
    { rootDomain: 'atlassian.net', services: ['SELF', 'WorklogTimerService', 'SettingsService'] },
];

function isAllowedForExternalPage(message: ExtnMessageRequest, senderOrigin: string, allowLocalOrigin: boolean): boolean {
    if (isJAWebAppOrigin(senderOrigin, allowLocalOrigin)) {
        return true;
    }
    return externalServicesByDomain.some(
        ({ rootDomain, services }) => isHttpsOriginOfDomain(senderOrigin, rootDomain) && services.includes(message.svcName),
    );
}

export type RequestParseResult = { request: ExtnMessageRequest; error?: undefined } | { request?: undefined; error: string };

// Web pages send args serialized by convertToStorableValue, while content scripts send them as a plain array.
function decodeArgs(args: unknown): unknown[] | string {
    if (args === undefined || args === null) {
        return [];
    }
    if (Array.isArray(args)) {
        return args;
    }
    if (typeof args !== 'string') {
        return `args must be an array or a serialized array, but received ${typeof args}`;
    }
    try {
        const decoded: unknown = convertToUsableValue(args);
        return Array.isArray(decoded) ? decoded : `serialized args must contain an array, but contained ${typeof decoded}`;
    } catch (err) {
        return `unable to parse serialized args: ${err instanceof Error ? err.message : String(err)}`;
    }
}

export function parseRequest(message: unknown): RequestParseResult {
    if (!message || typeof message !== 'object') {
        return { error: `request must be an object, but received ${message === null ? 'null' : typeof message}` };
    }
    const { svcName, action, args } = message as Record<string, unknown>;
    if (typeof svcName !== 'string' || typeof action !== 'string') {
        return { error: 'request must have svcName and action as string' };
    }
    const decodedArgs = decodeArgs(args);
    if (typeof decodedArgs === 'string') {
        return { error: decodedArgs };
    }
    return { request: { svcName, action, args: decodedArgs } };
}

function isOwnExtensionPage(sender: ExtnMessageSender, ownOrigin: string): boolean {
    return sender.origin === ownOrigin || !!sender.url?.startsWith(`${ownOrigin}/`);
}

function isAllowedForContentScript(message: ExtnMessageRequest, senderOrigin: string): boolean {
    const rule = Object.hasOwn(contentScriptRules, message.svcName) ? contentScriptRules[message.svcName] : undefined;
    const actionRule = rule && Object.hasOwn(rule, message.action) ? rule[message.action] : undefined;
    if (!actionRule) {
        return false;
    }
    return actionRule === true || actionRule(message.args, senderOrigin);
}

/**
 * Returns the reason for denying the request, or null when the request is allowed.
 */
export function getAccessDenialReason(message: ExtnMessageRequest, sender: ExtnMessageSender, context: MessageAccessContext): string | null {
    const { isExternal, ownId, ownOrigin, allowLocalOrigin } = context;
    const senderOrigin = getSenderOrigin(sender);
    if (!senderOrigin) {
        return 'origin of the sender could not be identified';
    }

    if (isExternal) {
        if (sender.id) {
            return `external request from extension "${sender.id}" is not allowed`;
        }
        if (isAllowedForExternalPage(message, senderOrigin, allowLocalOrigin)) {
            return null;
        }
        if (!allowLocalOrigin && isJAWebAppOrigin(senderOrigin, true)) {
            return `${senderOrigin} is not allowed. Enable "Local development site" in global settings of the extension`;
        }
        return `${message.svcName}.${message.action} is not allowed for ${senderOrigin}`;
    }

    if (sender.id !== ownId) {
        return `request from extension "${sender.id}" is not allowed`;
    }

    if (isOwnExtensionPage(sender, ownOrigin) || isJAWebAppOrigin(senderOrigin, allowLocalOrigin)) {
        return null;
    }

    if (isTrustedJAOrigin(senderOrigin)) {
        return jaSiteServices.includes(message.svcName) ? null : `${message.svcName}.${message.action} is not allowed for ${senderOrigin}`;
    }

    return isAllowedForContentScript(message, senderOrigin) ? null : `${message.svcName}.${message.action} is not allowed for content script of ${senderOrigin}`;
}
