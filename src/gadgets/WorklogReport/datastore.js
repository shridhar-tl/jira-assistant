import moment from "moment";
import createStore from "../../common/store";

const initialData = {
    userListMode: '2', // 1=all logged users, 2=users from group
    timeframeType: '2', // 1=Sprint wise, 2=daterange wise
    userGroups: [], // user groups for date range
    reportUserGrp: '1', // 1=no grouping, 2=group users by project
    dateRange: {}, // user selected date range
    logFormat: '1', // worklog display format
    breakupMode: '1', // combine individual worklogs or not
    userDisplayFormat: '1', // User details display format
    fields: {}, // additional fields to be displayed in report
    daysToHide: '1', // 1=show all days, 2=hide non working days,3=hide days without worklog
    timeZone: '1',

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

    selSprints: {}, // user input {[boardId]: {selected:true, range:0, custom:{ [sprintId]:true }}}
    sprintBoards: [], // user selected sprint boards
    sprintList: {},
    allSprints: {},

    sprints: []
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

export function getSettingsObj(data) {
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
        jql,
        logFilterType,
        filterThrsType,
        filterDays,
        filterDate,
        wlDateSelection,
        sprintBoards,
        sprintList,
        selSprints = {}
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
        jql,
        logFilterType,
        filterThrsType,
        filterDays,
        filterDate,
        wlDateSelection,
        sprintBoards,
        sprintList,
        selSprints
    });

    if (filterDate && moment(filterDate).isSame(new Date(), 'day')) {
        delete toStore.filterDate;
    }

    return toStore;
}

function removeUndefined(obj) {
    Object.keys(obj).forEach(k => {
        if (typeof obj[k] === 'undefined') {
            delete obj[k];
        }
    });

    return obj;
}