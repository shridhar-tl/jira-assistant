import { getSenderOrigin, isHttpsOriginOfDomain, isJAWebAppOrigin, isTrustedJAOrigin } from './trusted-origin';

export interface ExtnMessageRequest {
    svcName: string;
    action: string;
    args?: unknown[];
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

function isValidRequest(message: unknown): message is ExtnMessageRequest {
    if (!message || typeof message !== 'object') {
        return false;
    }
    const { svcName, action, args } = message as Record<string, unknown>;
    return typeof svcName === 'string' && typeof action === 'string' && (args === undefined || args === null || Array.isArray(args));
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
    return actionRule === true || actionRule(message.args || [], senderOrigin);
}

export function isMessageAllowed(message: unknown, sender: ExtnMessageSender, context: MessageAccessContext): boolean {
    const { isExternal, ownId, ownOrigin, allowLocalOrigin } = context;
    if (!isValidRequest(message)) {
        return false;
    }

    const senderOrigin = getSenderOrigin(sender);
    if (!senderOrigin) {
        return false;
    }

    if (isExternal) {
        return !sender.id && isAllowedForExternalPage(message, senderOrigin, allowLocalOrigin);
    }

    if (sender.id !== ownId) {
        return false;
    }

    if (isOwnExtensionPage(sender, ownOrigin) || isJAWebAppOrigin(senderOrigin, allowLocalOrigin)) {
        return true;
    }

    if (isTrustedJAOrigin(senderOrigin)) {
        return jaSiteServices.includes(message.svcName);
    }

    return isAllowedForContentScript(message, senderOrigin);
}
