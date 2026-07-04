import { FF_STORE_URL } from '../constants/urls';

import BrowserBase from './browser-base';

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

    async registerContentScripts(id: string, js: string[], matches: string[]): Promise<void> {
        return await this.browser.scripting.registerContentScripts([
            {
                id,
                js,
                matches,
                persistAcrossSessions: false,
                runAt: 'document_end',
                allFrames: true,
            },
        ]);
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
        const REDIRECT_URL = this.browser.identity.getRedirectURL();
        const CLIENT_ID = '692513716183-jm587gc534dvsere4qhnk5bj68pql3p9.apps.googleusercontent.com';
        const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
        const AUTH_URL = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(
            REDIRECT_URL,
        )}&scope=${encodeURIComponent(SCOPES.join(' '))}`;
        return this.browser.identity
            .launchWebAuthFlow({
                interactive: options.interactive,
                url: AUTH_URL,
            })
            .then((tokken: string) => this.extractAccessToken(tokken));
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

    getStoreUrl(forRating?: boolean): string {
        return FF_STORE_URL;
    }

    extractAccessToken(redirectUri: string): string | null {
        const m = redirectUri.match(/[#?](.*)/);
        if (!m || m.length < 1) {
            return null;
        }
        const params = new URLSearchParams(m[1].split('#')[0]);
        return params.get('access_token');
    }

    getLaunchUrl(file: string): Promise<string> {
        return Promise.resolve(this.browser.runtime.getURL(file));
    }
}
