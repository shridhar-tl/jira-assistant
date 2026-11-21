import { EDGE_STORE_URL } from '../constants/urls';

import ChromeBrowserService from './browser-chrome-service';
import { extractAccessToken, getGoogleCalendarAuthUrl } from './google-web-auth';

interface GoogleAuthOptions {
    interactive?: boolean;
}

// Edge does not support chrome.identity.getAuthToken. Hence Google sign-in uses the web auth flow.
export default class EdgeBrowserService extends ChromeBrowserService {
    async getAuthToken(options: GoogleAuthOptions): Promise<string> {
        const redirectUri = await this.launchWebAuthFlow({
            interactive: options.interactive === true,
            url: getGoogleCalendarAuthUrl(this.getRedirectUrl()),
        });
        const accessToken = redirectUri ? extractAccessToken(redirectUri) : null;
        if (!accessToken) {
            throw new Error('Google Calendar authentication failed');
        }
        return accessToken;
    }

    getStoreUrl(): string {
        return EDGE_STORE_URL;
    }
}
