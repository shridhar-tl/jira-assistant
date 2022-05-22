import { EDGE_STORE_URL } from '../_constants';
import BrowserBase from '../common/BrowserBase';

export default class AppBrowserService extends BrowserBase {
    constructor() {
        super();
        this.notSetting = {
            init: () => {
                if (this.notSetting.curShowing) {
                    return;
                }
                this.browser.notifications.onButtonClicked.addListener(this.notSetting.buttonClicked);
                this.browser.notifications.onClicked.addListener(this.notSetting.onClicked);
                this.browser.notifications.onClosed.addListener(this.notSetting.onClosed);
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
                    this.browser.notifications.clear(id);
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
                    msgObj.buttons = opts.buttons.map((b) => { return { title: b.title }; });
                }
                this.browser.notifications.create(id, msgObj, (notId) => {
                    this.notSetting.curShowing[id] = opts;
                });
            }
        };
        this.$window = window;
        this.browser = this.$window['browser'];
        //https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
    }

    getCurrentUrl() {
        return this.getCurrentTab().then((tab) => {
            if (tab && tab.url) {
                return tab.url;
            }
            else {
                return Promise.reject("Unable to fetch the url");
            }
        });
    }

    getCurrentTab() {
        return new Promise((resolve, reject) => {
            this.browser.tabs.query({ 'active': true, 'lastFocusedWindow': true }, (tabs) => {
                if (tabs && tabs[0]) {
                    resolve(tabs[0]);
                }
                else {
                    reject("Unable to fetch the tab");
                }
            });
        });
    }

    hasUpdates() {
        return new Promise(function (resolve) {
            this.chrome.runtime.requestUpdateCheck(function (result) {
                resolve(parseFloat(result?.update_available?.version) || false);
            });
        });
    }

    replaceTabUrl(url) {
        return this.getCurrentTab().then((tab) => {
            this.browser.tabs.update(tab.id, { url: url });
        });
    }

    openTab(url) {
        this.browser.tabs.create({ url, active: true });
    }

    getStorage() {
        return this.browser.storage ? this.browser.storage.local : localStorage;
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
            const { management } = this.browser;
            if (management) {
                management.getSelf((info) => {
                    if (info) {
                        info.isDevelopment = info.installType === this.browser.management.ExtensionInstallType.DEVELOPMENT;
                        resolve(info);
                    }
                    else {
                        reject(info);
                    }
                });
            }
            else {
                reject("Extension do not have access to management api");
            }
        });
    }

    async getAppVersion() {
        try {
            return this.browser?.runtime?.getManifest()?.version || '1.5';
        }
        catch {
            return this.getAppInfo().then(info => info?.version, () => '1.5');
        }
    }

    getAppLongName() { // need to change
        return this.browser.app.getDetails().name;
    }

    notify(id, title, message, ctxMsg, opts) {
        this.notSetting.init();
        this.notSetting.show(id, title, message, ctxMsg, opts);
    }

    addCmdListener(callback) { this.browser.commands.onCommand.addListener(callback); }

    getAuthToken(options) { // need to change
        return new Promise((resolve, reject) => {
            this.browser.identity.getAuthToken(options, (accessToken) => {
                if (this.browser.runtime.lastError || !accessToken) {
                    console.error('GCalendar intergation failed', accessToken, this.browser.runtime.lastError.message);
                    reject({ error: this.browser.runtime.lastError, tokken: accessToken });
                }
                else {
                    resolve(accessToken);
                }
            });
        });
    }

    getRedirectUrl(endpoint) { // need to change
        return "";
        //return this.browser.identity.getRedirectURL(endpoint);
    }

    launchWebAuthFlow(options) {
        return new Promise((resolve) => {
            this.browser.identity.launchWebAuthFlow(options, resolve);
        });
    }

    removeAuthTokken(authToken) { // need to change
        this.browser.identity.removeCachedAuthToken({ 'token': authToken }, () => { /* Nothing to implement */ });
    }

    getStoreUrl(forRating) { // need to change
        return EDGE_STORE_URL + (forRating ? '/reviews' : '');
    }

    extractAccessToken(redirectUri) {
        const m = redirectUri.match(/[#?](.*)/);
        if (!m || m.length < 1) { return null; }
        const params = new URLSearchParams(m[1].split("#")[0]);
        return params.get("access_token");
    }
}
