import AjaxService from './ajax-service';
import AnalyticsService from './analytics-service';
import AuthService from './auth-service';
import BackupService from './backup-service';
import BookmarkService from './bookmark-service';
import CacheService from './cache-service';
import CalendarService from './calendar-service';
import ConfigService from './config-service';
import DashboardService from './dashboard-service';
import DatabaseService from './database-service';
import JiraUpdatesService from './jira-updates-service';
import JiraAuthService from './jira-oauth-service';
import JiraService from './jira-service';
import MessageService from './message-service';
import NotificationService from './notification-service';
import OutlookOAuthService from './outlook-oauth-service';
import OutlookCalendar from './outlook-service';
import QueueService from './queue-service';
import ReportService from './report-service';
import ReportConfigService from './reportconfig-service';
import SessionService from './session-service';
import TicketService from './ticket-service';
import UserService from './user-service';
import UserGroupService from './usergroups-service';
import UserUtilsService from './userutils-service';
import UtilsService from './utils-service';
import WorklogService from './worklog-service';
import WorklogTimerService from './worklog-timer-service';
import SettingsService from './settings-service';
import { injectable, AnalyticsServiceFake } from './index.common';
import { isPluginBuild } from '../constants/build-info';
import config from '../customize';

let _commonInjected = false;

const allowAnalytics = !isPluginBuild && config.features.common.analytics !== false;

// Any new classes injected should be added in index.d.ts file as well to support intellisense in VS Code.
// IMPORTANT - As of now all services are singleton only unless explicitely marked false
export default function registerServices() {
    if (_commonInjected) { return; }

    injectable(AjaxService, "AjaxService", "$ajax");

    if (allowAnalytics) {
        injectable(AnalyticsService, "AnalyticsService", "$analytics", { isSingleton: true });
    } else {
        injectable(AnalyticsServiceFake, "AnalyticsService", "$analytics", { isSingleton: true });
    }

    injectable(AuthService, "AuthService", "$auth");
    injectable(BackupService, "BackupService", "$backup");
    injectable(BookmarkService, "BookmarkService", "$bookmark");
    injectable(CacheService, "CacheService", "$cache", { isSingleton: true });
    injectable(CalendarService, "CalendarService", "$calendar");
    injectable(ConfigService, "ConfigService", "$config");
    injectable(DashboardService, "DashboardService", "$dashboard");
    injectable(DatabaseService, "DatabaseService", "$db", { isSingleton: true });
    injectable(JiraAuthService, "JiraAuthService", "$jAuth", { isSingleton: true });
    injectable(JiraService, "JiraService", "$jira");
    injectable(JiraUpdatesService, "JiraUpdatesService", "$jupdates");
    injectable(MessageService, "MessageService", "$message", { isSingleton: true, retain: true }); // Message service instance should be retained
    injectable(NotificationService, "NotificationService", "$noti", { isSingleton: true });
    injectable(OutlookOAuthService, "OutlookOAuthService", "$msoAuth");
    injectable(OutlookCalendar, "OutlookService", "$outlook");
    injectable(QueueService, "QueueService", "$q", { isSingleton: false });
    injectable(ReportService, "ReportService", "$report");
    injectable(ReportConfigService, "ReportConfigService", "$reportConfig");
    injectable(SessionService, "SessionService", "$session");
    injectable(SettingsService, "SettingsService", "$settings", { isSingleton: true });
    injectable(TicketService, "TicketService", "$ticket");
    injectable(UserService, "UserService", "$user", { isSingleton: true });
    injectable(UserGroupService, "UserGroupService", "$usergroup");
    injectable(UserUtilsService, "UserUtilsService", "$userutils");
    injectable(UtilsService, "UtilsService", "$utils", { isSingleton: true });
    injectable(WorklogService, "WorklogService", "$worklog");
    injectable(WorklogTimerService, "WorklogTimerService", "$wltimer", { isSingleton: true });

    _commonInjected = true;
}