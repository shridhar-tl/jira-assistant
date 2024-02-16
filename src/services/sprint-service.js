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
        const storyPointFieldForQuery = storyPointFieldName.startsWith('customfield_')
            ? `cf[${storyPointFieldName.split('_')[1]}]`
            : storyPointFieldName;

        const sprintWiseIssues = await this.$jira.getSprintIssues(sprintIds, {
            jql: `${storyPointFieldForQuery} > 0`,
            fields: ['resolutiondate', storyPointFieldName]
        });

        closedSprintLists.forEach((sprint, index) => {
            const startDate = moment(sprint.startDate);
            const completeDate = moment(sprint.completeDate);
            const issues = sprintWiseIssues[sprint.id];

            sprint.committedStoryPoints = 0;
            sprint.completedStoryPoints = 0;

            issues.forEach(issue => {
                const { resolutiondate, [storyPointFieldName]: storyPoint } = issue.fields;

                if (resolutiondate && moment(resolutiondate).isBetween(startDate, completeDate)) {
                    sprint.completedStoryPoints += storyPoint;
                }

                sprint.committedStoryPoints += storyPoint;
            });

            sprint.sayDoRatio = parseFloat((sprint.completedStoryPoints * 100 / sprint.committedStoryPoints).toFixed(2));

            if (index) {
                const sprints = closedSprintLists.slice(index <= noOfSprintsForVelocity ? 0 : index - noOfSprintsForVelocity, index);
                sprint.averageCommitted = Math.round(sprints.sum(s => s.committedStoryPoints) / sprints.length);
                sprint.velocity = Math.round(sprints.sum(s => s.completedStoryPoints) / sprints.length);
            }
        });

        const sprintsToConsider = closedSprintLists.slice(-noOfSprintsForVelocity);

        const averageCommitted = Math.round(sprintsToConsider.sum(s => s.committedStoryPoints) / sprintsToConsider.length);
        const averageCompleted = Math.round(sprintsToConsider.sum(s => s.completedStoryPoints) / sprintsToConsider.length);
        const sayDoRatio = parseFloat((averageCompleted * 100 / averageCommitted).toFixed(2));
        const diff = Math.abs(averageCommitted - averageCompleted);
        const median = Math.round(averageCompleted + (diff / 2));

        return { closedSprintLists, averageCommitted, median, averageCompleted, sayDoRatio };
    };
}