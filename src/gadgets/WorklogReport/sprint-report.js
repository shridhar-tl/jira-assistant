import moment from 'moment';
import { getUserName } from '../../common/utils';
import { inject } from "../../services/injector-service";
import { generateUserDayWiseData, getEpicDetails, getUserWiseWorklog } from './userdaywise/utils_group';
import { generateFlatWorklogData, getFieldsToFetch } from './utils';

export function generateSprintReport(setState, getState) {
    return async function () {
        const curState = getState();
        const { selSprints: sel, sprintStartRounding, sprintEndRounding, daysToHide, timeZone } = curState;

        const selBoards = Object.keys(sel).filter(bid => sel[bid]?.selected);
        if (!selBoards.length) { return; }

        const { $jira, $session: { CurrentUser: { name } } } = inject('JiraService', 'SessionService');

        const newState = { loadingData: false, errorTitle: '', errorMessage: '' };

        try {
            setState({ loadingData: true, reportLoaded: false });

            const allSprints = await $jira.getRapidSprintList(selBoards, true);

            for (const boardId of selBoards) {
                const sprintsList = getSprintsSelected(boardId, sel, allSprints);

                newState[`sprintsList_${boardId}`] = sprintsList;

                const totalUsersList = [];
                const usersIndex = {};
                const flatWorklogs_board = [];
                newState[`flatWorklogs_${boardId}`] = flatWorklogs_board;

                for (const sprint of sprintsList) {
                    const { id, startDate, endDate, completeDate = endDate, previousSprintEnd, nextSprintStart } = sprint;
                    const fromDate = moment(startDate), toDate = moment(completeDate);

                    const settings = {
                        fromDate: fromDate.toDate(),
                        toDate: toDate.toDate(),
                        timeZone,
                        daysToHide
                    };

                    if (sprintStartRounding === '2') {
                        settings.fromDate = fromDate.startOf('day').toDate();
                    } else if (sprintStartRounding === '3') {
                        settings.fromDate = fromDate.startOf('day').add(1, 'days').toDate();
                    } else if (sprintStartRounding === '4' && previousSprintEnd && previousSprintEnd instanceof Date) {
                        settings.fromDate = moment(new Date(previousSprintEnd)).add(1, 'seconds').toDate();
                    }

                    if (sprintEndRounding === '2') {
                        settings.toDate = toDate.endOf('day').toDate();
                    } else if (sprintEndRounding === '3') {
                        settings.toDate = toDate.endOf('day').add(-1, 'days').toDate();
                    } else if (sprintEndRounding === '4' && nextSprintStart && nextSprintStart instanceof Date) {
                        settings.toDate = moment(new Date(nextSprintStart)).add(-1, 'seconds').toDate();
                    }

                    const { issues: issuesList, epicDetails } = await pullIssuesFromSprint(id, settings.fromDate, settings.toDate, curState);
                    if (!issuesList.length) {
                        newState[`groupReport_${id}`] = null;
                        continue;
                    }

                    const { userwiseLog, userwiseLogArr } = getUserWiseWorklog(issuesList, moment(settings.fromDate), moment(settings.toDate), name?.toLowerCase(), curState, epicDetails);

                    const { groupReport, flatWorklogs } = generateSprintGroupReport(sprint, userwiseLog, settings, curState);
                    flatWorklogs_board.addRange(flatWorklogs);

                    //newState[`rawData_${id}`] = issuesList;
                    //newState[`userwiseLog_${id}`] = userwiseLog;
                    //newState[`userwiseLogArr_${id}`] = userwiseLogArr;
                    newState[`groupReport_${id}`] = groupReport;
                    //newState[`sprint_${id}`] = sprint;

                    userwiseLogArr.forEach(u => {
                        const name = getUserName(u, true);
                        if (!usersIndex[name]) {
                            totalUsersList.push(u);
                            usersIndex[name] = true;
                        }
                    });

                    sprint.settings = settings;
                }

                newState[`userGroup_${boardId}`] = formUserGroupToDisplay(sprintsList, newState, totalUsersList, curState);
            }

            newState.reportLoaded = true;
        } catch (err) {
            console.error('Error pulling sprint report:', err);
            const { $message } = inject('MessageService');

            const errorMessage = err.message || err.error?.errorMessages?.[0] || 'Unknown error. Check the console for more details';
            const errorTitle = err.message ? 'Worklog report' : 'Unknown error';
            setState({ errorTitle, errorMessage });
            $message.error(errorMessage, errorTitle);
        } finally {
            setState(newState);
        }
    };
}

