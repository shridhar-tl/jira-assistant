import { getHostFromUrl, getUserName, parseIfJson, setStartOfWeek } from '@utils/helpers';

import type { User } from '@types';

import { DefaultCalendarSettings, DefaultUserDayWiseReportSettings } from '../constants/common';

import type JiraService from './jira-service';
import type SessionService from './session-service';
import type SettingsService from './settings-service';
import type UserService from './user-service';

export default class AuthService {
    static dependencies = ['UserService', 'SettingsService', 'SessionService', 'JiraService'];

    private $user: UserService;
    private $settings: SettingsService;
    private $session: SessionService;
    private $jira: JiraService;
    private authInProgress?: Promise<boolean>;
    private authInProgressFor?: number;

    constructor($user: UserService, $settings: SettingsService, $session: SessionService, $jira: JiraService) {
        this.$user = $user;
        this.$settings = $settings;
        this.$session = $session;
        this.$jira = $jira;
    }

    async getUserDetails(userId?: number): Promise<User> {
        try {
            if (!userId) {
                userId = await this.$session.getCurrentUserId();
            }
        } catch {
            return Promise.reject({ needIntegration: true });
        }

        return await this.$user.getUserDetails(userId);
    }

    authenticate(userId?: number, useProfile = true): Promise<boolean> {
        const sameRequest = userId === undefined || this.authInProgressFor === undefined || this.authInProgressFor === userId;

        if (!this.authInProgress || !sameRequest) {
            this.authInProgressFor = userId;
            this.authInProgress = this.runAuthenticate(userId, useProfile).finally(() => {
                this.authInProgress = undefined;
                this.authInProgressFor = undefined;
            });
        }

        return this.authInProgress;
    }

    private async runAuthenticate(userId?: number, useProfile = true): Promise<boolean> {
        let userDetails: any;

        try {
            userDetails = await this.getUserDetails(userId);
            userId = userDetails.userId; // ToDo: ToCheck: Whether userId or id to be used is to be validated

            // ToDo: Remove once all the CurrentUser instances are changed to use new settings
            const userSettings = await this.$settings.getGeneralSettings(userId!);
            const advSettings = await this.$settings.getAdvancedSettings(userId!);
            userDetails = { ...userDetails, ...userSettings, ...advSettings };

            this.$session.CurrentUser = userDetails;
            this.$session.UserSettings = userSettings;

            if (userSettings.startOfWeek) {
                setStartOfWeek(userSettings.startOfWeek);
            }
            this.$session.userId = userId;
            this.$session.rootUrl = (userDetails.jiraUrl || '').toString();

            if (userDetails.apiUrl) {
                this.$session.apiRootUrl = (userDetails.apiUrl || '').toString();
            }

            (userDetails as any).isAtlasCloud = getHostFromUrl(this.$session.rootUrl).endsWith('.atlassian.net');

            if (useProfile) {
                const jiraUser = await this.$jira.getCurrentUser();
                (userDetails as any).jiraUser = jiraUser;
                (userDetails as any).displayName = jiraUser.displayName || '(not available)';
                (userDetails as any).name = getUserName(jiraUser) || '(not available)';
                (userDetails as any).emailAddress = jiraUser.emailAddress || '(not available)';
            }

            userDetails.dashboards = await this.$settings.getDashboards(userId!);

            const settings = await this.$settings.getPageSettings(userId!);

            this.$session.pageSettings = {
                calendar: parseIfJson(settings.page_calendar, DefaultCalendarSettings),
                reports_UserDayWise: parseIfJson(settings.page_reports_UserDayWise, DefaultUserDayWiseReportSettings),
                reports_WorklogReport: parseIfJson(settings.page_reports_WorklogReport, {}),
                reports_SayDoRatioReport: parseIfJson(settings.page_reports_SayDoRatioReport, {}),
            };

            const lastVisited = await this.$settings.get('LV');

            if (lastVisited) {
                const lastVisitedDate = new Date(lastVisited);
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                if (todayStart > lastVisitedDate) {
                    await this.$settings.set('LastVisited', lastVisitedDate);
                }
            }

            await this.$settings.set('LV', new Date());

            this.$session.authenticated = true;
        } catch (res: any) {
            this.$session.authenticated = false;

            if (res?.status === 401) {
                return false;
            }

            this.$session.needIntegration = res?.needIntegration || false;
            return false;
        }

        return true;
    }
}
