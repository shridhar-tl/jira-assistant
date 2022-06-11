import { CHROME_WS_URL, AppVersionNo } from '../_constants';
import { getOriginFromUrl } from '../common/utils';
import BrowserBase from '../common/BrowserBase';

export default class ChromeBrowserService extends BrowserBase {
    constructor() {
        super();
        this.notSetting = {
            init: () => {
                if (this.notSetting.curShowing) {
                    return;
                }
                this.chrome.notifications.onButtonClicked.addListener(this.notSetting.buttonClicked);
                this.chrome.notifications.onClicked.addListener(this.notSetting.onClicked);
                this.chrome.notifications.onClosed.addListener(this.notSetting.onClosed);
                this.notSetting.curShowing = {};
            },
            buttonClicked: (id, index) => {
                const noti = this.notSetting.curShowing[id];
                if (noti) {
                    const btn = noti.buttons[index];
                    if (btn && btn.onClick) {
                        btn.onClick();
                    }
                    else {
                        // eslint-disable-next-line no-alert
                        alert("This functionality is not yet implemented!");
                    }
                    this.chrome.notifications.clear(id);
                }
            },
            onClicked: (id, byUser) => {
                const noti = this.notSetting.curShowing[id];
                if (noti) {
                    if (noti.onClicked) {
                        noti.onClicked(byUser);
                    }
                }
            },
            onClosed: (id, byUser) => {
                const noti = this.notSetting.curShowing[id];
                if (noti) {
                    delete this.notSetting.curShowing[id];
                    if (noti.onClosed) {
                        noti.onClosed(byUser);
                    }
                }
            },
            show: (id, title, message, ctxMsg, opts) => {
                const msgObj = {
                    type: "basic",
                    iconUrl: "/img/icon_48.png",
                    title: title,
                    message: message,
                    contextMessage: ctxMsg,
                    //eventTime
                    //buttons: btns,
                    //progress: 60,
                    isClickable: true,
                    requireInteraction: true,
                    buttons: []
                };
                if (opts.buttons) {
                    msgObj.buttons = opts.buttons.map((b) => ({ title: b.title }));
                }
                this.chrome.notifications.create(id, msgObj, (notId) => {
                    this.notSetting.curShowing[id] = opts;
                });
            }
        };
        this.$window = window;
        this.chrome = this.$window['chrome'];
        //https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
    }

    async getCurrentUrl() {
        const hasPermission = await this.hasPermission({ permissions: ["activeTab"] });
        if (!hasPermission) {
            console.log("Jira Assistant do not have access to retrive the current url");
            return "";
        }

        return new Promise((resolve, reject) => {
            this.chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, (tabs) => {
                if (tabs && tabs[0] && tabs[0].url) {
                    resolve(tabs[0].url);
                }
                else {
                    reject("Unable to fetch the url");
                }
            });
        });
    }

    async getCurrentTab() {
        const hasPermission = await this.hasPermission({ permissions: ["activeTab"] });
        if (!hasPermission) {
            console.log("Jira Assistant do not have access to retrive current tab");
            return null;
        }

        return new Promise((resolve, reject) => {
            this.chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
                if (tabs && tabs[0]) {
                    resolve(tabs[0]);
                }
                else {
                    reject("Unable to fetch the tab");
                }
            });
        });
    }

    hasPermission(permissions) {
        return new Promise((resolve) => {
            this.chrome.permissions.contains(permissions, resolve);
        });
    }

    hasUpdates() {
        return new Promise((resolve) => {
            this.chrome.runtime.requestUpdateCheck((result) => {
                resolve(parseFloat(result?.update_available?.version) || false);
            });
        });
    }

    async requestPermission(permissions, url) {
        try {
            const pObj = this.getPermissionObj(permissions, url);
            const result = await this.hasPermission(pObj);

            if (result) {
                return true;
            } else {
                console.log("Requesting permission for: ", pObj);
                return new Promise((resolve) => {
                    this.chrome.permissions.request(pObj, resolve);
                });
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
    }

    getPermissionObj(permissions, url) {
        if (!permissions) {
            permissions = ['tabs'];
        }

        const result = { permissions };

        if (url) {
            result.origins = [getOriginFromUrl(url)];
        }

        return result;
    }

    replaceTabUrl(url) {
        return this.getCurrentTab().then((tab) => {
            this.chrome.tabs.update(tab.id, { url: url });
        });
    }

    openTab(url) {
        window.open(url); // need to change
    }

    getStorage() {
        return this.chrome.storage ? this.chrome.storage.local : localStorage;
    }

    getStorageInfo() {
        return navigator.storage.estimate().then((estimate) => {
            const usedSpace = estimate.usage;
            const totalSpace = estimate.quota;
            return {
                totalSpace: totalSpace,
                usedSpace: usedSpace,
                freeSpace: totalSpace - usedSpace,
                usedSpacePerc: Math.round(usedSpace * 100 / totalSpace)
            };
        });
    }

    getAppInfo() { // need to change
        return new Promise((resolve, reject) => {
            const { management } = this.chrome;
            if (management) {
                management.getSelf((info) => {
                    if (info) {
                        info.isDevelopment = info.installType === this.chrome.management.ExtensionInstallType.DEVELOPMENT;
                        resolve(info);
                    }
                    else {
                        reject(info);
                    }
                });
            }
        });
    }

    getAppVersion() {
        return this.getAppInfo().then(info => info.version, () => AppVersionNo.toString());
    }

    getAppLongName() { // need to change
        return this.chrome.app.getDetails().name;
    }

    notify(id, title, message, ctxMsg, opts) {
        this.notSetting.init();
        this.notSetting.show(id, title, message, ctxMsg, opts);
    }

    addCmdListener(callback) { this.chrome.commands.onCommand.addListener(callback); }

    getAuthToken(options) { // need to change
        return new Promise((resolve, reject) => {
            this.chrome.identity.getAuthToken(options, (accessToken) => {
                if (this.chrome.runtime.lastError || !accessToken) {
                    console.error('GCalendar intergation failed', accessToken, this.chrome.runtime.lastError.message);
                    reject({ error: this.chrome.runtime.lastError, tokken: accessToken });
                }
                else {
                    resolve(accessToken);
                }
            });
        });
    }

    getRedirectUrl(endpoint) { // need to change
        return this.chrome.identity.getRedirectURL(endpoint);
    }

    launchWebAuthFlow(options) {
        return new Promise((resolve) => {
            this.chrome.identity.launchWebAuthFlow(options, resolve);
        });
    }

    removeAuthTokken(authToken) { // need to change
        this.chrome.identity.removeCachedAuthToken({ 'token': authToken }, () => { /* Nothing to implement */ });
    }

    getStoreUrl(forRating) { // need to change
        return CHROME_WS_URL + (forRating ? '/reviews' : '');
    }

    extractAccessToken(redirectUri) {
        const m = redirectUri.match(/[#?](.*)/);
        if (!m || m.length < 1) { return null; }
        const params = new URLSearchParams(m[1].split("#")[0]);
        return params.get("access_token");
    }
}
