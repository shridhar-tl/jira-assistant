export default class BaseService {
    $ajax: AjaxService
    $analytics: AnalyticsService
    $auth: AuthService
    $bookmark: BookmarkService
    $jaBrowserExtn: ChromeService | FirefoxService | EdgeService | DevService
    $cache: CacheService
    $calendar: CalendarService
    $config: ConfigService
    $dashboard: DashboardService
    $db: DatabaseService
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
    $suggestion: SuggestionService
    $ticket: TicketService
    $user: UserService
    $usergroup: UserGroupService
    $userutils: UserUtilsService
    $utils: UtilsService
    $worklog: WorklogService
}