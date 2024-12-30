import moment from "moment";
import FeedbackPromise from "src/common/FeedbackPromise";
import { getDaysDiffForDateRange } from "src/utils/date";

export default class SprintService {
    static dependencies = ['JiraService'];

    constructor($jira) {
        this.$jira = $jira;
    }

    computeAverageSprintVelocity = (boardId, noOfSprintsForVelocity = 6, storyPointFieldName,
        sprintFieldId, noOfSprintsToPull = noOfSprintsForVelocity * 2, workingDays, statusMap) => new FeedbackPromise(async (resolve, _, progress) => {
            const allClosedSprintLists = await this.$jira.getRapidSprintList([boardId], { state: 'closed' });
            progress({ completed: 2 });
            const closedSprintLists = allClosedSprintLists.slice(0, noOfSprintsToPull).sortBy(({ completeDate }) => completeDate.getTime());
            const availableSprintCount = closedSprintLists.length;

            if (!availableSprintCount) {
                return resolve({ closedSprintLists, averageCommitted: 0, averageCompleted: 0 });
            }

            const boardConfig = await this.$jira.getBoardConfig(boardId);
            const [boardColumnsOrder, statusBoardColMap] = getStatusBoardColMap(statusMap, boardConfig);
            progress({ completed: 4 });

            const sprintIds = closedSprintLists.map(({ id }) => id);

            const sprintWiseIssues = await this.$jira.getSprintIssues(sprintIds, {
                jql: 'issuetype not in subTaskIssueTypes()',
                fields: ['created', 'resolutiondate', storyPointFieldName],
                includeRemoved: true, boardId
            }).progress(done => progress({ completed: done / 2 }));


            const issueLogs = await getIssueLogsForSprints(closedSprintLists, this.$jira, sprintWiseIssues, progress, sprintFieldId, storyPointFieldName);

            for (let index = 0; index < closedSprintLists.length; index++) {
                const sprint = closedSprintLists[index];
                sprint.issues = sprintWiseIssues[sprint.id];

                processSprintData(sprint, issueLogs, { index, noOfSprintsForVelocity, storyPointFieldName, sprintFieldId, closedSprintLists, workingDays, statusBoardColMap });
            }

            const sprintsToConsider = closedSprintLists.slice(-noOfSprintsForVelocity);

            const averageCycleTime = parseFloat((sprintsToConsider.avg(s => s.averageCycleTime)).toFixed(2));
            const averageCommitted = Math.round(sprintsToConsider.avg(s => s.committedStoryPoints));
            const averageCompleted = Math.round(sprintsToConsider.avg(s => s.completedStoryPoints));
            const sayDoRatio = Math.round(sprintsToConsider.avg(s => s.sayDoRatio));

            const previousSprint = closedSprintLists[closedSprintLists.length - 1];
            const boardVelocity = previousSprint?.velocity;
            const velocityGrowth = previousSprint?.velocityGrowth;
            //const diff = Math.abs(averageCommitted - averageCompleted);
            //const median = Math.round(averageCompleted + (diff / 2));
            const logUnavailable = sprintsToConsider.every(s => s.logUnavailable);

            resolve({ boardColumnsOrder, closedSprintLists, averageCommitted, averageCompleted, velocity: boardVelocity, velocityGrowth, sayDoRatio, averageCycleTime, logUnavailable });
        });
}

