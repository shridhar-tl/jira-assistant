import { BROWSER_NAME } from '@/common/browsers';
import { CHROME_WS_URL, StoreUrls } from '@/constants';

import BrowserBase from './browser-base';

export default class WebBrowserService extends BrowserBase {
    private chrome: any;

    constructor() {
        super();
        this.chrome = (window as any)['chrome'];
    }

    getCurrentUrl(): Promise<string> {
        return Promise.resolve('');
    }

    getCurrentTab(): Promise<any> {
        return new Promise((resolve, reject) => {
            // This function is for private use
        });
    }

    replaceTabUrl(url: string): Promise<any> {
        return this.getCurrentTab().then((tab) => {
            // This function is for private use
        });
    }

    openTab(url: string, name?: string, opts?: string): void {
        window.open(url, name, opts);
    }

    getAuthToken(options: any): Promise<string> {
        const REDIRECT_URL = (window as any)['browser'].identity.getRedirectURL();
        const CLIENT_ID = '692513716183-jm587gc534dvsere4qhnk5bj68pql3p9.apps.googleusercontent.com';
        const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
        const AUTH_URL = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(
            REDIRECT_URL,
        )}&scope=${encodeURIComponent(SCOPES.join(' '))}`;
        //REVISIT: const VALIDATION_BASE_URL = "https://www.googleapis.com/oauth2/v3/tokeninfo"; // ToDo: Check why this URL is used
        return (window as any)['browser'].identity
            .launchWebAuthFlow({
                interactive: options.interactive,
                url: AUTH_URL,
            })
            .then((tokken: string) => this.extractAccessToken(tokken));
    }

    getRedirectUrl(endpoint?: string): string {
        //ToDo: need to implement
        return this.chrome.identity.getRedirectURL(endpoint);
    }

    launchWebAuthFlow(options: any): Promise<string> {
        return new Promise((resolve) => {
            this.chrome.identity.launchWebAuthFlow(options, resolve);
        });
    }

    removeAuthToken(authToken: string): void {
        (window as any)['browser'].identity.removeCachedAuthToken({ token: authToken }, () => {});
    }

    getStoreUrl(forRating?: boolean): string {
        return StoreUrls[BROWSER_NAME] || CHROME_WS_URL;
    }

    extractAccessToken(redirectUri: string): string | null {
        // This function is for private use
        const m = redirectUri.match(/[#?](.*)/);
        if (!m || m.length < 1) {
            return null;
        }
        const params = new URLSearchParams(m[1].split('#')[0]);
        return params.get('access_token');
    }
}
