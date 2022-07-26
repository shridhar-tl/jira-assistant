import AjaxRequestService from './ajax-request-service';
import AjaxService from './ajax-service';
import AnalyticsService from './analytics-service';
import DevService from './browser-dev-service';
import AuthService from './auth-service';
import BookmarkService from './bookmark-service';
import CacheService from './cache-service';
import CalendarService from './calendar-service';
import ConfigService from './config-service';
import DashboardService from './dashboard-service';
import DatabaseService from './database-service';
import JiraUpdatesService from './jira-updates-service';
import JiraOAuthService from './jira-oauth-service';
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
import SettingsService from './settings-service';
import StorageService from './storage-service';
import { AjaxRequestProxyService, BrowserProxyService, StorageProxyService } from './proxy-service';
import { injectable, inject, injectProdBrowserServices } from './index.common';

export { inject };

let _isReady = false;
const useProxy = process.env.REACT_APP_WEB_BUILD === 'true';

// Any new classes injected should be added in index.d.ts file as well to support intellisense in VS Code.
export default function injectServices(authType) {
    const injectProxy = useProxy && authType === '1';
    injectable(injectProxy ? AjaxRequestProxyService : AjaxRequestService, "AjaxRequestService", "$request", { isSingleton: false });
    injectable(AjaxService, "AjaxService", "$ajax");
    injectable(AnalyticsService, "AnalyticsService", "$analytics", { isSingleton: false });
    if (injectProxy) {
        console.log("Proxy Browser service injected");
        injectable(BrowserProxyService, "AppBrowserService", "$jaBrowserExtn", { isSingleton: false });
    }
    else if (process.env.NODE_ENV === "production") {
        injectProdBrowserServices();
    }
    else {
        console.log("Browser service running in Dev mode");
        injectable(DevService, "AppBrowserService", "$jaBrowserExtn", { isSingleton: false });
    }
    injectable(AuthService, "AuthService", "$auth");
    injectable(BookmarkService, "BookmarkService", "$bookmark");
    injectable(CacheService, "CacheService", "$cache", { isSingleton: false });
    injectable(CalendarService, "CalendarService", "$calendar");
    injectable(ConfigService, "ConfigService", "$config");
    injectable(DashboardService, "DashboardService", "$dashboard");
    injectable(DatabaseService, "DatabaseService", "$db");
    injectable(JiraOAuthService, "JiraOAuthService", "$jAuth");
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
    injectable(injectProxy ? StorageProxyService : StorageService, "StorageService", "$storage", { isSingleton: false });
    injectable(SuggestionService, "SuggestionService", "$suggestion");
    injectable(TicketService, "TicketService", "$ticket");
    injectable(UserService, "UserService", "$user");
    injectable(UserGroupService, "UserGroupService", "$usergroup");
    injectable(UserUtilsService, "UserUtilsService", "$userutils");
    injectable(UtilsService, "UtilsService", "$utils");
    injectable(WorklogService, "WorklogService", "$worklog");
    _isReady = true;
}

export function readyToInject() { return _isReady; }