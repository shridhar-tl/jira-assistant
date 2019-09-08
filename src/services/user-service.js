import { dateFormats, timeFormats } from '../_constants';

export default class UserService {
    static dependencies = ["DatabaseService", "JiraService"];

    constructor($db, $jira) {
        this.$db = $db;
        this.$jira = $jira;
    }

    async getUser(userId) {
        const user = await this.$db.users.get(userId);
        if (user.commentLength === undefined) {
            user.commentLength = 5;
        }
        return user;
    }

    async saveUser(user) {
        return this.$db.users.put(user);
    }

    async getUsersList() {
        const users = await this.$db.users.where("id").notEqual(1).toArray();
        return users.map(u => { return { id: u.id, email: u.email, jiraUrl: u.jiraUrl, userId: u.userId }; });
    }

    async getUserDetails(userId) {
        const currentUser = await this.getUser(userId);

        const feedbackUrl = "https://docs.google.com/forms/d/e/1FAIpQLScJvQtHZI_yZr1xd4Z8TwWgvtFss33hW5nJp4gePCgI2ScNvg/viewform?entry.326955045&entry.1696159737&entry.485428648={0}&entry.879531967={1}&entry.1426640786={2}&entry.972533768={3}";
        if (!currentUser.settings) {
            currentUser.settings = {};
        }
        const settings = {
            page_dashboard: currentUser.settings.page_dashboard,
            page_calendar: currentUser.settings.page_calendar,
            page_reports_UserDayWise: currentUser.settings.page_reports_UserDayWise
        };
        let gridList = (settings.page_dashboard || {}).gridList;
        if (gridList && gridList.length > 0) {
            const converter = {
                'myTickets': 'myOpenTickets', 'bookmarksList': 'myBookmarks', 'dtWiseWL': 'dateWiseWorklog',
                'pendingWL': 'pendingWorklog', 'ticketWiseWL': 'ticketWiseWorklog', 'savedQuery': 'myFilters'
            };
            gridList = gridList.map(g => converter[g] || g);
        }
        else {
            gridList = ['myOpenTickets', 'myBookmarks', 'dateWiseWorklog', 'pendingWorklog'];
        }

        currentUser.jiraUrl = currentUser.jiraUrl.clearEnd('/');

        //this.$session.authTokken = currentUser.dataStore;
        const sessionUser = {
            userId: currentUser.id,
            dateFormat: currentUser.dateFormat || dateFormats[0],
            timeFormat: currentUser.timeFormat || timeFormats[0],
            workingDays: currentUser.workingDays || [1, 2, 3, 4, 5],
            startOfDay: currentUser.startOfDay || "10:00",
            endOfDay: currentUser.endOfDay || "19:00",
            notifyWL: currentUser.notifyWL,
            jiraUrl: currentUser.jiraUrl,
            ticketViewUrl: `${currentUser.jiraUrl}/browse/`,
            profileUrl: `${currentUser.jiraUrl}/secure/ViewProfile.jspa`,
            maxHours: currentUser.maxHours || 8,
            meetingTicket: currentUser.meetingTicket,
            team: currentUser.team || [],
            projects: currentUser.projects,
            rapidViews: currentUser.rapidViews,
            storyPointField: currentUser.storyPointField,
            epicNameField: currentUser.epicNameField,
            commentLength: currentUser.commentLength,
            startOfWeek: currentUser.startOfWeek,
            allowClosedTickets: currentUser.allowClosedTickets,
            settings: settings,
            autoUpload: currentUser.autoUpload,
            gIntegration: currentUser.googleIntegration,
            hasGoogleCreds: !!currentUser.dataStore,
            feedbackUrl: `${feedbackUrl}&embedded=true`,
            dashboards: currentUser.dashboards || [
                {
                    isQuickView: true, layout: 1, name: 'Default', icon: 'fa fa-tachometer',
                    widgets: gridList.map(g => { return { name: g }; })
                }
            ]
        };
        const jiraUrlLower = currentUser.jiraUrl.toLowerCase();

        if (jiraUrlLower.indexOf('pearson') >= 0 || jiraUrlLower.indexOf('emoneyadv') >= 0) {
            sessionUser.noDonations = true;
            sessionUser.hideDonateMenu = true;
        }
        else {
            delete sessionUser.noDonations;
            sessionUser.hideDonateMenu = currentUser.hideDonateMenu;
        }
        return sessionUser;
    }
}