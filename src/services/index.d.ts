import 'react';
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

declare module 'react' {
    interface PureComponent<P = {}, S = {}, SS = any> extends Component<P, S, SS> {
        $ajax: AjaxService
        $analytics: AnalyticsService
        $auth: AuthService
        $bookmark: BookmarkService
        $cache: CacheService
        $calendar: CalendarService
        $config: ConfigService
        $dashboard: DashboardService
        $db: DatabaseService
        $jaBrowserExtn: ChromeService | FirefoxService | EdgeService | DevService
        $jira: JiraService
        $message: MessageService
        $noti: NotificationService
        $outlook: OutlookCalendar
        $q: QueueService
        $report: ReportService
        $reportConfig: ReportConfigService
        $session: SessionService
        $suggestion: SuggestionService
        $ticket: TicketService
        $user: UserService
        $usergroup: UserGroupService
        $userutils: UserUtilsService
        $utils: UtilsService
        $worklog: WorklogService
    }
}