function getCollectiveSprints(sprintsList, newState) {
    return sprintsList.map(s => {
        const { id, name } = s;

        const { dates } = newState[`groupReport_${id}`];

        return { id, name: getSprintName(name, s.settings), days: dates.length };
    });
}

function formUserGroupToDisplay(sprintsList, newState, totalUsersList, { userListMode, userGroups }, settings) {
    const sprints = getCollectiveSprints(sprintsList, newState);

    function mapGroup(name, totalUsers) {
        const { grandTotalHours, grandTotalCost, users, usersMap } =
            getCollectiveUsers(totalUsers, sprints, newState);

        return { name, users, usersMap, grandTotalHours, grandTotalCost, sprints };
    }

    if (userListMode === '2') {
        return userGroups.map(grp => mapGroup(grp.name, grp.users));
    } else {
        return [mapGroup('Sprint', totalUsersList)];
    }
}

function getCollectiveUsers(totalUsersList, sprints, newState) {
    let grandTotalHours = 0, grandTotalCost = 0;
    const users = totalUsersList.sortBy(u => u.displayName).map(u => {
        const allTickets = [], ticketsMap = {};
        const user = {
            ...u, tickets: allTickets,
            allSprintTotalCost: 0, allSprintTotalHours: 0
        };
        const name = getUserName(user);

        for (const sprint of sprints) {
            const { groupedData: [sprintData] } = newState[`groupReport_${sprint.id}`];
            const { tickets, grandTotal, grandTotalCost } = sprintData.usersMap[name] || { tickets: [] };

            if (grandTotal) {
                user.allSprintTotalHours += grandTotal;
            }
            if (grandTotalCost) {
                user.allSprintTotalCost += grandTotalCost;
            }

            for (const ticket of tickets) {
                const { ticketNo } = ticket;
                const exstTicket = ticketsMap[ticketNo];

                if (exstTicket) {

                    if (ticket.totalHours) {
                        exstTicket.grandTotalHours += ticket.totalHours;
                    }

                    if (ticket.totalCost) {
                        exstTicket.grandtotalCost += ticket.totalCost;
                    }
                    continue;
                }

                allTickets.push(ticket);
                ticketsMap[ticketNo] = ticket;
                ticket.allSprintTotalHours = ticket.totalHours;
                ticket.allSprintTotalCost = ticket.totalCost;
            }
        }

        grandTotalHours += user.allSprintTotalHours;
        grandTotalCost += user.allSprintTotalCost;

        return user;
    });

    return { grandTotalHours, grandTotalCost, users };
}

function getSprintsSelected(boardId, boards, allSprints) {
    const { range, custom } = boards[boardId];
    const sprintList = allSprints[boardId]?.sortBy(({ startDate }) => new Date(startDate).getTime(), true);

    switch (range) {
        case -1: return sprintList.filter(s => custom[s.id]).reverse();
        case 0: return [sprintList[0]].filter(Boolean);
        case 1:
            const lastSprint = sprintList[0];
            return [lastSprint.completeDate ? lastSprint : sprintList[1]].filter(Boolean);
        default:
            return sprintList.slice(0, range).reverse();
    }
}

async function pullIssuesFromSprint(sprintId, worklogStartDate, worklogEndDate, state) {
    const { $jira, $session: { CurrentUser: { epicNameField } } } = inject('JiraService', 'SessionService');

    const { fieldsToFetch } = getFieldsToFetch(state, epicNameField?.id);
    const request = { maxResults: 1000, fields: fieldsToFetch, worklogStartDate, worklogEndDate };
    if (state.jql?.trim()) {
        request.jql = state.jql?.trim();
    }
    const issues = await $jira.getSprintIssues(sprintId, request);

    const epicDetails = issues.length > 0 && await getEpicDetails(issues, epicNameField?.id);

    return { issues, epicDetails };
}

function generateSprintGroupReport(sprint, data, settings, state) {
    const { userListMode, userGroups } = state;
    const groups = userListMode === '2' ? userGroups : generateGroupForSprint(sprint, data, settings);

    const groupReport = generateUserDayWiseData(data, groups, settings, state);
    const flatWorklogs = generateFlatWorklogData(data, groups, sprint.name);

    return { groupReport, flatWorklogs };
}

function generateGroupForSprint(sprint, data, settings) {
    return [
        {
            name: getSprintName(sprint.name, settings),
            users: Object.keys(data).map(k => data[k])
        }
    ];
}

function getSprintName(name, settings) {
    if (!settings?.fromDate) { return name; }

    const { fromDate, toDate } = settings;
    const { $userutils } = inject('UserUtilsService');
    return `${name} (${$userutils.formatDateTime(fromDate)} - ${$userutils.formatDateTime(toDate)})`;
}