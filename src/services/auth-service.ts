import { isExtnAccessDenied } from '@/common/proxy-helper';

import { getHostFromUrl, getUserName, parseIfJson, setStartOfWeek } from '@utils/helpers';

import type { User } from '@types';

import { DefaultUserDayWiseReportSettings } from '../constants/common';
import { sett_page_calendar } from '../constants/settings';

import type JiraService from './jira-service';
import type SessionService from './session-service';
import type SettingsService from './settings-service';
import type UserService from './user-service';

const pageSettingsPrefix = 'page_';
const atlassianCloudHostSuffix = '.atlassian.net';
const cloudDeploymentType = 'Cloud';

const defaultPageSettings: Record<string, object> = {
    calendar: sett_page_calendar,
    reports_UserDayWise: DefaultUserDayWiseReportSettings,
    reports_WorklogReport: {},
    reports_SayDoRatioReport: {},
};

/**
 * Settings of every page are stored with a "page_" prefix. All of them are loaded so that
 * settings of any report are restored without having to be registered here.
 */
function getPageSettingsMap(storedSettings: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = { ...defaultPageSettings };

    for (const [name, value] of Object.entries(storedSettings)) {
        if (name.startsWith(pageSettingsPrefix)) {
            const pageName = name.substring(pageSettingsPrefix.length);
            result[pageName] = parseIfJson(value, defaultPageSettings[pageName] ?? null);
        }
    }

    return result;
}

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

    /**
     * Jira Cloud sites can be on a custom domain. So deployment type of the instance is used
     * when the host is not an Atlassian domain.
     */
    private async isCloudInstance(): Promise<boolean> {
        if (getHostFromUrl(this.$session.rootUrl).endsWith(atlassianCloudHostSuffix)) {
            return true;
        }

        try {
            return (await this.$jira.getDeploymentType()) === cloudDeploymentType;
        } catch (err) {
            console.warn('Unable to identify the deployment type of Jira. It would be treated as Jira Data Center.', err);
            return false;
        }
    }

    async getUserDetails(userId?: number): Promise<User> {
        try {
            if (!userId) {
                userId = await this.$session.getCurrentUserId();
            }
        } catch (err) {
            if (isExtnAccessDenied(err)) {
                throw err;
            }
            console.error('JA: Unable to identify the current user. Integration is required.', err);
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
        this.$session.extnAccessDeniedReason = undefined;

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

            (userDetails as any).isAtlasCloud = await this.isCloudInstance();

            if (useProfile) {
                const jiraUser = await this.$jira.getCurrentUser();
                (userDetails as any).jiraUser = jiraUser;
                (userDetails as any).displayName = jiraUser.displayName || '(not available)';
                (userDetails as any).name = getUserName(jiraUser) || '(not available)';
                (userDetails as any).emailAddress = jiraUser.emailAddress || '(not available)';
            }

            userDetails.dashboards = await this.$settings.getDashboards(userId!);

            const settings = await this.$settings.getPageSettings(userId!);

            this.$session.pageSettings = getPageSettingsMap(settings);

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
            console.error('JA: Authentication failed:', res);

            if (isExtnAccessDenied(res)) {
                this.$session.needIntegration = false;
                this.$session.extnAccessDeniedReason = res.message;
                return false;
            }

            if (res?.status === 401) {
                return false;
            }

            this.$session.needIntegration = res?.needIntegration || false;
            return false;
        }

        return true;
    }
}
