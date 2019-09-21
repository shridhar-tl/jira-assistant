import * as moment from 'moment';

export const ApiUrls = {
    authentication: "~/rest/auth/1/session",
    getAllProjects: "~/rest/api/2/project",
    search: "~/rest/api/2/search",
    getIssue: "~/rest/api/2/issue/",
    bulkImportIssue: "~/rest/api/2/issue/bulk",
    getProjectImportMetadata: "~/rest/api/2/issue/createmeta?expand=projects.issuetypes.fields&projectKeys=",
    getIssueMetadata: "~/rest/api/2/issue/{0}/editmeta",
    individualIssue: "~/rest/api/2/issue/{0}",
    getAllIssueTypes: "~/rest/api/2/issuetype",
    addIssueWorklog: "~/rest/api/2/issue/{0}/worklog?adjustEstimate=AUTO",
    issueWorklog: "~/rest/api/2/issue/{0}/worklog",
    updateIndividualWorklog: "~/rest/api/2/issue/{0}/worklog/{1}?adjustEstimate=AUTO",
    individualWorklog: "~/rest/api/2/issue/{0}/worklog/{1}",
    searchUser: "~/rest/api/2/user/search?maxResults={1}&startAt={2}&username={0}",
    getCustomFields: "~/rest/api/2/field",
    getUserDetails: "~/rest/api/2/user?username={0}",
    mySelf: "~/rest/api/2/myself",
    usersForPicker: "~/rest/api/2/user/picker?maxResults=10&showAvatar=true&query=",
    rapidSprintList: "~/rest/greenhopper/1.0/sprintquery/{0}",
    rapidSprintDetails: "~/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId={0}&sprintId={1}",
    sprintListAll: "~/rest/greenhopper/1.0/integration/teamcalendars/sprint/list?jql=project+in+({0})",
    sprintListOpen: "~/rest/greenhopper/1.0/integration/teamcalendars/sprint/list?jql=project+in+({0})+and+Sprint+not+in+closedSprints()",
    rapidViews: "~/rest/greenhopper/1.0/rapidview",
    burndownChart: "~/rest/greenhopper/1.0/rapid/charts/scopechangeburndownchart.json?rapidViewId={0}&sprintId={1}",
    googleLogoutUrl: "https://accounts.google.com/o/oauth2/revoke?token={0}"
};

