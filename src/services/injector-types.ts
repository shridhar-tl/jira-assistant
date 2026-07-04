import type AjaxRequestService from './ajax-request-service';
import type AjaxService from './ajax-service';
import type AnalyticsService from './analytics-service';
import type AppBrowserService from './app-browser-service';
import type AuthService from './auth-service';
import type BackupService from './backup-service';
import type BookmarkService from './bookmark-service';
import type CacheService from './cache-service';
import type CalendarService from './calendar-service';
import type ConfigService from './config-service';
import type DashboardService from './dashboard-service';
import type DatabaseService from './database-service';
import type JiraAuthService from './jira-oauth-service';
import type JiraService from './jira-service';
import type JiraUpdatesService from './jira-updates-service';
import type MessageService from './message-service';
import type NotificationService from './notification-service';
import type OutlookOAuthService from './outlook-oauth-service';
import type OutlookCalendar from './outlook-service';
import type QueueService from './queue-service';
import type ReportService from './report-service';
import type ReportConfigService from './reportconfig-service';
import type SessionService from './session-service';
import type SettingsService from './settings-service';
import type SprintService from './sprint-service';
import type StorageService from './storage-service';
import type TicketService from './ticket-service';
import type UserService from './user-service';
import type UserGroupService from './usergroups-service';
import type UserUtilsService from './userutils-service';
import type UtilsService from './utils-service';
import type WorklogService from './worklog-service';
import type WorklogTimerService from './worklog-timer-service';

export type ServiceTypes =
    | 'AjaxRequestService'
    | 'AjaxService'
    | 'AnalyticsService'
    | 'AppBrowserService'
    | 'AuthService'
    | 'BackupService'
    | 'BookmarkService'
    | 'CacheService'
    | 'CalendarService'
    | 'ConfigService'
    | 'DashboardService'
    | 'DatabaseService'
    | 'JiraAuthService'
    | 'JiraService'
    | 'JiraUpdatesService'
    | 'MessageService'
    | 'NotificationService'
    | 'OutlookOAuthService'
    | 'OutlookService'
    | 'QueueService'
    | 'ReportConfigService'
    | 'ReportService'
    | 'SessionService'
    | 'SettingsService'
    | 'SprintService'
    | 'StorageService'
    | 'TicketService'
    | 'UserGroupService'
    | 'UserService'
    | 'UserUtilsService'
    | 'UtilsService'
    | 'WorklogService'
    | 'WorklogTimerService';

export interface ServiceReference {
    $request: AjaxRequestService;
    $ajax: AjaxService;
    $analytics: AnalyticsService;
    $jaBrowserExtn: AppBrowserService;
    $browser: AppBrowserService;
    $auth: AuthService;
    $backup: BackupService;
    $bookmark: BookmarkService;
    $cache: CacheService;
    $calendar: CalendarService;
    $config: ConfigService;
    $dashboard: DashboardService;
    $db: DatabaseService;
    $jAuth: JiraAuthService;
    $jira: JiraService;
    $jupdates: JiraUpdatesService;
    $message: MessageService;
    $noti: NotificationService;
    $msoAuth: OutlookOAuthService;
    $outlook: OutlookCalendar;
    $q: QueueService;
    $reportConfig: ReportConfigService;
    $report: ReportService;
    $session: SessionService;
    $settings: SettingsService;
    $sprint: SprintService;
    $storage: StorageService;
    $ticket: TicketService;
    $usergroup: UserGroupService;
    $user: UserService;
    $userutils: UserUtilsService;
    $utils: UtilsService;
    $worklog: WorklogService;
    $wltimer: WorklogTimerService;
}

type ServiceNameToRef = {
    AjaxRequestService: '$request';
    AjaxService: '$ajax';
    AnalyticsService: '$analytics';
    AppBrowserService: '$jaBrowserExtn';
    AuthService: '$auth';
    BackupService: '$backup';
    BookmarkService: '$bookmark';
    CacheService: '$cache';
    CalendarService: '$calendar';
    ConfigService: '$config';
    DashboardService: '$dashboard';
    DatabaseService: '$db';
    JiraAuthService: '$jAuth';
    JiraService: '$jira';
    JiraUpdatesService: '$jupdates';
    MessageService: '$message';
    NotificationService: '$noti';
    OutlookOAuthService: '$msoAuth';
    OutlookService: '$outlook';
    QueueService: '$q';
    ReportConfigService: '$reportConfig';
    ReportService: '$report';
    SessionService: '$session';
    SettingsService: '$settings';
    SprintService: '$sprint';
    StorageService: '$storage';
    TicketService: '$ticket';
    UserGroupService: '$usergroup';
    UserService: '$user';
    UserUtilsService: '$userutils';
    UtilsService: '$utils';
    WorklogService: '$worklog';
    WorklogTimerService: '$wltimer';
};

export type ResolvedServices<T extends ServiceTypes[]> = {
    [K in T[number] as ServiceNameToRef[K]]: ServiceReference[ServiceNameToRef[K]];
};
