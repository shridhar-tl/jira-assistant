import { AppVersionNo, SystemUserId } from '../constants/common';
import { SettingsCategory } from '../constants/settings';
import injectServices, { inject, serviceObjectMap } from '../services/index-background';

import './extensions';
import { convertToStorableValue, convertToUsableValue } from './storage-helpers';

declare const chrome: any;
declare const browser: any;

interface MessageRequest {
    svcName: string;
    action: string;
    args?: any[];
}

interface MessageSender {
    origin?: string;
    url?: string;
    tab?: any;
}

interface MessageResponse {
    success?: any;
    error?: any;
    messages: any[];
}

interface RequestDetails {
    sender: MessageSender;
    message: MessageRequest;
    response?: MessageResponse;
    sent?: boolean;
}

const svcAllowedFromUnknownPage = ['SELF', 'WorklogTimerService', 'SettingsService'];

injectServices();
const services: any = {};
inject(services, 'AjaxRequestService', 'AppBrowserService', 'StorageService', 'SettingsService', 'MessageService', 'WorklogTimerService');
startListening();

function startListening(): void {
    chrome.runtime.onMessageExternal.addListener(onRequestReceived);
    if (typeof browser !== 'undefined' && browser.runtime) {
        browser.runtime.onMessage.addListener(onRequestReceived);
    } else {
        chrome.runtime.onMessage.addListener(onRequestReceived);
    }
    loadSettings();
    console.log('Started listening for incomming requests', new Date());
}

function onRequestReceived(message: MessageRequest, sender: MessageSender, sendResponse: (response: MessageResponse) => void): boolean {
    const reqDetails: RequestDetails = { sender, message };
    log('Received request from ', reqDetails);
    let origin = sender.origin;
    if (!origin && sender.url) {
        origin = new URL(sender.url).origin;
    }
    origin = origin!.toLowerCase();
    if (!origin.endsWith('.jiraassistant.com') && !svcAllowedFromUnknownPage.includes(message.svcName)) {
        log('Denied to serve request from unknown origin: ', message, sender.origin);
        return false;
    }

    executeCommand(message, sendResponse, reqDetails);
    return true;
}

async function executeCommand(
    message: MessageRequest,
    sendResponse: (response: MessageResponse) => void,
    logDetails: RequestDetails,
): Promise<void> {
    const response: MessageResponse = { messages: [] };
    logDetails.response = response;

    try {
        const { svcName, action } = message;
        const convertedArgs = message.args ? convertToUsableValue(message.args) : null;
        const args = Array.isArray(convertedArgs) ? convertedArgs : [];

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
                    loadSettings();
                    break;

                case 'GET_CS_SETTINGS':
                    response.success = await getContentSettings(args[0]);
                    break;

                default:
                    throw new Error(`Unsupported command: ${action}`);
            }
        } else {
            const serviceName = (serviceObjectMap as any)[svcName];
            const { $message, [serviceName]: $service } = services;

            $message.onNewMessage((msg: any) => response.messages.push(msg));

            response.success = convertToStorableValue(await $service[action].apply($service, args));
        }
    } catch (ex: any) {
        const { message, status, statusText, error: err } = ex;
        response.error = convertToStorableValue({ message, status, statusText, error: err });
        error(ex);
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
