import { loadSprintsList } from "./init";
import { getLeaveDetails } from "./utils";

/*export function loadBoardsList(setState) {
    return async function () {
        const { $jira } = inject('JiraService');
        const sprintBoards = await $jira.getRapidViews();
        setState({ sprintBoards });
    };
}*/

export function setSelectedBoard(setState, getState) {
    return async function (selectedBoard) {
        setState({ selectedBoard });
        loadSprintsList(selectedBoard.id, setState, getState);
    };
}

export function loadLeaveDetails(setState, getState) {
    return async function () {
        setState({ isLoadingEvents: true });
        const settings = getState('settings');

        const leaveDetails = await getLeaveDetails(settings);

        setState({ isLoadingEvents: false, ...leaveDetails });
    };
}