function processSprintData(sprint, issueLogs, { index, noOfSprintsForVelocity, storyPointFieldName, sprintFieldId, closedSprintLists, workingDays, statusBoardColMap }) {
    const startDate = moment(sprint.startDate);
    const completeDate = moment(sprint.completeDate);

    sprint.committedStoryPoints = 0;
    sprint.completedStoryPoints = 0;
    sprint.sayDoRatio = 0;
    const cycleTimes = [];

    sprint.statusWiseTimeSpent = sprint.issues.reduce(([statusWiseLogs, statusWiseIssueCount], issue, index, issuesList) => {
        const timeSpentInfo = processSprintIssues(sprint, issue, issueLogs[issue.id], cycleTimes, startDate, completeDate, storyPointFieldName, sprintFieldId, workingDays);
        if (timeSpentInfo) {
            const countIncremented = {};
            Object.keys(timeSpentInfo).forEach(status => {
                if (statusBoardColMap) {
                    status = statusBoardColMap[status];
                }

                if (!status) { return; }

                statusWiseLogs[status] = (statusWiseLogs[status] || 0) + timeSpentInfo[status];

                if (!countIncremented[status]) { // While multiple status falls under same column, don't increment count for same issue
                    countIncremented[status] = true;
                    statusWiseIssueCount[status] = (statusWiseIssueCount[status] || 0) + 1;
                }
            });
        }

        if (index === issuesList.length - 1) { // If it is last issue, then return the average status wise time spent log
            return Object.keys(statusWiseLogs).reduce((avgStatusWiseLog, status) => {
                const { [status]: spent } = statusWiseLogs;
                const { [status]: issueCount } = statusWiseIssueCount;

                avgStatusWiseLog[status] = spent / issueCount;

                return avgStatusWiseLog;
            }, {});
        } else {
            return [statusWiseLogs, statusWiseIssueCount];
        }
    }, [{}, {}]);

    sprint.averageCycleTime = cycleTimes.avg();
    sprint.cycleTimesIssuesCount = cycleTimes.length;
    if (sprint.completedStoryPoints) {
        if (sprint.committedStoryPoints > sprint.completedStoryPoints) {
            sprint.sayDoRatio = parseFloat((sprint.completedStoryPoints * 100 / sprint.committedStoryPoints).toFixed(2));
        } else {
            sprint.sayDoRatio = 100;
        }
    }

    if (index) {
        const sprintToCalculate = closedSprintLists.slice(index <= noOfSprintsForVelocity ? 0 : index - noOfSprintsForVelocity);
        sprint.velocity = Math.round(sprintToCalculate.avg(s => s.completedStoryPoints));
        const prevSprint = closedSprintLists[index - 1];
        const prevVelocity = index === 1 ? prevSprint?.completedStoryPoints : prevSprint?.velocity;
        if (prevVelocity) {
            sprint.velocityGrowth = ((sprint.velocity - prevVelocity) * 100) / prevVelocity;
        }
    }
}

