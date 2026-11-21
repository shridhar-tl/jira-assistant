import { FF_STORE_URL } from '../constants/urls';

import BrowserBase, { type ContentScriptFiles, type PermissionObj, type RegisteredContentScript } from './browser-base';
import { extractAccessToken, getGoogleCalendarAuthUrl } from './google-web-auth';

declare const chrome: any;
declare const browser: any;

export default class FirefoxBrowserService extends BrowserBase {
    private chrome: any;
    private browser: any;

    constructor() {
        super();
        this.chrome = chrome;
        this.browser = browser;
        //https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
    }

    getCurrentUrl(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs: any[]) => {
                if (tabs && tabs[0] && tabs[0].url) {
                    resolve(tabs[0].url);
                } else {
                    reject('Unable to fetch the url');
                }
            });
        });
    }

    getCurrentTab(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs: any[]) => {
                if (tabs && tabs[0]) {
                    resolve(tabs[0]);
                } else {
                    reject('Unable to fetch the tab');
                }
            });
        });
    }

    hasPermission(permissions: PermissionObj): Promise<boolean> {
        return this.browser.permissions.contains(permissions);
    }

    async requestPermission(permissions: string[] | null, ...urls: string[]): Promise<boolean> {
        const pObj = this.getPermissionObj(permissions, ...urls);

        // Firefox allows permissions.request only synchronously within a user input handler.
        // Hence it is invoked before any await and falls back to contains when not triggered by user.
        try {
            return await this.browser.permissions.request(pObj);
        } catch {
            return this.hasPermission(pObj);
        }
    }

    async registerContentScripts(id: string, { js, css }: ContentScriptFiles, matches: string[]): Promise<void> {
        const scripts: RegisteredContentScript[] = [
            {
                id,
                js,
                css,
                matches,
                persistAcrossSessions: false,
                runAt: 'document_end',
                allFrames: true,
            },
        ];
        return await this.browser.scripting.registerContentScripts(scripts);
    }

    replaceTabUrl(url: string): Promise<any> {
        return this.getCurrentTab()
            .then((tab) => this.chrome.tabs.update(tab.id, { url: url }))
            .catch(() => this.openTab(url));
    }

    openTab(url: string, name?: string, opts?: string): void {
        if (!name) {
            this.browser.tabs.create({ url: url });
        } else {
            window.open(url, name, opts);
        }
    }

    getAuthToken(options: any): Promise<string> {
        return this.browser.identity
            .launchWebAuthFlow({
                interactive: options.interactive,
                url: getGoogleCalendarAuthUrl(this.browser.identity.getRedirectURL()),
            })
            .then((tokken: string) => extractAccessToken(tokken));
    }

    getRedirectUrl(endpoint?: string): string {
        return this.chrome.identity.getRedirectURL(endpoint);
    }

    launchWebAuthFlow(options: any): Promise<string> {
        return new Promise((resolve) => {
            this.chrome.identity.launchWebAuthFlow(options, resolve);
        });
    }

    removeAuthToken(authToken: string): void {
        this.browser.identity.removeCachedAuthToken({ token: authToken }, () => {});
    }

    getStoreUrl(_forRating?: boolean): string {
        return FF_STORE_URL;
    }

    extractAccessToken(redirectUri: string): string | null {
        return extractAccessToken(redirectUri);
    }

    getLaunchUrl(file: string): Promise<string> {
        return Promise.resolve(this.browser.runtime.getURL(file));
    }
}
