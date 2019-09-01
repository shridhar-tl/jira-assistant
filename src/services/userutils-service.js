export default class UserUtilsService {
    static dependencies = ["SessionService", "UtilsService"];

    constructor($session, $utils) {
        this.$session = $session;
        this.$utils = $utils;
    }

    getTicketUrl = (ticketNo) => {
        if (!ticketNo) {
            return;
        }
        return this.$session.CurrentUser.ticketViewUrl + ticketNo;
    }

    mapJiraUrl = (url) => {
        if (!url || (url.startsWith('http') && url.indexOf(':') > 3)) {
            return url;
        }
        if (!url.startsWith('/')) {
            url = `/${url}`;
        }
        return this.$session.CurrentUser.jiraUrl + url;
    }

    isHoliday = (date) => {
        const weekDay = date.getDay();
        const workingDays = this.$session.CurrentUser.workingDays;
        //ToDo: Need to have track of holiday and need to do the checking here
        return workingDays.indexOf(weekDay) === -1;
    }

    getProfileImgUrl = (user) => {
        if (user.jiraUser) {
            user = user.jiraUser;
        }
        if (user.avatarUrls) {
            return user.avatarUrls["48x48"] || user.avatarUrls["32x32"];
        }
        else {
            return `${this.$session.rootUrl}/secure/useravatar?ownerId=${user.name.toLowerCase()}`;
        }
        ///Security/ProfilePic / {{userInfo.name }}
    }

    getProfileUrl = (user, rootUrl) => {
        if (!user) {
            user = this.$session.CurrentUser;
        }

        if (typeof user === "object") {
            if (user.jiraUser) {
                user = user.jiraUser;
            }
            user = user.name;
        }
        else if (typeof user !== "string") {
            user = "";
        }

        return `${rootUrl || this.$session.rootUrl}/secure/ViewUser.jspa?name=${user.toLowerCase()}`;
    }

    formatDateTime = (value, format, utc) => {
        if (!value) { return value; }
        if (!format) { format = `${this.$session.CurrentUser.dateFormat} ${this.$session.CurrentUser.timeFormat}`; }
        let date = this.$utils.convertDate(value);
        if (date && date instanceof Date) {
            if (utc === true) {
                date = date.toUTCDate();
            }
            return date.format(format);
        }
        return date;
    }

    formatDate = (value, format, utc) => {
        if (!format) {
            format = this.$session.CurrentUser.dateFormat;
        }
        return this.formatDateTime(value, format, utc);
    }

    formatTime = (value, format, utc) => {
        return this.formatDateTime(value, format || this.$session.CurrentUser.timeFormat, utc);
    }

    getDays = (fromDate, toDate) => {
        const dateArr = this.$utils.getDateArray(fromDate, toDate);
        const now = new Date().getTime();
        return dateArr.map(d => {
            return {
                prop: d.format('yyyyMMdd'),
                display: d.format('DDD, dd'),
                date: d,
                isHoliday: this.isHoliday(d),
                isFuture: d.getTime() > now
            };
        });
    }

    getWorklogUrl(ticketNo, worklogId) {
        let url = this.getTicketUrl(ticketNo);
        if (url && worklogId) {
            // ToDo: pending implementation
        }
        url += `?focusedWorklogId=${worklogId}&page=com.atlassian.jira.plugin.system.issuetabpanels%3Aworklog-tabpanel#worklog-${worklogId}`;
        return url;
    }
}