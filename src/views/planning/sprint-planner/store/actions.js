import { inject } from "src/services";
import { loadSprintsList } from "./init";
import { getLeaveDetails, getSprintWiseLeavesAndHolidays } from "./utils";

/*export function loadBoardsList(setState) {
    return async function () {
        const { $jira } = inject('JiraService');
        const sprintBoards = await $jira.getRapidViews();
        setState({ sprintBoards });
    };
}*/

export function setSelectedBoard(setState, getState) {
    return async function (boardId) {
        const { $jira } = inject('JiraService');
        const selectedBoard = await $jira.getAgileScrumBoard(boardId);
        setState({ selectedBoard });
        loadSprintsList(selectedBoard.id, setState, getState);
    };
}

export function loadLeaveDetails(setState, getState) {
    return async function () {
        setState({ isLoadingEvents: true });
        const { settings, planStartDate, planEndDate, sprintLists } = getState();

        const { resourceLeaveDays, resourceHolidays } = await getLeaveDetails(settings, planStartDate, planEndDate);

        const sprintWiseLeaveAndHolidays = getSprintWiseLeavesAndHolidays(sprintLists, resourceLeaveDays, resourceHolidays);

        setState({ isLoadingEvents: false, resourceLeaveDays, resourceHolidays, sprintWiseLeaveAndHolidays });
    };
}

export function getIssuesForSprint(_, getState) {
    return async function ({ id }) {
        const sprintIssuesMap = getState('sprintWiseIssues');
        return sprintIssuesMap[id];
    };
}