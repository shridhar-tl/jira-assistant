import { injectable, inject } from './injector-service';
import AjaxService from './ajax-service';
import AnalyticsService from './analytics-service';
import ChromeService from './browser-chrome-service';
import FirefoxService from './browser-firefox-service';
import EdgeService from './browser-edge-service';
import DevService from './browser-dev-service';
import AuthService from './auth-service';
import BookmarkService from './bookmark-service';
import CacheService from './cache-service';
import CalendarService from './calendar-service';
import ConfigService from './config-service';
import DashboardService from './dashboard-service';
import DatabaseService from './database-service';
import JiraUpdatesService from './jira-updates-service';
import JiraService from './jira-service';
import MessageService from './message-service';
import NotificationService from './notification-service';
import OutlookCalendar from './outlook-service';
import QueueService from './queue-service';
import ReportService from './report-service';
import ReportConfigService from './reportconfig-service';
import SessionService from './session-service';
import SuggestionService from './suggestion-service';
import TicketService from './ticket-service';
import UserService from './user-service';
import UserGroupService from './usergroups-service';
import UserUtilsService from './userutils-service';
import UtilsService from './utils-service';
import WorklogService from './worklog-service';
import browsers from '../common/browsers';
import SettingsService from './settings-service';

export { inject };

// Any new classes injected should be added in index.d.ts file as well to support intellisense in VS Code.
export default function injectServices() {
    injectable(AjaxService, "AjaxService", "$ajax");
    injectable(AnalyticsService, "AnalyticsService", "$analytics");
    if (process.env.NODE_ENV === "production") {
        if (browsers.isChrome) {
            console.log("Chrome Browser service injected");
            injectable(ChromeService, "AppBrowserService", "$jaBrowserExtn");
        }
        else if (browsers.isFirefox) {
            console.log("Firefox Browser service injected");
            injectable(FirefoxService, "AppBrowserService", "$jaBrowserExtn");
        }
        else if (browsers.isEdge) {
            console.log("Edge Browser service injected");
            injectable(EdgeService, "AppBrowserService", "$jaBrowserExtn");
        }
    }
    else {
        console.log("Browser service running in Dev mode");
        injectable(DevService, "AppBrowserService", "$jaBrowserExtn");
    }
    injectable(AuthService, "AuthService", "$auth");
    injectable(BookmarkService, "BookmarkService", "$bookmark");
    injectable(CacheService, "CacheService", "$cache");
    injectable(CalendarService, "CalendarService", "$calendar");
    injectable(ConfigService, "ConfigService", "$config");
    injectable(DashboardService, "DashboardService", "$dashboard");
    injectable(DatabaseService, "DatabaseService", "$db");
    injectable(JiraService, "JiraService", "$jira");
    injectable(JiraUpdatesService, "JiraUpdatesService", "$jupdates");
    injectable(MessageService, "MessageService", "$message");
    injectable(NotificationService, "NotificationService", "$noti");
    injectable(OutlookCalendar, "OutlookService", "$outlook");
    injectable(QueueService, "QueueService", "$q", { isSingleton: false });
    injectable(ReportService, "ReportService", "$report");
    injectable(ReportConfigService, "ReportConfigService", "$reportConfig");
    injectable(SessionService, "SessionService", "$session");
    injectable(SettingsService, "SettingsService", "$settings");
    injectable(SuggestionService, "SuggestionService", "$suggestion");
    injectable(TicketService, "TicketService", "$ticket");
    injectable(UserService, "UserService", "$user");
    injectable(UserGroupService, "UserGroupService", "$usergroup");
    injectable(UserUtilsService, "UserUtilsService", "$userutils");
    injectable(UtilsService, "UtilsService", "$utils");
    injectable(WorklogService, "WorklogService", "$worklog");
}