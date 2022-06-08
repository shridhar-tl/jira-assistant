import { SettingsCategory } from '../_constants';

export default class ConfigService {
    static dependencies = ["SessionService", "AuthService", "SettingsService"];

    constructor($session, $auth, $settings) {
        this.$session = $session;
        this.$auth = $auth;
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

    /* ToDo: Not sure if removing this would have impact
    async getUserSettings() {
        return {
            settings: settings,
            dateFormats: dateFormats.map((f) => { return { value: f, text: this.$utils.formatDate(curDate, f) }; }),
            timeFormats: timeFormats.map((f) => { return { value: f, text: this.$utils.formatDate(curDate, f) }; })
        };
    }*/
}
