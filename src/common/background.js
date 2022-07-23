/* global chrome */
import injectServices, { serviceObjectMap, inject } from "../services/index.background";
import { convertToStorableValue, convertToUsableValue } from "./storage-helpers";

injectServices();
startListening();

function startListening() {
    chrome.runtime.onMessageExternal.addListener(onRequestReceived);
    console.log("Started listening for incomming requests");
}

/*function stopListening() {
    chrome.runtime.onMessageExternal.removeListener(onRequestReceived);
}*/

function onRequestReceived(message, sender, sendResponse) {
    log("Received request form ", sender, message);
    const origin = sender.origin.toLowerCase();
    if (!origin.endsWith('.jiraassistant.com') && origin !== "http://localhost:8080") {
        return;
    }

    executeCommand(message, sendResponse);
    return true;
}

async function executeCommand(message, sendResponse) {
    const response = { messages: [] };

    try {
        const { svcName, action, args } = message;

        const services = {};
        inject(services, svcName, 'MessageService');
        const { $message, [serviceObjectMap[svcName]]: $service } = services;

        $message.onNewMessage((msg) => response.messages.push(msg));

        response.success = convertToStorableValue(await $service[action].apply($service, convertToUsableValue(args)));
    } catch (ex) {
        response.error = ex;
        error(ex);
    }

    sendResponse(response);
}

function log() { console.log(arguments); }
function error() { console.error(arguments); }