import moment from "moment";

export default class SprintService {
    static dependencies = ['JiraService'];

    constructor($jira) {
        this.$jira = $jira;
    }

    computeAverageSprintVelocity = async (boardId, noOfSprintsForVelocity = 6, storyPointFieldName, noOfSprintsToPull = noOfSprintsForVelocity * 2) => {
        const allClosedSprintLists = await this.$jira.getRapidSprintList([boardId], { state: 'closed' });
        const closedSprintLists = allClosedSprintLists.slice(0, noOfSprintsToPull).sortBy(({ completeDate }) => completeDate.getTime());
        const availableSprintCount = closedSprintLists.length;

        if (!availableSprintCount) {
            return { closedSprintLists, averageCommitted: 0, averageCompleted: 0 };
        }

        const sprintIds = closedSprintLists.map(({ id }) => id);

        const sprintWiseIssues = await this.$jira.getSprintIssues(sprintIds, {
            fields: ['resolutiondate', storyPointFieldName]
        });

        for (let index = 0; index < closedSprintLists.length; index++) {
            const sprint = closedSprintLists[index];
            const startDate = moment(sprint.startDate);
            const completeDate = moment(sprint.completeDate);
            const issues = sprintWiseIssues[sprint.id];

            const issueLogs = await this.$jira.getBulkIssueChangelogs(issues.map(({ key }) => key),
                ['status', storyPointFieldName]);

            sprint.committedStoryPoints = 0;
            sprint.completedStoryPoints = 0;
            sprint.sayDoRatio = 0;
            const cycleTimes = [];

            issues.forEach(issue => {
                const { resolutiondate, [storyPointFieldName]: storyPoint } = issue.fields;
                const $resolutiondate = resolutiondate && moment(resolutiondate);

                const allLogs = issueLogs[issue.id];
                const modifiedWithinSprint = allLogs?.filter(log => moment(log.created).isBetween(startDate, completeDate));

                let initialStoryPoints = storyPoint || 0;

                if (modifiedWithinSprint?.length) {
                    const spLog = getFirstModifiedLog(modifiedWithinSprint, storyPointFieldName);
                    if (spLog) {
                        initialStoryPoints = parseInt(spLog.fromString) || 0;
                    }
                }

                if ($resolutiondate) {
                    if (allLogs?.length) {
                        const statusLog = getFirstModifiedLog(allLogs, 'status', 'To Do');
                        if (statusLog) {
                            issue.fields.cycleTime = $resolutiondate.diff(statusLog.created, 'days');
                            cycleTimes.push(issue.fields.cycleTime);
                        }
                    }

                    if ($resolutiondate.isBetween(startDate, completeDate)) {
                        sprint.completedStoryPoints += (storyPoint || 0);
                    }
                }

                sprint.committedStoryPoints += initialStoryPoints;
            });

            sprint.averageCycleTime = parseFloat((cycleTimes.sum(i => i) / cycleTimes.length).toFixed(2));
            if (sprint.completedStoryPoints) {
                if (sprint.committedStoryPoints > sprint.completedStoryPoints) {
                    sprint.sayDoRatio = parseFloat((sprint.completedStoryPoints * 100 / sprint.committedStoryPoints).toFixed(2));
                } else {
                    sprint.sayDoRatio = 100;
                }
            }

            if (index) {
                const sprints = closedSprintLists.slice(index <= noOfSprintsForVelocity ? 0 : index - noOfSprintsForVelocity, index);
                sprint.averageCommitted = Math.round(sprints.sum(s => s.committedStoryPoints) / sprints.length);
                sprint.velocity = Math.round(sprints.sum(s => s.completedStoryPoints) / sprints.length);
            }
        }

        const sprintsToConsider = closedSprintLists.slice(-noOfSprintsForVelocity);

        const averageCommitted = Math.round(sprintsToConsider.sum(s => s.committedStoryPoints) / sprintsToConsider.length);
        const averageCompleted = Math.round(sprintsToConsider.sum(s => s.completedStoryPoints) / sprintsToConsider.length);
        const sayDoRatio = parseFloat((averageCompleted * 100 / averageCommitted).toFixed(2));
        const diff = Math.abs(averageCommitted - averageCompleted);
        const median = Math.round(averageCompleted + (diff / 2));

        return { closedSprintLists, averageCommitted, median, averageCompleted, sayDoRatio };
    };
}

function getFirstModifiedLog(logs, fieldId, fromString) {
    for (const item of logs) {
        if (item.fieldId === fieldId && (!fromString || item.fromString === fromString)) {
            return item;
        }
    }
}