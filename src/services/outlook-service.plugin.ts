import { invoke } from '@forge/bridge';

import type AnalyticsService from './analytics-service';
import type MessageService from './message-service';
import OutlookCalendarBase from './outlook-service-base';
import type SessionService from './session-service';
import type SettingsService from './settings-service';

export default class OutlookCalendar extends OutlookCalendarBase {
    static dependencies = ['AnalyticsService', 'MessageService', 'SettingsService', 'SessionService'];

    private $settings: SettingsService;
    private userId: number;

    constructor($analytics: AnalyticsService, $message: MessageService, $settings: SettingsService, $session: SessionService) {
        super($analytics, $message);
        this.$settings = $settings;
        this.userId = $session.CurrentUser.userId!;
    }

    async authenticate(): Promise<any> {
        const result = await invoke('AuthenticateMSO', {});

        if (result) {
            await this.$settings.saveGeneralSetting(this.userId, 'OLBT', true);
        }

        return result;
    }

    fetchEvents(eventsUrl: string): Promise<any> {
        return invoke('GetMSOEvents', { eventsUrl });
    }
}
