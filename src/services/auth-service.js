import * as moment from 'moment';

export default class AuthService {
    static dependencies = ["UserService", "CacheService", "SessionService", "JiraService"];
    constructor($user, $cache, $session, $jira) {
        this.$user = $user;
        this.$cache = $cache;
        this.$session = $session;
        this.$jira = $jira;
    }

    async getCurrentUser() {
        const user = await this.$user.getUser(this.$session.getCurrentUserId());
        this.rootUrl = user.jiraUrl;

        return user;
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
        return await this.getUserDetails(userId)
            .then(userDetails => {
                this.$session.CurrentUser = userDetails;
                this.$session.userId = userDetails.userId;
                this.$session.rootUrl = userDetails.jiraUrl;
                //ToDo:

                return this.$jira.getCurrentUser().then(jiraUser => {
                    userDetails.jiraUser = jiraUser;
                    userDetails.displayName = jiraUser.displayName || "(not available)";
                    userDetails.name = jiraUser.name || "(not available)";
                    userDetails.emailAddress = jiraUser.emailAddress || "(not available)";

                    this.$session.authenticated = true;
                    return userDetails;
                });
            })
            .then(userDetails => {
                const settings = userDetails.settings;

                this.$session.pageSettings = {
                    dashboard: this.parseIfJson(settings.page_dashboard, {
                        viewMode: 0,
                        gridList: ["myTickets", "bookmarksList", "dtWiseWL", "pendingWL"]
                    }),
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
                    reports_UserDayWise: this.parseIfJson(settings.page_reports_UserDayWise, { logFormat: '1', breakupMode: '1', groupMode: '1' })
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
            })
            .then(null, (res) => {
                this.$session.authenticated = false;
                if (res.status === 401) {
                    return false;
                }
                this.$session.needIntegration = res.needIntegration;

                return false;
            });
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