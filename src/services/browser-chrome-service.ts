import { CHROME_WS_URL } from '@/constants';

import BrowserBase from './browser-base';

declare const chrome: any;

export default class ChromeBrowserService extends BrowserBase {
    private chrome: any;
    private activePorts?: any[];
    private listeningForPorts?: boolean;
    private clientPort?: any;

    constructor() {
        super();
        this.chrome = chrome;
    }

    async getCurrentUrl(): Promise<string> {
        const hasPermission = await this.hasPermission({
            permissions: ['activeTab'],
        });
        if (!hasPermission) {
            console.log('Jira Assistant do not have access to retrieve the current url');
            return '';
        }

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

    async getCurrentTab(): Promise<any> {
        const hasPermission = await this.hasPermission({
            permissions: ['activeTab'],
        });
        if (!hasPermission) {
            console.log('Jira Assistant do not have access to retrieve current tab');
            return null;
        }

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

    hasPermission(permissions: any): Promise<boolean> {
        return new Promise((resolve) => {
            this.chrome.permissions.contains(permissions, resolve);
        });
    }

    async requestPermission(permissions: any, ...url: string[]): Promise<boolean> {
        try {
            const pObj = this.getPermissionObj(permissions, ...url);
            const result = await this.hasPermission(pObj);

            if (result) {
                return true;
            } else {
                console.log('Requesting permission for: ', pObj);
                return new Promise((resolve) => {
                    this.chrome.permissions.request(pObj, resolve);
                });
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }

    async registerContentScripts(id: string, js: string[], matches: string[]): Promise<void> {
        return await this.chrome.scripting.registerContentScripts([
            {
                id,
                js,
                matches,
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
        window.open(url, name, opts);
    }

    getAuthToken(options: any): Promise<string> {
        return new Promise((resolve, reject) => {
            this.chrome.identity.getAuthToken(options, (accessToken: string) => {
                if (this.chrome.runtime.lastError || !accessToken) {
                    console.error('GCalendar integration failed', accessToken, this.chrome.runtime.lastError.message);
                    reject({ error: this.chrome.runtime.lastError, tokken: accessToken });
                } else {
                    resolve(accessToken);
                }
            });
        });
    }

    getRedirectUrl(endpoint?: string): string {
        return this.chrome.identity.getRedirectURL(endpoint);
    }

    launchWebAuthFlow(options: any): Promise<string> {
        return new Promise((resolve) => {
            this.chrome.identity.launchWebAuthFlow(options, resolve);
        });
    }

    removeAuthTokken(authToken: string): void {
        this.chrome.identity.removeCachedAuthToken({ token: authToken }, () => {});
    }

    getStoreUrl(forRating?: boolean): string {
        return CHROME_WS_URL + (forRating ? '/reviews' : '');
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
        return Promise.resolve(this.chrome.runtime.getURL(file));
    }

    persistBackground(persist: boolean): void {
        try {
            if (persist) {
                this.activePorts = this.activePorts || [];
                if (!this.listeningForPorts) {
                    this.listeningForPorts = true;
                    chrome.runtime.onConnect.addListener((port: any) => {
                        this.activePorts!.push(port);
                        console.log('New client connected. Total Alive:', this.activePorts?.length);
                        port.onMessage.addListener((msg: any) => {
                            console.log('Message on port:', msg);
                        });
                        port.onDisconnect.addListener(this.attachToClient);
                        console.log('Attached keep-alive listener', this.listeningForPorts, this.activePorts);
                    });
                    this.attachToClient();
                }
            }
        } catch (err) {
            console.error('Error trying to persist background pages:', err);
        }
    }

    attachToClient = (port?: any): void => {
        if (port && this.activePorts) {
            const index = this.activePorts.indexOf(port);
            if (~index) {
                this.activePorts.splice(index);
            }
        }
    };

    connectAndKeepAlive(onChange?: () => void): void {
        try {
            if (this.clientPort) {
                this.clientPort.disconnect();
                this.clientPort = null;
            }
            const port = chrome.runtime.connect({ name: 'keep-alive' });
            port.onMessage.addListener(() => {
                if (onChange) {
                    onChange();
                }
            });
            this.clientPort = port;
            port.postMessage('keep-alive');
            port.onDisconnect.addListener(() => setTimeout(() => this.connectAndKeepAlive(onChange), 20000));
            console.log('Keeping SW alive', new Date());
        } catch (err) {
            console.log('Unable to keep-alive', err);
        }
    }
}
