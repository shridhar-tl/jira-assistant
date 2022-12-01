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

export function addWorklog() {
    return function () {
        //
    };
}

export function worklogAdded() {
    return function () {
        //
    };
}

export function hideWorklog() {
    return function () {
        //
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