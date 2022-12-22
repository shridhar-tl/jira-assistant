import * as moment from 'moment';
import { getUserName } from '../common/utils';
import { sett_page_calendar, sett_page_reports_UserDayWise } from '../constants/settings';

export default class AuthService {
    static dependencies = ["UserService", "SettingsService", "SessionService", "JiraService"];
    constructor($user, $settings, $session, $jira) {
        this.$user = $user;
        this.$settings = $settings;
        this.$session = $session;
        this.$jira = $jira;
    }

    async getUserDetails(userId) {
        try {
            if (!userId) {
                userId = await this.$session.getCurrentUserId();
            }
        }
        catch (ex) {
            return Promise.reject({ needIntegration: true });
        }
        return await this.$user.getUserDetails(userId);
    }

    async authenticate(userId, useProfile = true) {
        let userDetails;

        try {
            userDetails = await this.getUserDetails(userId);
            userId = userDetails.userId;

            // ToDo: Remove once all the CurrentUser instances are changed to use new settings
            const userSettings = await this.$settings.getGeneralSettings(userId);
            const advSettings = await this.$settings.getAdvancedSettings(userId);
            userDetails = { ...userDetails, ...userSettings, ...advSettings };

            this.$session.CurrentUser = userDetails;
            this.$session.UserSettings = userSettings;
            this.$session.userId = userId;
            this.$session.rootUrl = (userDetails.jiraUrl || "").toString();
            if (userDetails.apiUrl) {
                this.$session.apiRootUrl = (userDetails.apiUrl || "").toString();
            }

            if (useProfile) {
                const jiraUser = await this.$jira.getCurrentUser();
                userDetails.jiraUser = jiraUser;
                userDetails.displayName = jiraUser.displayName || "(not available)";
                userDetails.name = getUserName(jiraUser) || "(not available)";
                userDetails.emailAddress = jiraUser.emailAddress || "(not available)";
            }

            this.$session.authenticated = true;
        } catch (res) {
            this.$session.authenticated = false;
            if (res.status === 401) {
                return false;
            }
            this.$session.needIntegration = res.needIntegration;

            return false;
        }

        userDetails.dashboards = await this.$settings.getDashboards(userId);

        const settings = await this.$settings.getPageSettings(userId);

        this.$session.pageSettings = {
            /* Need to check if this is used anywhere. If not good to clear
            dashboard: this.parseIfJson(settings.page_dashboard, {
                viewMode: 0,
                gridList: ["myOpenTickets", "myBookmarks", "dateWiseWorklog", "pendingWorklog"]
            }),*/
            calendar: this.parseIfJson(settings.page_calendar, sett_page_calendar),
            reports_UserDayWise: this.parseIfJson(
                settings.page_reports_UserDayWise,
                sett_page_reports_UserDayWise
            ),
            reports_WorklogReport: this.parseIfJson(settings.page_reports_WorklogReport, {})
        };

        let lastVisisted = await this.$settings.get('LV');
        if (lastVisisted) {
            lastVisisted = moment(lastVisisted);
            if (moment().startOf('day').isAfter(lastVisisted)) {
                await this.$settings.set('LastVisited', lastVisisted.toDate());
            }
        }

        await this.$settings.set('LV', new Date());

        return true;
    }

    parseIfJson(json, dflt) {
        if (json) {
            if (typeof json === "string") {
                return JSON.parse(json);
            }
            else {
                return json;
            }
        }
        else {
            return dflt;
        }
    }
}