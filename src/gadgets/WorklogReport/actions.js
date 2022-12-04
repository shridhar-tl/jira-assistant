import moment from 'moment';
import { inject } from "../../services/injector-service";
import { getSettingsObj } from "./datastore";
import { generateRangeReport } from "./range-report";
import { generateSprintReport } from "./sprint-report";

export function setStateValue(setState) {
    return function (value) { setState(value); };
}

export function getSettingsToStore(_, getState) {
    return function () { return getSettingsObj(getState()); };
}

export function fillSprintList(setState, getState) {
    return function () { setState(getSprintsList(getState())); };
}


export function groupsChanged(setState) {
    return function (userGroups) {
        if (userGroups && Array.isArray(userGroups)) {
            setState({ userGroups });
        }
    };
}

export function addWorklog(setState) {
    const { $session: { CurrentUser: { maxHours } } } = inject('SessionService');
    const maxSecsPerDay = (maxHours || 8) * 60 * 60;

    return function (user, ticketNo, dateStarted, logged) {
        let timeSpent = (maxSecsPerDay || 0) - (logged || 0);
        if (timeSpent < 60) {
            timeSpent = "01:00";
        }

        if (moment(dateStarted).isSame(moment(), 'day')) {
            dateStarted = new Date();
        }

        setState({ showWorklogPopup: true, worklogItem: { ticketNo, dateStarted, timeSpent } });
    };
}

export function worklogAdded(setState) {
    return function () {
        setState({ showWorklogPopup: false, worklogItem: null });
    };
}

export function hideWorklog(setState) {
    return function () {
        setState({ showWorklogPopup: false, worklogItem: null });
    };
}

export function getSprintsList({ sprintBoards, sprintList }) {
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

export function fetchData(setState, getState) {
    return async function () {
        const { timeframeType } = getState();

        if (timeframeType === '1') {
            await generateSprintReport(setState, getState)();
        } else {
            await generateRangeReport(setState, getState)();
        }
    };
}

export function convertSecs(_, getState) {
    const { $utils: { convertSecs: cs } } = inject('UtilsService');

    return (val) => {
        if (!val && val !== 0) {
            return val;
        }

        return cs(val, { format: getState('logFormat') === "1" });
    };
}