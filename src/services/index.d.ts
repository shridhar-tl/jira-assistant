import 'react';
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
import JiraOAuthService from './jira-oauth-service';
import JiraService from './jira-service';
import JiraUpdatesService from './jira-updates-service';
import MessageService from './message-service';
import NotificationService from './notification-service';
import OutlookCalendar from './outlook-service';
import QueueService from './queue-service';
import ReportService from './report-service';
import ReportConfigService from './reportconfig-service';
import SessionService from './session-service';
import SettingsService from './settings-service';
import StorageService from './storage-service';
import SuggestionService from './suggestion-service';
import TicketService from './ticket-service';
import UserService from './user-service';
import UserGroupService from './usergroups-service';
import UserUtilsService from './userutils-service';
import UtilsService from './utils-service';
import WorklogService from './worklog-service';

declare module 'react' {
    interface PureComponent<P = {}, S = {}, SS = any> extends Component<P, S, SS> {
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
        $jAuth: JiraOAuthService
        $jira: JiraService
        $jupdates: JiraUpdatesService
        $message: MessageService
        $noti: NotificationService
        $outlook: OutlookCalendar
        $q: QueueService
        $report: ReportService
        $reportConfig: ReportConfigService
        $session: SessionService
        $settings: SettingsService
        $storage: StorageService
        $suggestion: SuggestionService
        $ticket: TicketService
        $user: UserService
        $usergroup: UserGroupService
        $userutils: UserUtilsService
        $utils: UtilsService
        $worklog: WorklogService
    }
}