// eslint-disable-next-line complexity
function processSprintIssues(sprint, issue, allLogs, cycleTimes, startDate, completeDate, storyPointFieldName, sprintFieldId, workingDays) {
    const { resolutiondate, [storyPointFieldName]: storyPoint, created: issueCreated } = issue.fields;
    issue.fields.storyPoints = storyPoint;
    let $resolutiondate = resolutiondate && moment(resolutiondate);

    if ($resolutiondate && $resolutiondate.isBefore(startDate)) {
        issue.completedOutside = true;
        return;
    }
    const startDateForComparison = startDate.clone().add(3, "seconds"); // This is to avoid any logs automatically added due to moving issue to sprint
    let modifiedWithinSprint = allLogs?.filter(log => moment(log.created).isBetween(startDateForComparison, completeDate, "milliseconds"));

    const sprintFields = modifiedWithinSprint?.filter(log => log.fieldId === sprintFieldId);
    const firstSprintLog = sprintFields?.[0];

    //issue.removedFromSprint = // This would be already set from JiraService
    const isIssueCreatedAfterSprintStart = startDate.isBefore(issueCreated);
    issue.addedToSprint = isIssueCreatedAfterSprintStart
        || (firstSprintLog && !firstSprintLog.from.split(',').some(sid => parseInt(sid) === sprint.id));

    if (issue.addedToSprint) {
        issue.addedToSprintDate = moment(isIssueCreatedAfterSprintStart && !firstSprintLog?.created ? issueCreated : firstSprintLog.created).add(2, "seconds").toDate();
        // start date should be considered from the time the issue is added to sprint for calculation to work accurately
        startDate = moment(issue.addedToSprintDate);
        modifiedWithinSprint = allLogs?.filter(log => moment(log.created).isBetween(startDate, completeDate, "milliseconds"));
    }

    if (!('initialStoryPoints' in issue)) {
        issue.initialStoryPoints = parseFloat(storyPoint) || 0;

        if (allLogs?.length) {
            const spLog = getFirstModifiedLog(modifiedWithinSprint, storyPointFieldName);
            if (spLog) {
                issue.initialStoryPoints = parseFloat(spLog.fromString) || 0;
            } else {
                const spModifiedAfterSprint = allLogs.filter(log => log.fieldId === storyPointFieldName && moment(log.created).isAfter(completeDate))[0];
                if (spModifiedAfterSprint) {
                    issue.initialStoryPoints = parseFloat(spModifiedAfterSprint.fromString) || 0;
                }
            }
        }
    }

    if (modifiedWithinSprint?.length) {
        if (!$resolutiondate || $resolutiondate.isAfter(completeDate)) { // If the issue is reopened after Done, then there would be no resolution date
            const listOfStatusChanges = modifiedWithinSprint.filter(log => log.fieldId === 'status');
            const lastStatus = listOfStatusChanges.length > 0 && listOfStatusChanges[listOfStatusChanges.length - 1];
            const lastStatusText = (lastStatus && lastStatus.toString?.toLowerCase()) || '';

            if (lastStatusText === 'done' || lastStatusText.includes('closed')) {
                $resolutiondate = moment(lastStatus.created); // use the date completed within sprint as resolution date
                console.log('Discrepancy found. Issue status toggled within sprint:', sprint.name, 'issue:', issue.key);
            } else if ($resolutiondate) {
                $resolutiondate = completeDate; // use the sprint completed date as resolution date if the issue is reopened within sprint
                console.log('Discrepancy found. Issue reopened after Done:', sprint.name, 'issue:', issue.key);
            }
        }
    }

    if ($resolutiondate && !issue.removedFromSprint) {
        const hasResolvedWithinSprint = $resolutiondate.isBetween(startDate, completeDate);

        if (hasResolvedWithinSprint && allLogs?.length) {
            const statusLog = getFirstModifiedLog(allLogs, 'status', 'To Do');
            const firstClosed = getFirstModifiedLog(allLogs, 'status', undefined, ['done', 'closed']);
            if (statusLog && (!firstClosed || startDate.isBefore(firstClosed.created))) { // If ticket is once closed before sprint start, then is should not be considered for cycle time
                const dateToUse = completeDate.isBefore($resolutiondate) ? completeDate : $resolutiondate;
                const ct = getDaysDiffForDateRange(statusLog.created, dateToUse, workingDays);
                if (ct > 0) {
                    issue.cycleTime = ct;
                    cycleTimes.push(issue.cycleTime);
                }
            }
        }

        if (hasResolvedWithinSprint) {
            sprint.completedStoryPoints += (storyPoint || 0);
            issue.completed = true;
        } else if (storyPoint) {
            console.log('Discrepancy found. Issue resolution date is in appropriate:', sprint.name, 'issue:', issue.key);
        }
    }

    if (!issue.addedToSprint && issue.initialStoryPoints) {
        sprint.committedStoryPoints += issue.initialStoryPoints;
    }

    if (issue.initialStoryPoints === storyPoint) {
        delete issue.initialStoryPoints;
    }

    return calculateStatusWiseTimeSpent(issue, allLogs, startDate, completeDate, workingDays);
}

function calculateStatusWiseTimeSpent(issue, allLogs, sprintStartDate, sprintEndDate, workingDays) {
    if (!allLogs?.length || issue.removedFromSprint) { return {}; }

    if (issue.addedToSprint && issue.addedToSprintDate) {
        sprintStartDate = moment(issue.addedToSprintDate); // If issue added to sprint later, then consider that as start date
    }

    // filter and simplify status logs for entire duration
    const statusLogs = allLogs.filter(l => l.fieldId === 'status' && moment(l.created).isSameOrBefore(sprintEndDate))
        .map(l => ({ status: l.toString, startDate: moment(l.created) }));
    if (!statusLogs.length) { return {}; }

    const indexOfFirstChangeAfterSprintStart = statusLogs.findIndex(l => l.startDate.isSameOrAfter(sprintStartDate));
    if (indexOfFirstChangeAfterSprintStart > 1) { // See if more than one log is available before start of sprint
        statusLogs.splice(0, indexOfFirstChangeAfterSprintStart - 1); // Keep only the last log which happened before start of sprint
    } else if (indexOfFirstChangeAfterSprintStart === -1) {
        statusLogs.splice(0, statusLogs.length - 1); // Keep only the last log which happened before start of sprint
    }

    if (statusLogs[0].startDate.isBefore(sprintStartDate)) { // If first log has happened before start of sprint, then change it to exact start of sprint
        statusLogs[0].startDate = sprintStartDate;
    }

    const statusWiseTimeSpent = statusLogs.reduce((result, log, i) => {
        const nextLogTime = statusLogs[i + 1]?.startDate ?? sprintEndDate;
        result[log.status] = (result[log.status] || 0) + getDaysDiffForDateRange(log.startDate, nextLogTime, workingDays);
        return result;
    }, {});

    issue.statusWiseTimeSpent = statusWiseTimeSpent;

    return statusWiseTimeSpent;
}

