import moment from 'moment';

import { inject } from '../../services/injector';

import { generateUserDayWiseData, getEpicDetails, getUserWiseWorklog } from './userdaywise/utils_group';
import { generateFlatWorklogData, getFieldsToFetch } from './utils';

function getUserName(user: any, includeEmail?: boolean): string {
    if (!user) return '';
    const name = user.name || user.emailAddress || user.displayName || '';
    return includeEmail && user.emailAddress ? user.emailAddress : name;
}

export function generateSprintReport(setState: any, getState: any) {
    return async function () {
        const curState = getState();
        const { selSprints: sel, sprintStartRounding, sprintEndRounding, daysToHide, timeZone } = curState;

        const selBoards = Object.keys(sel).filter((bid) => sel[bid]?.selected);
        if (!selBoards.length) {
            return;
        }

        const { $jira, $session } = inject('JiraService', 'SessionService');
        const name = $session.CurrentUser.name;

        const newState: any = { loadingData: false, errorTitle: '', errorMessage: '' };

        try {
            setState({ loadingData: true, reportLoaded: false });

            const allSprints = await $jira.getRapidSprintList(selBoards, true);

            for (const boardId of selBoards) {
                const sprintsList = getSprintsSelected(boardId, sel, allSprints);

                newState[`sprintsList_${boardId}`] = sprintsList;

                const totalUsersList: any[] = [];
                const usersIndex: any = {};
                const flatWorklogs_board: any[] = [];
                newState[`flatWorklogs_${boardId}`] = flatWorklogs_board;

                for (const sprint of sprintsList) {
                    const { id, startDate, endDate, completeDate = endDate, previousSprintEnd, nextSprintStart } = sprint;
                    const fromDate = moment(startDate),
                        toDate = moment(completeDate);

                    const settings: any = {
                        fromDate: fromDate.toDate(),
                        toDate: toDate.toDate(),
                        timeZone,
                        daysToHide,
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

                    const { issues: issuesList, epicDetails } = await pullIssuesFromSprint(
                        id,
                        settings.fromDate,
                        settings.toDate,
                        curState,
                    );
                    if (!issuesList.length) {
                        newState[`groupReport_${id}`] = null;
                        continue;
                    }

                    const { userwiseLog, userwiseLogArr } = getUserWiseWorklog(
                        issuesList,
                        moment(settings.fromDate),
                        moment(settings.toDate),
                        (name || '').toLowerCase(),
                        curState,
                        epicDetails,
                    );

                    const { groupReport, flatWorklogs } = generateSprintGroupReport(sprint, userwiseLog, settings, curState);
                    flatWorklogs_board.push(...flatWorklogs);

                    newState[`groupReport_${id}`] = groupReport;

                    userwiseLogArr.forEach((u: any) => {
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
        } catch (err: any) {
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

function getCollectiveSprints(sprintsList: any[], newState: any) {
    return sprintsList
        .filter((s) => newState[`groupReport_${s.id}`] !== null)
        .map((s) => {
            const { id, name } = s;
            const { dates } = newState[`groupReport_${id}`];
            return { id, name: getSprintName(name, s.settings), days: dates.length };
        });
}

function formUserGroupToDisplay(sprintsList: any[], newState: any, totalUsersList: any[], { userListMode, userGroups }: any) {
    const sprints = getCollectiveSprints(sprintsList, newState);

    function mapGroup(name: string, totalUsers: any[]) {
        const { grandTotalHours, grandTotalCost, users, usersMap } = getCollectiveUsers(totalUsers, sprints, newState);

        return { name, users, usersMap, grandTotalHours, grandTotalCost, sprints };
    }

    if (userListMode === '2') {
        return userGroups.map((grp: any) => mapGroup(grp.name, grp.users));
    } else {
        return [mapGroup('Sprint', totalUsersList)];
    }
}

function getCollectiveUsers(totalUsersList: any[], sprints: any[], newState: any) {
    let grandTotalHours = 0,
        grandTotalCost = 0;
    const users = totalUsersList
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .map((u) => {
            const allTickets: any[] = [],
                ticketsMap: any = {};
            const user: any = {
                ...u,
                tickets: allTickets,
                allSprintTotalCost: 0,
                allSprintTotalHours: 0,
            };
            const name = getUserName(user);

            for (const sprint of sprints) {
                const groupReport = newState[`groupReport_${sprint.id}`];
                if (!groupReport) {
                    continue;
                }

                const {
                    groupedData: [sprintData],
                } = groupReport;
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

    return {
        grandTotalHours,
        grandTotalCost,
        users,
        usersMap: users.reduce((obj: any, u: any) => {
            obj[getUserName(u)] = u;
            return obj;
        }, {}),
    };
}

function getSprintsSelected(boardId: string, boards: any, allSprints: any) {
    const { range, custom } = boards[boardId];
    const sprintList = allSprints[boardId]?.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    switch (range) {
        case -1:
            return sprintList.filter((s: any) => custom[s.id]).reverse();
        case 0:
            return [sprintList[0]].filter(Boolean);
        case 1: {
            const lastSprint = sprintList[0];
            return [lastSprint.completeDate ? lastSprint : sprintList[1]].filter(Boolean);
        }
        default:
            return sprintList.slice(0, range).reverse();
    }
}

async function pullIssuesFromSprint(sprintId: number, worklogStartDate: Date, worklogEndDate: Date, state: any) {
    const { $jira, $session } = inject('JiraService', 'SessionService');
    const epicNameField = $session.CurrentUser.epicNameField;

    const { fieldsToFetch } = getFieldsToFetch(state, epicNameField?.id);
    const request: any = { maxResults: 1000, fields: fieldsToFetch, worklogStartDate, worklogEndDate };
    if (state.jql?.trim()) {
        request.jql = state.jql?.trim();
    }
    const issues = await $jira.getSprintIssues(sprintId, request);

    const epicDetails = issues.length > 0 && (await getEpicDetails(issues, epicNameField?.id));

    return { issues, epicDetails };
}

function generateSprintGroupReport(sprint: any, data: any, settings: any, state: any) {
    const { userListMode, userGroups } = state;
    const groups = userListMode === '2' && userGroups?.length ? userGroups : generateGroupForSprint(sprint, data, settings);

    const groupReport = generateUserDayWiseData(data, groups, settings);
    const flatWorklogs = generateFlatWorklogData(data, groups, sprint.name);

    return { groupReport, flatWorklogs };
}

function generateGroupForSprint(sprint: any, data: any, settings: any) {
    return [
        {
            name: getSprintName(sprint.name, settings),
            users: Object.keys(data).map((k) => data[k]),
        },
    ];
}

function getSprintName(name: string, settings?: any) {
    if (!settings?.fromDate) {
        return name;
    }

    const { fromDate, toDate } = settings;
    const { $userutils } = inject('UserUtilsService');
    return `${name} (${$userutils.formatDateTime(fromDate)} - ${$userutils.formatDateTime(toDate)})`;
}
