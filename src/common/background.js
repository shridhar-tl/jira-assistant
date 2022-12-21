/* global chrome browser */
import injectServices, { serviceObjectMap, inject } from "../services/index.background";
import { AppVersionNo, SystemUserId } from "../constants/common";
import { SettingsCategory } from "../constants/settings";
import { convertToStorableValue, convertToUsableValue } from "./storage-helpers";
import './extensions';

const svcAllowedFromUnknownPage = ['SELF', 'WorklogTimerService', 'SettingsService'];

injectServices();
const services = {};
inject(services, 'AjaxRequestService', 'AppBrowserService', 'StorageService', 'SettingsService', 'MessageService', 'WorklogTimerService');
startListening();

function startListening() {
    chrome.runtime.onMessageExternal.addListener(onRequestReceived);
    if (typeof browser !== 'undefined' && browser.runtime) {
        browser.runtime.onMessage.addListener(onRequestReceived);
    } else {
        chrome.runtime.onMessage.addListener(onRequestReceived);
    }
    loadSettings();
    console.log("Started listening for incomming requests", new Date());
}

function onRequestReceived(message, sender, sendResponse) {
    const reqDetails = { sender, message };
    log("Received request from ", reqDetails);
    let origin = sender.origin;
    if (!origin && sender.url) { // origin is unavailable when request received through content script
        origin = new URL(sender.url).origin;
    }
    origin = origin.toLowerCase();
    if (!origin.endsWith('.jiraassistant.com') //&& !origin.endsWith('.atlassian.net')
        && !svcAllowedFromUnknownPage.includes(message.svcName)) {
        log("Denied to serve request from unknown origin: ", message, sender.origin);
        return;
    }

    executeCommand(message, sendResponse, reqDetails);
    return true;
}

async function executeCommand(message, sendResponse, logDetails) {
    const response = { messages: [] };
    logDetails.response = response;

    try {
        const { svcName, action } = message;
        const args = convertToUsableValue(message.args);

        if (svcName === 'SELF') {
            switch (action) {
                case 'VERSION':
                    response.success = await Promise.resolve(AppVersionNo);
                    break;

                case 'IS_INTEGRATED':
                    const { $storage } = services;
                    const { value: userId } = await $storage.getSetting(SystemUserId, SettingsCategory.System, 'CurrentUserId') || {};
                    //const { value: jiraUrl } = await $storage.getSetting(SystemUserId, SettingsCategory.System, 'CurrentJiraUrl') || {};
                    response.success = userId > 0;// && !!jiraUrl;
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
            const { $message, [serviceObjectMap[svcName]]: $service } = services;

            $message.onNewMessage((msg) => response.messages.push(msg));

            response.success = convertToStorableValue(await $service[action].apply($service, args));
        }
    } catch (ex) {
        const { message, status, statusText, error: err } = ex;
        response.error = convertToStorableValue({ message, status, statusText, error: err });
        error(ex);
    }

    sendResponse(response);
    logDetails.sent = true;
}

function log() { console.log(...arguments); }
function error() { console.error(...arguments); }

let stateChangeAttached = false;
const settings = {};
async function loadSettings() {
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

            const matches = (await Promise.all(users.map(async u => {
                if (u.id === SystemUserId) { return null; }
                const url = `${u.jiraUrl.clearEnd('/')}/*`;
                const hasPermission = await services.$jaBrowserExtn.hasPermission(services.$jaBrowserExtn.getPermissionObj(null, url));
                if (hasPermission) {
                    return url;
                }
            }))).filter(Boolean);

            await chrome.scripting.unregisterContentScripts();

            if (matches.length) {
                log('Attaching CS for ', matches);
                await services.$jaBrowserExtn.registerContentScripts('jira-plugin', ['/static/js/jira_cs.js'], matches);
            }
        } else {
            await chrome.scripting.unregisterContentScripts();
        }
    }
}

async function systemStateChanged(state) {
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
            console.warning('Unknown system state received:-', state);
            break;
    }
}

async function getContentSettings(basepath) {
    const result = {};
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

    result.attachDelay = (parseInt(await services.$settings.get('TR_CSDelay')) * 1000) || 2000;
    result.showTimer = (await services.$settings.get('TR_ShowTimer')) !== false;

    result.keepAlive = settings.TR_PauseOnLock || settings.TR_PauseOnIdle;

    return result;
}