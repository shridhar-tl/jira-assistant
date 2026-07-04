import { SettingsCategory } from '@/constants';

import type SessionService from './session-service';
import type SettingsService from './settings-service';

export default class ConfigService {
    static dependencies = ['SessionService', 'SettingsService'];

    private $session: SessionService;
    private $settings: SettingsService;

    constructor($session: SessionService, $settings: SettingsService) {
        this.$session = $session;
        this.$settings = $settings;
    }

    saveSettings(pageName: string, newSettings?: any): Promise<void> {
        if (!this.$session.userId) {
            return Promise.reject(new Error('No user ID available'));
        }

        const settings = newSettings !== undefined ? newSettings : this.$session.pageSettings[pageName];

        if (newSettings !== undefined) {
            this.$session.pageSettings[pageName] = newSettings;
        }

        const name = `page_${pageName}`;
        return this.$settings.savePageSetting(this.$session.userId, name, settings);
    }

    updateAuthCode(authCode: any): Promise<void> {
        if (!this.$session.userId) {
            return Promise.reject(new Error('No user ID available'));
        }

        return this.$settings.saveSetting(this.$session.userId, SettingsCategory.General as any, 'dataStore', authCode);
    }
}