export const dateFormats = [
    "dd-MMM-yyyy", "dd/MMM/yyyy",
    "dd-MM-yyyy", "dd/MM/yyyy",
    "MM-dd-yyyy", "MM/dd/yyyy",
    "yyyy-MM-dd", "yyyy/MM/dd",
    "MMM dd, yyyy", "ddd, MMM dd, yyyy"
];
export const timeFormats = [" HH:mm:ss", " hh:mm:ss tt", " HH.mm.ss", " hh.mm.ss tt"];
export const CHROME_WS_URL = "https://chrome.google.com/webstore/detail/jira-assistant/momjbjbjpbcbnepbgkkiaofkgimihbii";
export const FF_STORE_URL = "https://addons.mozilla.org/en-US/firefox/addon/jira-assistant/";
export const DASHBOARD_ICONS = [
    'fa fa-tachometer',
    'fa fa-info-circle',
    'fa fa-language',
    'fa fa-asterisk',
    'fa fa-gift',
    'fa fa-fire',
    'fa fa-eye',
    'fa fa-low-vision',
    'fa fa-cube',
    'fa fa-cubes',
    'fa fa-plane',
    'fa fa-calendar',
    'fa fa-tree',
    'fa fa-random',
    'fa fa-deviantart',
    'fa fa-database',
    'fa fa-folder',
    'fa fa-folder-open',
    'fa fa-bar-chart',
    'fa fa-life-ring',
    'fa fa-key',
    'fa fa-bookmark-o',
    'fa fa-futbol-o',
    'fa fa-certificate',
    'fa fa-calculator',
    'fa fa-tasks',
    'fa fa-globe',
    'fa fa-area-chart',
    'fa fa-pie-chart',
    'fa fa-line-chart',
    'fa fa-columns',
    'fa fa-sitemap',
    'fa fa-dashboard',
    'fa fa-desktop',
    'fa fa-laptop',
    'fa fa-flag',
    'fa fa-home',
    'fa fa-hashtag',
    'fa fa-info',
    'fa fa-tag',
    'fa fa-trophy',
    'fa fa-list-alt',
    'fa fa-th',
    'fa fa-th-list',
    'fa fa-th-large'
];
export const OPERATORS = [
    { value: '{0} = {1}', label: 'Equals value' },
    { value: '{0} != {1}', label: 'Not equals value' },
    { value: '{0} > {1}', label: 'greater than', types: ['number', 'date', 'datetime', 'seconds'] },
    { value: '{0} >= {1}', label: 'greater than or equals', types: ['number', 'date', 'datetime', 'seconds'] },
    { value: '{0} < {1}', label: 'lesser than', types: ['number', 'date', 'datetime', 'seconds'] },
    { value: '{0} <= {1}', label: 'lesser than or equals', types: ['number', 'date', 'datetime', 'seconds'] },
    { value: '({0} >= {1} AND {0} <= {2})', label: 'between', types: ['number', 'date', 'datetime', 'seconds'], type: 'range' },
    { value: '({0} < {1} AND {0} > {2})', label: 'not between', types: ['number', 'date', 'datetime', 'seconds'], type: 'range' },
    { value: '{0} in ({1})', label: 'Contains any of', type: 'multiple' },
    { value: '{0} not in ({1})', label: 'Does not contain', type: 'multiple' }
];

export function getDateRange(rangeOf) {
    const ranges = [
        [moment().startOf('month').toDate(), moment().endOf('month').toDate()],
        [moment().subtract(1, 'months').toDate(), moment().toDate()],
        [moment().subtract(1, 'months').startOf('month').toDate(), moment().subtract(1, 'months').endOf('month').toDate()],
        [moment().startOf('week').toDate(), moment().endOf('week').toDate()],
        [moment().subtract(6, 'days').toDate(), moment().toDate()],
        [moment().subtract(1, 'weeks').startOf('week').toDate(), moment().subtract(1, 'weeks').endOf('week').toDate()]
    ];
    if (rangeOf) {
        return ranges[rangeOf - 1];
    }
    else {
        return ranges;
    }
}

export const DummyWLId = 9999999;

export const UUID = (function () {
    const self = {};
    const lut = [];
    for (let i = 0; i < 256; i++) {
        lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
    }
    self.generate = function () {
        const d0 = Math.random() * 0xffffffff | 0;
        const d1 = Math.random() * 0xffffffff | 0;
        const d2 = Math.random() * 0xffffffff | 0;
        const d3 = Math.random() * 0xffffffff | 0;
        return `${lut[d0 & 0xff] + lut[(d0 >> 8) & 0xff] + lut[(d0 >> 16) & 0xff] + lut[(d0 >> 24) & 0xff]}-${
            lut[d1 & 0xff]}${lut[(d1 >> 8) & 0xff]}-${lut[((d1 >> 16) & 0x0f) | 0x40]}${lut[(d1 >> 24) & 0xff]}-${
            lut[(d2 & 0x3f) | 0x80]}${lut[(d2 >> 8) & 0xff]}-${lut[(d2 >> 16) & 0xff]}${lut[(d2 >> 24) & 0xff]
            }${lut[d3 & 0xff]}${lut[(d3 >> 8) & 0xff]}${lut[(d3 >> 16) & 0xff]}${lut[(d3 >> 24) & 0xff]}`;
    };
    return self;
})();


export const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const FULL_MONTH_NAMES = ['January', 'Febraury', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const TINY_DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
export const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];