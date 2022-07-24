/* global chrome */
import injectServices, { serviceObjectMap, inject } from "../services/index.background";
import { AppVersionNo, SettingsCategory, SystemUserId } from "../constants/common";
import { convertToStorableValue, convertToUsableValue } from "./storage-helpers";

injectServices();
const services = {};
inject(services, 'AjaxRequestService', 'AppBrowserService', 'StorageService', 'MessageService');
startListening();

function startListening() {
    chrome.runtime.onMessageExternal.addListener(onRequestReceived);
    console.log("Started listening for incomming requests");
}

function onRequestReceived(message, sender, sendResponse) {
    log("Received request form ", sender, message);
    const origin = sender.origin.toLowerCase();
    if (!origin.endsWith('.jiraassistant.com')) {
        return;
    }

    executeCommand(message, sendResponse);
    return true;
}

async function executeCommand(message, sendResponse) {
    const response = { messages: [] };

    try {
        const { svcName, action, args } = message;

        if (svcName === 'SELF') {
            if (action === 'VERSION') {
                response.success = AppVersionNo;
            } else if (action === 'IS_INTEGRATED') {
                const { $storage } = services;
                const { value: userId } = await $storage.getSetting(SystemUserId, SettingsCategory.System, 'CurrentUserId') || {};
                const { value: jiraUrl } = await $storage.getSetting(SystemUserId, SettingsCategory.System, 'CurrentJiraUrl') || {};
                response.success = userId > 0 && !!jiraUrl;
            } else {
                throw new Error('Unsupported command: ', action);
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
}

function log() { console.log(arguments); }
function error() { console.error(arguments); }