function getFirstModifiedLog(logs, fieldId, fromString, toString) {
    if (!logs?.length) {
        return;
    }

    for (const item of logs) {
        if (item.fieldId === fieldId
            && (!fromString || item.fromString === fromString)
            && (!toString || item.toString === toString || (Array.isArray(toString) && toString.some(v => item.toString?.toLowerCase().includes(v.toLowerCase()))))) {
            return item;
        }
    }
}

async function getIssueLogsForSprints(closedSprintLists, $jira, sprintWiseIssues, updateProgress, sprintFieldId, storyPointFieldName) {
    let issueLogs = {};

    for (let index = 0; index < closedSprintLists.length; index++) {
        const sprint = closedSprintLists[index];
        const firstTimeIssuesToPull = sprintWiseIssues[sprint.id].filter(issue => !issueLogs[issue.key]);
        const issueLogsToPull = firstTimeIssuesToPull.map(({ key }) => key);
        const sprintIssueLogs = await $jira.getBulkIssueChangelogs(issueLogsToPull, ['status', sprintFieldId, storyPointFieldName]);

        // Always add 50%, as 50% is already completed as part of pulling ticket details for sprint. Remaining 50% is for pulling change logs
        updateProgress({ completed: 50 + ((index + 1) * 50 / closedSprintLists.length) });

        if (sprintIssueLogs) {
            issueLogs = { ...issueLogs, ...sprintIssueLogs };
            addRemovedIssuesToMissingSprints(sprintWiseIssues, sprintIssueLogs, sprint.id, firstTimeIssuesToPull, sprintFieldId);
        } else {
            sprint.logUnavailable = true;
        }
    }

    return issueLogs;
}

// If an issue is removed from sprint in between, then Jira does not provide any option to pull those issues.
// So looking at change logs for each issue in sprints, this function will add stories to individual sprints
// This is a workaround primarily for extensions and web versions.
function addRemovedIssuesToMissingSprints(sprintWiseIssues, sprintIssueLogs, currentSprintId, firstTimeIssuesToPull, sprintFieldId) {
    firstTimeIssuesToPull.forEach(issue => {
        const key = issue.key;
        const logsForCurrentTicket = sprintIssueLogs[key]?.filter(l => l.fieldId === sprintFieldId);

        // Take the list of sprints current issue is part of
        const sprintIdsFromCurrentTicket = logsForCurrentTicket?.flatMap(l => [...(l.from?.split(',') || []), ...(l.to?.split(',') || [])]).filter(sid => !!sid).distinct();

        if (!sprintIdsFromCurrentTicket?.length) { return; }

        // Based on list of sprints, add that ticket to all those sprints if that ticket is not already available
        sprintIdsFromCurrentTicket.forEach((sprintId) => {
            if (parseInt(sprintId) === currentSprintId) { return; } // In current sprint already ticket would exist. Hence no need of checking

            const sprintIssues = sprintWiseIssues[sprintId];

            // Its not necessary that sprint for all the sprint id is available in this list
            if (!sprintIssues?.length) { return; }

            if (!sprintIssues.some(t => t.key === key)) {
                sprintIssues.push({ // Clone the issue as it would be mutated later
                    ...issue,
                    fields: { ...(issue.fields || {}) }
                });
            }
        });
    });
}

function getStatusBoardColMap(statusMap, boardConfig) {
    const statusBoardColMap = {};
    const boardColumns = boardConfig?.columnConfig?.columns;
    if (!boardColumns) {
        return;
    }

    const boardColumnsOrder = {};
    boardColumns.forEach((col, i) => {
        const boardColName = col.name;
        boardColumnsOrder[boardColName] = i;

        col.statuses.forEach(s => {
            const statusText = statusMap[s.id];
            if (statusBoardColMap[statusText]) { // This should not happen ideally
                console.error(`Unexpected Error: Status ${statusText} is mapped to ${statusBoardColMap[statusText]} and ${boardColName}`);
            }
            statusBoardColMap[statusText] = boardColName;
        });
    });

    return [boardColumnsOrder, Object.keys(statusBoardColMap).length ? statusBoardColMap : undefined];
}