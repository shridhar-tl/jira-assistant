import AjaxRequestService from './ajax-request-service';
import AjaxService from './ajax-service';
import AnalyticsService from './analytics-service';
import AuthService from './auth-service';
import BackupService from './backup-service';
import ChromeService from './browser-chrome-service';
import FirefoxService from './browser-firefox-service';
import EdgeService from './browser-edge-service';
import DevService from './browser-dev-service';
import BookmarkService from './bookmark-service';
import CacheService from './cache-service';
import CalendarService from './calendar-service';
import ConfigService from './config-service';
import DashboardService from './dashboard-service';
import JiraAuthService from './jira-oauth-service';
import JiraService from './jira-service';
import JiraUpdatesService from './jira-updates-service';
import MessageService from './message-service';
import NotificationService from './notification-service';
import OutlookOAuthService from './outlook-oauth-service';
import OutlookCalendar from './outlook-service';
import QueueService from './queue-service';
import ReportService from './report-service';
import ReportConfigService from './reportconfig-service';
import SessionService from './session-service';
import SettingsService from './settings-service';
import StorageService from './storage-service';
import TicketService from './ticket-service';
import UserService from './user-service';
import UserGroupService from './usergroups-service';
import UserUtilsService from './userutils-service';
import UtilsService from './utils-service';
import WorklogService from './worklog-service';
import WorklogTimerService from './worklog-timer-service';

export interface IServicesList {
    $request: AjaxRequestService
    $ajax: AjaxService
    $analytics: AnalyticsService
    $auth: AuthService
    $backup: BackupService
    $bookmark: BookmarkService
    $jaBrowserExtn: ChromeService | FirefoxService | EdgeService | DevService
    $cache: CacheService
    $calendar: CalendarService
    $config: ConfigService
    $dashboard: DashboardService
    $jAuth: JiraAuthService
    $jira: JiraService
    $jupdates: JiraUpdatesService
    $message: MessageService
    $noti: NotificationService
    $msoAuth: OutlookOAuthService
    $outlook: OutlookCalendar
    $q: QueueService
    $report: ReportService
    $session: SessionService
    $settings: SettingsService
    $storage: StorageService
    $ticket: TicketService
    $user: UserService
    $usergroup: UserGroupService
    $userutils: UserUtilsService
    $utils: UtilsService
    $worklog: WorklogService
    $wltimer: WorklogTimerService
}

export function useService(...svc: string): IServicesList {
    //
}

export function inject(obj?: any, ...svc: string): IServicesList {
    //
}