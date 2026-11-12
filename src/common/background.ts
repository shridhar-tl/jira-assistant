import { AppVersionNo, SystemUserId } from '../constants/common';
import { SettingsCategory } from '../constants/settings';
import injectServices, { inject, serviceObjectMap } from '../services/index-background';

import './extensions';
import { convertToStorableValue } from './storage-helpers';
import { type ExtnMessageRequest, type ExtnMessageSender, getAccessDenialReason, parseRequest } from './message-access';
import { type ExtnAccessDeniedError, extnAccessDeniedCode } from './proxy-helper';
import { getSenderOrigin } from './trusted-origin';

declare const chrome: any;
declare const browser: any;

interface MessageResponse {
    success?: any;
    error?: any;
    messages: any[];
}

interface RequestDetails {
    sender: ExtnMessageSender;
    message: unknown;
    response?: MessageResponse;
    sent?: boolean;
}

injectServices();
const services: any = {};
inject(services, 'AjaxRequestService', 'AppBrowserService', 'StorageService', 'SettingsService', 'MessageService', 'WorklogTimerService');
const ownExtnId: string = chrome.runtime.id;
const ownExtnOrigin = (chrome.runtime.getURL('/') as string).replace(/\/$/, '');
const accessDeniedMessage = 'Access denied';
let allowLocalOrigin = false;
let accessSettingsLoading: Promise<void> = Promise.resolve();
startListening();

function startListening(): void {
    chrome.runtime.onMessageExternal.addListener(onExternalRequestReceived);
    if (typeof browser !== 'undefined' && browser.runtime) {
        browser.runtime.onMessage.addListener(onInternalRequestReceived);
    } else {
        chrome.runtime.onMessage.addListener(onInternalRequestReceived);
    }
    accessSettingsLoading = loadAccessSettings();
    loadSettings();
    console.log('Started listening for incomming requests', new Date());
}

function onExternalRequestReceived(message: unknown, sender: ExtnMessageSender, sendResponse: (response: MessageResponse) => void): boolean {
    return onRequestReceived(message, sender, sendResponse, true);
}

function onInternalRequestReceived(message: unknown, sender: ExtnMessageSender, sendResponse: (response: MessageResponse) => void): boolean {
    return onRequestReceived(message, sender, sendResponse, false);
}

function onRequestReceived(
    message: unknown,
    sender: ExtnMessageSender,
    sendResponse: (response: MessageResponse) => void,
    isExternal: boolean,
): boolean {
    const reqDetails: RequestDetails = { sender, message };
    log('Received request from ', reqDetails);
    serveRequest(message, sender, sendResponse, isExternal, reqDetails);
    return true;
}

async function serveRequest(
    message: unknown,
    sender: ExtnMessageSender,
    sendResponse: (response: MessageResponse) => void,
    isExternal: boolean,
    reqDetails: RequestDetails,
): Promise<void> {
    await accessSettingsLoading;

    const parsed = parseRequest(message);
    if (parsed.error !== undefined) {
        denyRequest(parsed.error, message, sender, isExternal, sendResponse);
        return;
    }

    const denialReason = getAccessDenialReason(parsed.request, sender, { isExternal, ownId: ownExtnId, ownOrigin: ownExtnOrigin, allowLocalOrigin });
    if (denialReason) {
        denyRequest(denialReason, message, sender, isExternal, sendResponse);
        return;
    }

    await executeCommand(parsed.request, sendResponse, reqDetails);
}

function denyRequest(
    reason: string,
    message: unknown,
    sender: ExtnMessageSender,
    isExternal: boolean,
    sendResponse: (response: MessageResponse) => void,
): void {
    const deniedError: ExtnAccessDeniedError = { code: extnAccessDeniedCode, message: `${accessDeniedMessage}: ${reason}` };
    error(`JA: ${deniedError.message}`, { isExternal, senderOrigin: getSenderOrigin(sender), sender, message });
    sendResponse({ error: convertToStorableValue(deniedError), messages: [] });
}

async function loadAccessSettings(): Promise<void> {
    try {
        allowLocalOrigin = (await services.$settings.get('allowLocalJAOrigin')) === true;
    } catch (err) {
        allowLocalOrigin = false;
        error('Unable to load access settings', err);
    }
}

