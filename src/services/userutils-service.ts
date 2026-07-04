import { differenceInDays, formatDate, getDateArray, getUserName, mergeUrl, viewIssueUrl } from '@utils';

import type { JiraUser, User } from '@types';

import type SessionService from './session-service';
import type UtilsService from './utils-service';

// Default working days: Monday(1) to Friday(5)
const DefaultWorkingDays = [1, 2, 3, 4, 5];

export interface DayInfo {
    prop: string;
    display: string;
    date: Date;
    isHoliday: boolean;
    isFuture: boolean;
}

export default class UserUtilsService {
    static dependencies = ['SessionService', 'UtilsService'];

    private $session: SessionService;
    private $utils: UtilsService;

    constructor($session: SessionService, $utils: UtilsService) {
        this.$session = $session;
        this.$utils = $utils;
    }

    getTicketUrl = (ticketNo: string): string | undefined => {
        const jiraUrl = this.$session.CurrentUser?.jiraUrl;
        if (!jiraUrl) return undefined;
        return viewIssueUrl(jiraUrl, ticketNo);
    };

    mapJiraUrl = (url: string): string => {
        const jiraUrl = this.$session.CurrentUser?.jiraUrl;
        if (!jiraUrl) return url;
        return mergeUrl(jiraUrl, url);
    };

    isHoliday = (date: Date): boolean => {
        const weekDay = date.getDay();
        const workingDays = this.$session.CurrentUser?.workingDays || DefaultWorkingDays;
        return workingDays.indexOf(weekDay) === -1;
    };

    getProfileImgUrl = (user: User | { jiraUser?: User }): string => {
        let u = user as any;
        if (u.jiraUser) {
            u = u.jiraUser;
        }

        if (u.avatarUrls) {
            return u.avatarUrls['48x48'] || u.avatarUrls['32x32'];
        }

        const rootUrl = this.$session.rootUrl || '';
        const username = getUserName(u, true);
        return `${rootUrl}/secure/useravatar?ownerId=${username}`;
    };

    getProfileUrl = (user?: User | JiraUser | { jiraUser?: User } | string, rootUrl?: string): string => {
        let u: any = user;

        if (!u) {
            u = this.$session.CurrentUser;
        }

        if (typeof u === 'object' && u.jiraUser) {
            u = u.jiraUser;
        }

        const root = rootUrl || this.$session.rootUrl || '';

        if (this.$session.CurrentUser?.isAtlasCloud) {
            const accountId = typeof u === 'string' ? u : u?.accountId;
            return `${root}/jira/people/${accountId}`;
        }

        const username = typeof u === 'string' ? u : getUserName(u, true) || '';
        return `${root}/secure/ViewUser.jspa?name=${username}`;
    };

    formatDateTime = (value: Date | string | number, format?: string, utc?: boolean): string => {
        if (!value) return String(value);

        const defaultFormat = `${this.$session.CurrentUser?.dateFormat || 'dd/MMM/yy'} ${this.$session.CurrentUser?.timeFormat || 'HH:mm'}`;
        const fmt = format || defaultFormat;

        let date = this.$utils.convertDate(value);

        if (!(date instanceof Date)) {
            return String(value);
        }

        if (utc) {
            date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        }

        const lowerFmt = fmt?.toLowerCase();
        if (lowerFmt === 'quick') {
            return this.getRelativeTime(date);
        }

        if (lowerFmt === 'num') {
            const now = new Date();
            return String(differenceInDays(now, date));
        }

        return formatDate(date, fmt);
    };

    formatDate = (value: Date | string | number, format?: string, utc?: boolean): string => {
        const fmt = format || this.$session.CurrentUser?.dateFormat || 'dd/MMM/yy';
        return this.formatDateTime(value, fmt, utc);
    };

    formatTime = (value: Date | string | number, format?: string, utc?: boolean): string => {
        const fmt = format || this.$session.CurrentUser?.timeFormat || 'HH:mm';
        return this.formatDateTime(value, fmt, utc);
    };

    private getRelativeTime(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffSecs < 60) {
            return diffSecs === 1 ? 'a second ago' : `${diffSecs} seconds ago`;
        }
        if (diffMins < 60) {
            return diffMins === 1 ? 'a minute ago' : `${diffMins} minutes ago`;
        }
        if (diffHours < 24) {
            return diffHours === 1 ? 'an hour ago' : `${diffHours} hours ago`;
        }
        if (diffDays < 30) {
            return diffDays === 1 ? 'a day ago' : `${diffDays} days ago`;
        }
        if (diffMonths < 12) {
            return diffMonths === 1 ? 'a month ago' : `${diffMonths} months ago`;
        }
        return diffYears === 1 ? 'a year ago' : `${diffYears} years ago`;
    }

    getDays(fromDate: Date, toDate: Date): DayInfo[] {
        const dateArr = getDateArray(fromDate, toDate);
        const now = new Date().getTime();

        return dateArr.map((d: any) => ({
            prop: formatDate(d, 'yyyyMMdd'),
            display: formatDate(d, 'DDD, dd'),
            date: d,
            isHoliday: this.isHoliday(d),
            isFuture: d.getTime() > now,
        }));
    }

    getWorklogUrl = (ticketNo: string, worklogId: number | string): string => {
        let url = this.getTicketUrl(ticketNo) || '';
        if (url && worklogId) {
            url += `?focusedWorklogId=${worklogId}&page=com.atlassian.jira.plugin.system.issuetabpanels%3Aworklog-tabpanel#worklog-${worklogId}`;
        }
        return url;
    };
}
