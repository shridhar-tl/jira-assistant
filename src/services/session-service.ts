import type { SessionUser } from '@types';

import type SettingsService from './settings-service';

export default class SessionService {
    static dependencies = ['SettingsService'];

    private $settings: SettingsService;

    userId?: number;
    CurrentUser: Partial<SessionUser> = {};
    currentUser: Partial<SessionUser> = {};
    UserSettings: Record<string, any> = {};
    rootUrl = '';
    apiRootUrl = '';
    authenticated = false;
    needIntegration = false;
    pageSettings: Record<string, any> = {};
    isQuickView = false;

    constructor($settings: SettingsService) {
        this.$settings = $settings;
    }

    setPageSettings(value: Record<string, any>) {
        this.pageSettings = value;
    }

    async getCurrentUserId(): Promise<number> {
        let userId = this.userId;

        if (!userId) {
            userId = (await this.$settings.get('CurrentUserId')) as number;
            this.userId = userId;
        }

        if (!userId) {
            throw new Error('No user ID found - integration needed');
        }

        return userId;
    }

    clearSession(): void {
        this.userId = undefined;
        this.CurrentUser = {};
        this.currentUser = {};
        this.UserSettings = {};
        this.rootUrl = '';
        this.apiRootUrl = '';
        this.authenticated = false;
        this.needIntegration = false;
        this.pageSettings = {};
        this.isQuickView = false;
    }
}
