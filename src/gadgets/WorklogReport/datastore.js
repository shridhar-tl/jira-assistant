import moment from "moment";
import createStore from "../../common/store";
import { inject } from "../../services";

const initialData = {
    userListMode: '2', // 1=all logged users, 2=users from group, 3= from project, 4=from user and project
    timeframeType: '2', // 1=Sprint wise, 2=daterange wise
    userGroups: [], // user groups for date range
    reportUserGrp: '1', // 1=no grouping, 2=group users by project, 3=issuetype, 4=epic
    dateRange: {}, // user selected date range
    logFormat: '2', // worklog display format
    breakupMode: '1', // combine individual worklogs or not
    userDisplayFormat: '1', // User details display format
    fields: {}, // additional fields to be displayed in report
    daysToHide: '1', // 1=show all days, 2=hide non working days,3=hide days without worklog
    rIndicator: '1', // 1=thermometer, 2=bg highlight,0=none
    timeZone: '1',
    expandUsers: false,

    sprintStartRounding: '1',
    sprintEndRounding: '1',

    // Filter settings
    jql: '',
    logFilterType: '1', // 1=Show all worklogs, 2=Logged before, 3=Logged after
    filterThrsType: '1', // 1=x days from log date,2=x days from last date,3=use date selected
    filterDays: 5, // number of days to use
    filterDate: new Date(), // Date to use
    wlDateSelection: '1', // 1=Use updated date for filtering

    loadingData: false, // Whether currently report data is being pulled
    reportLoaded: false, // Is report data pulled for selected input

    disableAddingWL: false, // To disable adding worklog from report

    selSprints: {}, // user input {[boardId]: {selected:true, range:0, custom:{ [sprintId]:true }}}
    sprintBoards: [], // user selected sprint boards
    sprintList: {},
    allSprints: {},

    sprints: [],
    userExpnState: {} // This would contain [uid]: true when user is expanded in group
    //sprintsList_{boardId}:[{sprint}]
    //groupReport_{boardId}:{weeks:[],dates:[], groupedData:[{group}]}
};

/*
Group template
{
    name, 
    total:{yyyymmdd:xxx},
    totalCost:{}
    grandTotal:xxx,
    grandTotalCost:xxx,
    users:[{user}],
    usersMap:{xxx:{user}}
}

User Template
{
    
}
*/

const { withProvider, connect } = createStore(initialData);

export { withProvider, connect };

export function getSettingsObj(data, opts) {
    if (!data) {
        return {};
    }

    const {
        userListMode,
        timeframeType,
        reportUserGrp,
        dateRange,
        logFormat,
        breakupMode,
        timeZone,
        sprintStartRounding,
        sprintEndRounding,
        userDisplayFormat,
        fields,
        daysToHide,
        rIndicator,
        expandUsers,
        jql,
        logFilterType,
        filterThrsType,
        filterDays,
        filterDate,
        wlDateSelection,
        sprintBoards,
        sprintList,
        selSprints = {},

        userGroups,

        flatTableSettings
    } = data;

    const toStore = removeUndefined({
        userListMode,
        timeframeType,
        reportUserGrp,
        dateRange,
        logFormat,
        breakupMode,
        timeZone,
        sprintStartRounding,
        sprintEndRounding,
        userDisplayFormat,
        fields,
        daysToHide,
        rIndicator,
        expandUsers,
        jql,
        logFilterType,
        filterThrsType,
        filterDays,
        filterDate,
        wlDateSelection,
        sprintBoards,
        sprintList,
        selSprints,
        flatTableSettings: removeUndefined(flatTableSettings)
    });

    if (filterDate && moment(filterDate).isSame(new Date(), 'day')) {
        delete toStore.filterDate;
    }

    if (opts?.incUserGroups) {
        toStore.userGroups = userGroups;
    }

    return toStore;
}

export async function getInitialSettings(storedSettings, addlSettings = {}) {
    const { $session, $usergroup } = inject('SessionService', 'UserGroupService');
    const { maxHours: maxHrs, projects, epicNameField, rapidViews: sprintBoardsFromSettings } = $session.CurrentUser;

    const maxHours = (maxHrs || 8) * 60 * 60;

    const settings = getSettingsObj(storedSettings);

    if (sprintBoardsFromSettings?.length && !settings.sprintBoards?.length) {
        settings.sprintBoards = sprintBoardsFromSettings;
    }

    const addl = getSprintsList(settings);

    const userGroups = storedSettings.userGroups || await $usergroup.getUserGroups();

    return {
        userGroups, ...settings, ...addl, maxHours,
        projects, epicField: epicNameField?.id,
        sprintBoardsFromSettings, ...addlSettings // This field is used for comparison when saving local settings
    };
}

export function getSprintsList({ sprintBoards, sprintList }) {
    if (!sprintBoards || !sprintList) {
        return { sprints: [], allSprints: {} };
    }

    const sprints = sprintBoards.map(b => ({
        label: b.name,
        isGroup: true,
        items: sprintList[b.id]?.map(({ name, id }) => ({ value: id, label: name }))
    }));
    const allSprints = Object.keys(sprintList).reduce((obj, grp) => {
        sprintList[grp]?.forEach(spr => obj[spr.id] = spr);
        return obj;
    }, {});

    return { sprints, allSprints };
}

function removeUndefined(obj) {
    if (typeof obj !== 'object') {
        return obj;
    }

    Object.keys(obj).forEach(k => {
        if (typeof obj[k] === 'undefined') {
            delete obj[k];
        }
    });

    return obj;
}