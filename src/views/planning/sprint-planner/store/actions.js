import moment from 'moment';
import { inject } from "../../../../services/injector-service";
import { getUserName } from '../../../../common/utils';
import { getDaysListBasedOnSprints } from './utils';

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

//#region Private functions
const unassignedUser = '--UNASSIGNED--';
//const unassignedUserObj = { displayName: '-- UNASSIGNED ISSUES --' };

async function loadSprintsList(boardId, setState, getState) {
    const { $jira } = inject('JiraService');

    setState({ loading: true });

    // Get list of sprints from Jira based on board
    const sprintLists = await $jira.getRapidSprintList([boardId], { state: 'future,active' });
    const daysList = getDaysListBasedOnSprints(sprintLists);

    const { columnConfig,
        estimation: { field: estimation = {} } = {}
    } = await $jira.getBoardConfig(boardId);

    // Create user and story map
    // Create new users if story is assigned
    const state = getState();
    let { resources } = state;
    resources = resources ? [...resources] : [];

    // Pull the list of issues based on sprint
    const sprintIds = sprintLists.map(({ id }) => id);
    const sprintMap = sprintLists.reduce((obj, sp) => {
        obj[sp.id] = sp;
        return obj;
    }, {});
    let sprintWiseIssues = {}, issuesMap = {};

    const userStoryMap = resources?.reduce((mapr, u) => {
        mapr[u.id] = [];
        return mapr;
    }, { [unassignedUser]: [] });

    if (sprintIds.length) {
        sprintWiseIssues = await $jira.getSprintIssues(sprintIds, {
            fields: ['summary', 'issuetype', 'assignee', 'parent', 'subtask', estimation.fieldId]
        });

        issuesMap = Object.keys(sprintWiseIssues).reduce((obj, sid) => {
            sprintWiseIssues[sid].forEach((issue) => {
                const { key, fields: { assignee } } = issue;
                const uName = getUserName(assignee);

                obj[key] = { assignee: uName, sprintId: sid, issue };

                if (uName) {
                    if (!userStoryMap[uName]) {
                        resources.push({ ...assignee, id: uName });
                        userStoryMap[uName] = [];
                    }
                    userStoryMap[uName].push(key);
                } else {
                    userStoryMap[unassignedUser].push(key);
                }
            });

            return obj;
        }, {});
    }

    // Sprint list is sorted in desc order
    // Take start and end date for planning based on first and last sprint
    const planStartDate = moment(sprintLists[sprintLists.length - 1]?.startDate || new Date()).startOf('day').toDate();
    const planEndDate = moment(sprintLists[0]?.endDate || moment().add(2, 'weeks'))
        .endOf('day').add(5, 'days').toDate();

    const newState = {
        loading: false,
        columnConfig, estimation,
        sprintLists, sprintMap, daysList,
        sprintWiseIssues, issuesMap,
        resources, userStoryMap,
        planStartDate, planEndDate,
    };

    preparePlanningData(newState, state);

    // Update state with all the objects
    setState(newState);
}

function preparePlanningData(newState, allState) {
    const { sprintLists, sprintWiseIssues,
        columnConfig: { columns },
        estimation: { fieldId: storyPointField } = {},

    } = newState;
    const { settings: { hoursPerStoryPoint, workHours } } = allState;

    const progCols = columns.slice(1, -1);
    const result = [];
    for (let i = sprintLists.length - 1; i > 0; i--) {
        const { id: sprintId, startDate } = sprintLists[i];
        const issues = sprintWiseIssues[sprintId];

        issues.forEach(issue => {
            const { key } = issue;
            const userId = null;
            const storyPoint = issue.fields[storyPointField] || 1;
            const totalHours = storyPoint * hoursPerStoryPoint;
            const totalDays = Math.ceil(totalHours / workHours);
            const _55Perc = totalDays * 55 / 100;
            const _remaining = totalDays - _55Perc;

            let prevEndDate = startDate;
            const child = progCols.map((c, i) => {
                const duration = i === 0 ? _55Perc : _remaining / (progCols.length - 1);
                const res = {
                    rowType: 'status',
                    id: c.name,
                    source: c, startDate: prevEndDate,
                    duration, progress: 100,
                    isManual: true
                };

                prevEndDate = moment(res.startDate)
                    .add(duration + 1, 'days')
                    .startOf('day').toDate();

                return res;
            });

            result.push({
                rowType: 'task', id: key, userId, sprintId,
                summary: issue.fields.summary,
                source: issue,
                child
            });
        });
    }
    newState.planningData = result;
    console.log('newState.planningData=', newState.planningData);
}

/*
function preparePlanningData(newState) {
    const { sprintMap, userList, userStoryMap, issuesMap } = newState;

    const getUserRow = (userId, user) => {
        const stories = userStoryMap[userId];
        const segments = {};

        const child = stories.map(key => {
            const { sprintId, issue } = issuesMap[key];
            const { startDate, endDate } = sprintMap[sprintId];
            if (!segments[sprintId]) {
                segments[sprintId] = { startDate, duration: moment(endDate).diff(startDate, 'days') };
            }

            return {
                rowType: 'task', id: key, userId, sprintId,
                source: issue, startDate,
                duration: 4, progress: 55
            };
        });

        return { rowType: 'user', id: userId, source: user, child, segments: Object.values(segments) };
    };

    newState.planningData = userList.map(u => {
        const userId = getUserName(u);
        return getUserRow(userId, u);
    });
    console.log('newState.planningData=', newState.planningData);
    newState.planningData.push(getUserRow(unassignedUser, unassignedUserObj));
}*/
//#endregion