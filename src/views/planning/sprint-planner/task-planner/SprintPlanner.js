import React from 'react';
import GanttChart from 'src/components/gantt-chart';
import { IssueDisplay } from 'src/display-controls';
import { connect } from '../store';
import { addTaskProgress, updateTaskResized, plannerTaskPropertyName } from './actions';
import AddTaskPlanDialog from './AddTaskPlanDialog';
import moment from 'moment';

const columnsList = [
    { field: 'display', headerText: 'Task / Activity', width: 200, template: DisplayTemplate },
    { field: 'fields.summary', headerText: 'Summary', width: 300 },
    { field: 'resources', headerText: 'Resources', width: 300 },
    { field: 'effort', headerText: 'Effort', width: 300 }
];

function SprintPlanner({
    height, sprintLists, planStartDate, planEndDate, planningData, resources,
    taskBarEdited, epicList, showTaskEditor,
    $userutils }) {
    return (<div className="ja-plan-container">
        <GanttChart height={height} columns={columnsList}
            items={epicList}
            fromDate={planStartDate} toDate={planEndDate}
            isDayHoliday={$userutils.isHoliday}
            onAddTask={addTaskProgress}
            onTaskResized={updateTaskResized}
            getItemTaskDetails={getIssueTaskDetails}
            taskDetailTemplate={TaskTemplate}
            taskDetailTemplateArgs={resources}
        />
        {showTaskEditor && <AddTaskPlanDialog />}
    </div>);
}

export default connect(SprintPlanner,
    ({ sprintLists, planStartDate, planEndDate, planningData, resources, epicList, editedProgressObject }) =>
    ({
        sprintLists, planStartDate, planEndDate, planningData,
        resources, epicList, showTaskEditor: !!editedProgressObject
    }), null,
    ['UserUtilsService']
);

function DisplayTemplate(props) {
    const { taskData: issue } = props;

    return (<IssueDisplay value={issue} tag="span"
        settings={{ showStatus: false }}
    />);
}

function getIssueTaskDetails(issue, columns) {
    const [{ date: planStartDate }] = columns;

    if (issue.child) {
        return { allowAdd: false, taskDetails: [] }; // ToDo: generate task details based on child
    }

    const { [plannerTaskPropertyName]: taskDetails } = issue.properties;

    return { taskDetails: taskDetails?.map(t => getTaskDetail(t, planStartDate)) };
}

function getTaskDetail(task, planStartDate) {
    const { startDate, endDate, resources } = task;
    const $startDate = moment(startDate);
    const startCol = $startDate.diff(planStartDate, 'days');
    const noOfDays = moment(endDate).diff($startDate, 'days') + 1;

    return { startCol, noOfDays, resources };
}

function TaskTemplate({ item, task: { resources } }) {
    return (<div>

    </div>);
}