import * as moment from 'moment';
import { getUserName } from '../common/utils';

export default class AuthService {
    static dependencies = ["UserService", "CacheService", "SessionService", "JiraService", 'SettingsService'];
    constructor($user, $cache, $session, $jira, $settings) {
        this.$user = $user;
        this.$cache = $cache;
        this.$session = $session;
        this.$jira = $jira;
        this.$settings = $settings;
    }

    async getUserDetails(userId) {
        try {
            if (!userId) {
                userId = this.$session.getCurrentUserId();
            }
        }
        catch (ex) {
            return Promise.reject({ needIntegration: true });
        }
        return await this.$user.getUserDetails(userId);
    }

    async authenticate(userId) {
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

            const jiraUser = await this.$jira.getCurrentUser();
            userDetails.jiraUser = jiraUser;
            userDetails.displayName = jiraUser.displayName || "(not available)";
            userDetails.name = getUserName(jiraUser) || "(not available)";
            userDetails.emailAddress = jiraUser.emailAddress || "(not available)";

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
            calendar: this.parseIfJson(settings.page_calendar, {
                viewMode: 'timeGridWeek',
                showWorklogs: true,
                showMeetings: true,
                showInfo: true,
                eventColor: '#51b749',
                worklogColor: '#9a9cff',
                infoColor_valid: '#3a87ad',
                infoColor_less: '#f0d44f',
                infoColor_high: '#f06262'
            }),
            reports_UserDayWise: this.parseIfJson(
                settings.page_reports_UserDayWise,
                { logFormat: '1', breakupMode: '1', groupMode: '1' }
            )
        };

        let lastVisisted = this.$cache.get("LV");
        if (lastVisisted) {
            lastVisisted = moment(lastVisisted);
            if (moment().startOf('day').isAfter(lastVisisted)) {
                this.$cache.set("LastVisited", lastVisisted.toDate());
            }
        }
        this.$cache.set("LV", new Date());

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