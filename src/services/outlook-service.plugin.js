import { invoke } from '@forge/bridge';
import OutlookCalendarBase from "./outlook-service-base";

export default class OutlookCalendar extends OutlookCalendarBase {
    static dependencies = ['AnalyticsService', 'MessageService', 'SettingsService', 'SessionService'];

    constructor($analytics, $message, $settings, $session) {
        super($analytics, $message);
        this.$settings = $settings;
        this.userId = $session.CurrentUser.userId;
    }

    async authenticate() {
        const result = await invoke('AuthenticateMSO', {});

        if (result) {
            await this.$settings.saveGeneralSetting(this.userId, 'OLBT', true);
        }

        return result;
    }

    fetchEvents(eventsUrl) {
        return invoke('GetMSOEvents', { eventsUrl });
    }
}