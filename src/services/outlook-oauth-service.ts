import { outlookTokenExchangeUrl } from '@/constants';

import type AjaxRequestService from './ajax-request-service';
import type SettingsService from './settings-service';

export default class OutlookOAuthService {
    static dependencies = ['AjaxRequestService', 'SettingsService'];

    private $request: AjaxRequestService;
    private $settings: SettingsService;

    constructor($request: AjaxRequestService, $settings: SettingsService) {
        this.$request = $request;
        this.$settings = $settings;
    }

    async getActiveToken(userId: number): Promise<string | false> {
        const sett = await this.$settings.getGeneralSetting(userId, 'OLBT');

        if (sett) {
            const { token, expires } = sett;
            if (expires > new Date().getTime() + 5000) {
                return token;
            } else {
                console.warn('Outlook: Access token expired by ', new Date(expires));
                const ref_sett = await this.$settings.getGeneralSetting(userId, 'OLRT');
                if (ref_sett) {
                    return this.getAndSaveToken(undefined, ref_sett, userId);
                } else {
                    console.error('Outlook: Refresh token not found');
                    return false;
                }
            }
        } else {
            console.warn('Outlook: Access token not found');
            return false;
        }
    }

    async getAndSaveToken(authCode?: string, refreshToken?: string, userId?: number): Promise<string> {
        let result: any;

        try {
            console.log('Outlook: Trying to generate access token');
            result = await this.$request.execute(
                'GET',
                outlookTokenExchangeUrl,
                null,
                authCode
                    ? { withCredentials: false, 'outlook-auth-code': authCode }
                    : { withCredentials: false, 'outlook-refresh-token': refreshToken },
            );
        } catch (ex) {
            console.error('Outlook: Error generating outlook access token', ex);
            throw ex;
        }

        const { success, message, token, refresh_token, expires_at: expires } = result;

        if (success) {
            console.log('Outlook: New access token generated successfully');
            await this.saveTokenData(userId!, token, expires, refresh_token);
        } else {
            console.error('Outlook Auth failed: ', message);
        }

        return token;
    }

    async saveTokenData(userId: number, token: string, expires: number, refresh_token: string): Promise<void> {
        await this.$settings.saveGeneralSetting(userId, 'OLBT', { token, expires });
        await this.$settings.saveGeneralSetting(userId, 'OLRT', refresh_token);
    }
}
