import moment from "moment";
import FeedbackPromise from "src/common/FeedbackPromise";
import { getDaysDiffForDateRange } from "src/utils/date";

export default class SprintService {
    static dependencies = ['JiraService'];

    constructor($jira) {
        this.$jira = $jira;
    }

    computeAverageSprintVelocity = (boardId, noOfSprintsForVelocity = 6, storyPointFieldName,
        sprintFieldId, noOfSprintsToPull = noOfSprintsForVelocity * 2, workingDays) => new FeedbackPromise(async (resolve, _, progress) => {
            const allClosedSprintLists = await this.$jira.getRapidSprintList([boardId], { state: 'closed' });
            progress({ completed: 5 });
            const closedSprintLists = allClosedSprintLists.slice(0, noOfSprintsToPull).sortBy(({ completeDate }) => completeDate.getTime());
            const availableSprintCount = closedSprintLists.length;

            if (!availableSprintCount) {
                return resolve({ closedSprintLists, averageCommitted: 0, averageCompleted: 0 });
            }

            const sprintIds = closedSprintLists.map(({ id }) => id);

            const sprintWiseIssues = await this.$jira.getSprintIssues(sprintIds, {
                jql: 'issuetype not in subTaskIssueTypes()',
                fields: ['created', 'resolutiondate', storyPointFieldName],
                includeRemoved: true, boardId
            }).progress(done => progress({ completed: done / 2 }));

            const issueLogs = await getIssueLogsForSprints(closedSprintLists, this.$jira, sprintWiseIssues, progress, sprintFieldId, storyPointFieldName);

            for (let index = 0; index < closedSprintLists.length; index++) {
                const sprint = closedSprintLists[index];
                const startDate = moment(sprint.startDate);
                const completeDate = moment(sprint.completeDate);
                sprint.issues = sprintWiseIssues[sprint.id];

                sprint.committedStoryPoints = 0;
                sprint.completedStoryPoints = 0;
                sprint.sayDoRatio = 0;
                const cycleTimes = [];

                sprint.issues.forEach(issue => { // eslint-disable-line complexity
                    const { resolutiondate, [storyPointFieldName]: storyPoint, created: issueCreated } = issue.fields;
                    issue.fields.storyPoints = storyPoint;
                    let $resolutiondate = resolutiondate && moment(resolutiondate);

                    if ($resolutiondate && $resolutiondate.isBefore(startDate)) {
                        issue.completedOutside = true;
                        return;
                    }

                    const allLogs = issueLogs[issue.id];
                    const modifiedWithinSprint = allLogs?.filter(log => moment(log.created).isBetween(startDate, completeDate));

                    const sprintFields = modifiedWithinSprint?.filter(log => log.fieldId === sprintFieldId);
                    const firstSprintLog = sprintFields?.[0];
                    //const lastSprintLog = sprintFields?.[0];

                    //issue.removedFromSprint = lastSprintLog && !lastSprintLog.to.split(',').some(sid => parseInt(sid) === sprint.id);
                    issue.addedToSprint = startDate.isBefore(issueCreated)
                        || (firstSprintLog && !firstSprintLog.from.split(',').some(sid => parseInt(sid) === sprint.id));

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

                    if (!issue.addedToSprint) {
                        sprint.committedStoryPoints += issue.initialStoryPoints;
                    }

                    if (issue.initialStoryPoints === storyPoint) {
                        delete issue.initialStoryPoints;
                    }
                });

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

            resolve({ closedSprintLists, averageCommitted, averageCompleted, velocity: boardVelocity, velocityGrowth, sayDoRatio, averageCycleTime, logUnavailable });
        });
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
            issueLogs = { ...sprintIssueLogs };
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