async function executeCommand(
    message: ExtnMessageRequest,
    sendResponse: (response: MessageResponse) => void,
    logDetails: RequestDetails,
): Promise<void> {
    const response: MessageResponse = { messages: [] };
    logDetails.response = response;
    const { svcName, action, args } = message;

    try {

        if (svcName === 'SELF') {
            switch (action) {
                case 'VERSION':
                    response.success = await Promise.resolve(AppVersionNo);
                    break;

                case 'IS_INTEGRATED':
                    const { $storage } = services;
                    const { value: userId } = (await $storage.getSetting(SystemUserId, SettingsCategory.System, 'CurrentUserId')) || {};
                    response.success = userId > 0;
                    break;

                case 'RELOAD':
                    accessSettingsLoading = loadAccessSettings();
                    await accessSettingsLoading;
                    loadSettings();
                    break;

                case 'GET_CS_SETTINGS': {
                    const [basePath] = args;
                    if (typeof basePath !== 'string') {
                        throw new Error('GET_CS_SETTINGS requires Jira base url as string');
                    }
                    response.success = await getContentSettings(basePath);
                    break;
                }

                default:
                    throw new Error(`Unsupported command: ${action}`);
            }
        } else {
            const serviceName = Object.hasOwn(serviceObjectMap, svcName) ? serviceObjectMap[svcName as keyof typeof serviceObjectMap] : undefined;
            const $service = serviceName ? services[serviceName] : undefined;
            if (typeof $service?.[action] !== 'function') {
                throw new Error(`Unsupported service action: ${svcName}.${action}`);
            }
            const { $message } = services;

            $message.onNewMessage((msg: any) => response.messages.push(msg));

            response.success = convertToStorableValue(await $service[action].apply($service, args));
        }
    } catch (ex: any) {
        const { message, status, statusText, error: err } = ex;
        response.error = convertToStorableValue({ message, status, statusText, error: err });
        error(`JA: Failed to execute ${svcName}.${action}:`, ex, logDetails);
    }

    sendResponse(response);
    logDetails.sent = true;
}

function log(...args: any[]): void {
    console.log(...args);
}

function error(...args: any[]): void {
    console.error(...args);
}

let stateChangeAttached = false;
const settings: Record<string, any> = {};

async function loadSettings(): Promise<void> {
    if (chrome.idle) {
        const TR_PauseOnLock = await services.$settings.get('TR_PauseOnLock');
        const TR_PauseOnIdle = await services.$settings.get('TR_PauseOnIdle');

        settings.TR_PauseOnLock = TR_PauseOnLock;
        settings.TR_PauseOnIdle = TR_PauseOnIdle;

        if (TR_PauseOnLock || TR_PauseOnIdle) {
            if (!stateChangeAttached) {
                chrome.idle.onStateChanged.addListener(systemStateChanged);
                stateChangeAttached = true;
                log('Listening for system state changes');
            }
        } else if (stateChangeAttached) {
            chrome.idle.onStateChanged.removeListener(systemStateChanged);
            stateChangeAttached = false;
            log('Deregistered listening to system state');
        }

        services.$jaBrowserExtn.persistBackground(TR_PauseOnIdle || TR_PauseOnLock);
    }

    if (chrome.scripting) {
        const attachCS = (await services.$settings.get('TR_AttachCS')) !== false;
        if (attachCS) {
            const users = await services.$storage.getAllUsers();

            const matches = (
                await Promise.all(
                    users.map(async (u: any) => {
                        if (u.id === SystemUserId) {
                            return null;
                        }
                        const url = `${u.jiraUrl.clearEnd('/')}/*`;
                        const hasPermission = await services.$jaBrowserExtn.hasPermission(
                            services.$jaBrowserExtn.getPermissionObj(null, url),
                        );
                        if (hasPermission) {
                            return url;
                        }
                        return null;
                    }),
                )
            ).filter(Boolean);

            await chrome.scripting.unregisterContentScripts();

            if (matches.length) {
                log('Attaching CS for ', matches);
                await services.$jaBrowserExtn.registerContentScripts('jira-plugin', ['/jira_cs.js'], matches);
            }
        } else {
            await chrome.scripting.unregisterContentScripts();
        }
    }
}

async function systemStateChanged(state: string): Promise<void> {
    log('System state changed to ', state);
    switch (state?.toLowerCase()) {
        case 'idle':
            if (settings.TR_PauseOnIdle) {
                await services.$wltimer.pauseTimer(true);
            }
            break;
        case 'locked':
            if (settings.TR_PauseOnLock) {
                await services.$wltimer.pauseTimer(true);
            }
            break;
        case 'active':
            await services.$wltimer.resumeTimer(true);
            break;
        default:
            console.warn('Unknown system state received:-', state);
            break;
    }
}

async function getContentSettings(basepath: string): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    const users = await services.$storage.filterUsers({ jiraUrl: basepath });

    if (users.length === 1) {
        result.userId = users[0].id;
        result.jiraUrl = users[0].jiraUrl;
    }

    const timer = await services.$wltimer.getCurrentTimer();

    if (timer && timer.userId === result.userId) {
        result.timerKey = timer.key;
        result.timerStarted = timer.started;
        result.timerLapse = timer.lapse;
    }

    result.attachDelay = parseInt(await services.$settings.get('TR_CSDelay')) * 1000 || 2000;
    result.showTimer = (await services.$settings.get('TR_ShowTimer')) !== false;

    result.keepAlive = settings.TR_PauseOnLock || settings.TR_PauseOnIdle;

    return result;
}
