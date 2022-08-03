/* global chrome browser */
import injectServices, { serviceObjectMap, inject } from "../services/index.background";
import { AppVersionNo, SystemUserId } from "../constants/common";
import { SettingsCategory } from "../constants/settings";
import { convertToStorableValue, convertToUsableValue } from "./storage-helpers";

injectServices();
const services = {};
inject(services, 'AjaxRequestService', 'AppBrowserService', 'StorageService', 'MessageService');
startListening();

function startListening() {
    chrome.runtime.onMessageExternal.addListener(onRequestReceived);
    if (typeof browser !== 'undefined' && browser.runtime) {
        browser.runtime.onMessage.addListener(onRequestReceived);
    }
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
            if (action === 'VERSION') {
                response.success = await Promise.resolve(convertToStorableValue(AppVersionNo));
            } else if (action === 'IS_INTEGRATED') {
                const { $storage } = services;
                const { value: userId } = await $storage.getSetting(SystemUserId, SettingsCategory.System, 'CurrentUserId') || {};
                const { value: jiraUrl } = await $storage.getSetting(SystemUserId, SettingsCategory.System, 'CurrentJiraUrl') || {};
                response.success = convertToStorableValue(userId > 0 && !!jiraUrl);
            } else {
                throw new Error(`Unsupported command: ${action}`);
            }
        } else {
            const { $message, [serviceObjectMap[svcName]]: $service } = services;

            $message.onNewMessage((msg) => response.messages.push(msg));

            response.success = convertToStorableValue(await $service[action].apply($service, convertToUsableValue(args)));
        }
    } catch (ex) {
        response.error = ex;
        error(ex);
    }

    sendResponse(response);
    logDetails.sent = true;
}

function log() { console.log(arguments); }
function error() { console.error(arguments); }