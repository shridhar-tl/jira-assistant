import { SettingsCategory } from '../constants/settings';

export default class ConfigService {
    static dependencies = ["SessionService", "SettingsService"];

    constructor($session, $settings) {
        this.$session = $session;
        this.$settings = $settings;
    }

    saveSettings(pageName, newSettings) {
        if (newSettings === undefined) {
            newSettings = this.$session.pageSettings[pageName];
        } else {
            this.$session.pageSettings[pageName] = newSettings;
        }

        const name = `page_${pageName}`;
        return this.$settings.savePageSetting(this.$session.userId, name, newSettings);
    }

    updateAuthCode(authCode) {
        return this.$settings.saveSetting(this.$session.userId,
            SettingsCategory.General,
            'dataStore', authCode);
    }
}
