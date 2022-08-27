const { ipcMain } = require('electron');
const selfSvc = require('./services/self-info');
const $request = require('./services/ajax-request-service');
const $browser = require('./services/environment-service');
const $storage = require('./services/storage-service');

//https://www.electronjs.org/docs/latest/tutorial/ipc
module.exports = function () {
    ipcMain.handle('SELF', handler.bind(selfSvc));
    ipcMain.handle('StorageService', handler.bind($storage));
    ipcMain.handle('AppBrowserService', handler.bind($browser));
    ipcMain.handle('AjaxRequestService', handler.bind($request));
};

async function handler(event, action, args) {
    return await this[action](...args);
}