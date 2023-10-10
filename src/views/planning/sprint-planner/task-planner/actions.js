import { inject } from "src/services";
import { usePlannerState } from "../store";
import moment from "moment";

export const plannerTaskPropertyName = 'ja_planner_tasks';

export function addTaskProgress(issue, startDate, endDate) {
    usePlannerState.setState({
        editedProgressObject: {
            issue,
            startDate, endDate,
            state: {
                resources: [],
                startDate: startDate.date,
                endDate: endDate.date
            }
        }
    });
}

export function beginTaskEdit(issue, index) {
    usePlannerState.setState({
        editedProgressObject: {
            issue,
            index,
            state: issue.properties[plannerTaskPropertyName][index]
        }
    });
}

export async function updateTaskResized(issue, index, startDate, endDate) {
    const taskList = issue.properties[plannerTaskPropertyName];
    const task = taskList[index];

    task.startDate = startDate.date;
    task.endDate = endDate.date;

    await updateIssueTaskProperty(issue, taskList);
}

export async function saveEditedObject(_, value) {
    const { editedProgressObject: { issue, index } } = usePlannerState.getState();

    cancelEdit();

    const taskList = issue.properties[plannerTaskPropertyName] || [];
    if (index >= 0) {
        taskList[index] = value;
    } else {
        taskList.push(value);
    }

    await updateIssueTaskProperty(issue, taskList);
}

function updateIssueTaskProperty(issue, value) {
    value = value?.sortBy(task => {
        const { startDate, endDate } = task;
        const noOfDays = moment(endDate).diff(startDate, 'days');

        return moment(startDate).valueOf() + noOfDays;
    }).map(prepareTaskForSave);

    const { $jira } = inject('JiraService');

    issue.properties[plannerTaskPropertyName] = value;

    return $jira.updateProperty(issue.key, plannerTaskPropertyName, value);
}

function prepareTaskForSave(task) {
    const { resources, startDate, endDate } = task;

    return {
        resources,
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
    };
}

export function cancelEdit() {
    usePlannerState.setState({ editedProgressObject: null });
}