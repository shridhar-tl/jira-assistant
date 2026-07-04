/**
 * Jira API endpoint URLs
 * Note: ~/ prefix means relative to Jira root URL
 */
export const ApiUrls = {
    // Project & Issue Type APIs
    getAllProjects: '~/rest/api/2/project',
    getAllIssueTypes: '~/rest/api/2/issuetype',

    // Search APIs
    search: '~/rest/api/3/search/jql',
    searchLegacyV2: '~/rest/api/2/search',
    searchIssueForPicker: '~/rest/api/2/issue/picker',

    // Issue CRUD APIs
    createIssue: '~/rest/api/2/issue/',
    individualIssue: '~/rest/api/2/issue/{0}',
    cloneIssue: '~/rest/internal/2/issue/{0}/clone',
    bulkImportIssue: '~/rest/api/2/issue/bulk',
    taskStatus: '~/rest/api/3/task/{0}',

    // Issue Metadata APIs
    getProjectImportMetadata: '~/rest/api/2/issue/createmeta?expand=projects.issuetypes.fields&projectKeys=',
    getProjectStatuses: '~/rest/api/2/project/{0}/statuses',
    getJiraStatuses: '~/rest/api/2/status',
    getIssueMetadata: '~/rest/api/2/issue/{0}/editmeta',

    // Worklog APIs
    issueWorklog: '~/rest/api/2/issue/{0}/worklog',
    individualWorklog: '~/rest/api/2/issue/{0}/worklog/{1}',

    // User & Group APIs
    searchUser: '~/rest/api/2/user/search?maxResults={1}&startAt={2}&query={0}',
    searchUser_Alt: '~/rest/api/2/user/search?maxResults={1}&startAt={2}&username={0}',
    searchGroup: '~/rest/api/2/groups/picker?caseInsensitive=true&maxResults={1}&query={0}',
    getGroupMembers: '~/rest/api/2/group/member?maxResults={1}&includeInactiveUsers=true&groupId={0}',
    getUserDetails: '~/rest/api/2/user?username={0}',
    mySelf: '~/rest/api/2/myself',

    // Field APIs
    getCustomFields: '~/rest/api/2/field',

    // JQL APIs
    getJQLAutocomplete: '~/rest/api/2/jql/autocompletedata',
    getJQLSuggestions: '~/rest/api/2/jql/autocompletedata/suggestions',

    // Agile/Sprint APIs (Greenhopper)
    rapidViews: '~/rest/greenhopper/1.0/rapidview',
    rapidSprintList: '~/rest/greenhopper/1.0/sprintquery/{0}',
    rapidSprintDetails: '~/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId={0}&sprintId={1}',
    sprintListAll: '~/rest/greenhopper/1.0/integration/teamcalendars/sprint/list?jql=project+in+({0})',

    // Modern Agile APIs
    scrumBoards: '~/rest/agile/1.0/board?maxResults=100&orderBy=name&type=scrum,simple',
    scrumBoardConfig: '~/rest/agile/1.0/board/{0}/configuration',
    sprintListByBoard: '~/rest/agile/1.0/board/{0}/sprint?maxResults=50&startAt={1}&state={2}',
    getSprintProperty: '~/rest/agile/1.0/sprint/{0}/properties/{1}',
    getSprintIssues: '~/rest/agile/1.0/sprint/{0}/issue',

    // Changelog API
    bulkIssueChangelogs: '~/rest/api/3/changelog/bulkfetch',

    // External OAuth URLs
    googleLogoutUrl: 'https://accounts.google.com/o/oauth2/revoke?token={0}',
    outlookLogoutUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
} as const;
