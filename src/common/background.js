/* global chrome browser */
import injectServices, { serviceObjectMap, inject } from "../services/index.background";
import { AppVersionNo, SystemUserId } from "../constants/common";
import { SettingsCategory } from "../constants/settings";
import { convertToStorableValue, convertToUsableValue } from "./storage-helpers";

injectServices();
const services = {};
inject(services, 'AjaxRequestService', 'AppBrowserService', 'StorageService', 'SettingsService', 'MessageService');
startListening();

function startListening() {
    chrome.runtime.onMessageExternal.addListener(onRequestReceived);
    if (typeof browser !== 'undefined' && browser.runtime) {
        browser.runtime.onMessage.addListener(onRequestReceived);
    }
    loadSettings();
    console.log("Started listening for incomming requests");
}

function onRequestReceived(message, sender, sendResponse) {
    const reqDetails = { sender, message };
    log("Received request from ", reqDetails);
    let origin = sender.origin;
    if (!origin && sender.url) { // origin is unavailable when request received through content script
        origin = new URL(sender.url).origin;
    }
    origin = origin.toLowerCase();
    if (!origin.endsWith('.jiraassistant.com')) {
        log("Denied to serve request from unknown origin: ", sender.origin);
        return;
    }

    executeCommand(message, sendResponse, reqDetails);
    return true;
}

async function executeCommand(message, sendResponse, logDetails) {
    const response = { messages: [] };
    logDetails.response = response;

    try {
        const { svcName, action, args } = message;

        if (svcName === 'SELF') {
            switch (action) {
                case 'VERSION':
                    response.success = await Promise.resolve(convertToStorableValue(AppVersionNo));
                    break;

                case 'IS_INTEGRATED':
                    const { $storage } = services;
                    const { value: userId } = await $storage.getSetting(SystemUserId, SettingsCategory.System, 'CurrentUserId') || {};
                    const { value: jiraUrl } = await $storage.getSetting(SystemUserId, SettingsCategory.System, 'CurrentJiraUrl') || {};
                    response.success = convertToStorableValue(userId > 0 && !!jiraUrl);
                    break;

                case 'RELOAD':
                    loadSettings();
                    break;

                case 'GET_CS_SETTINGS':
                    response.success = await getContentSettings(args, logDetails.sender);
                    break;

                default:
                    throw new Error(`Unsupported command: ${action}`);
            }
        } else {
            const { $message, [serviceObjectMap[svcName]]: $service } = services;

            $message.onNewMessage((msg) => response.messages.push(msg));

            response.success = convertToStorableValue(await $service[action].apply($service, convertToUsableValue(args)));
        }
    } catch (ex) {
        response.error = convertToStorableValue(ex);
        error(ex);
    }

    sendResponse(response);
    logDetails.sent = true;
}

function log() { console.log(arguments); }
function error() { console.error(arguments); }

let stateChangeAttached = false;
const settings = {};
async function loadSettings() {
    if (chrome.idle) {
        const TR_PauseOnLock = await services.$settings.get('TR_PauseOnLock');
        const TR_PauseOnIdle = await services.$settings.get('TR_PauseOnIdle');

        settings.TR_PauseOnLock = TR_PauseOnLock;
        settings.TR_PauseOnIdle = TR_PauseOnIdle;

        if (TR_PauseOnLock || TR_PauseOnIdle) {
            if (!services.$wltimer) {
                inject(services, 'WorklogTimerService');
            }
            if (!stateChangeAttached) {
                chrome.idle.onStateChanged.addListener(systemStateChanged);
                stateChangeAttached = true;
            }
        } else {
            chrome.idle.onStateChanged.removeListener(systemStateChanged);
            stateChangeAttached = false;
        }
    }
}

async function systemStateChanged(state) {
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
    if (!services.$wltimer) {
        inject(services, 'WorklogTimerService');
    }
    const result = {};
    const users = await services.$storage.filterUsers({ jiraUrl: basepath });
    if (users.length === 1) {
        result.userId = users[0].id;
    }

    const timer = await services.$wltimer.getCurrentTimer();
    if (timer?.userId === result.userId) {
        result.timerKey = timer.key;
        result.timerStarted = timer.started;
        result.timerLapse = timer.lapse;
    }

    return result;
}