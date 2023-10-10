import React from 'react';
import GanttChart from 'src/components/gantt-chart';
import { IssueDisplay, UserDisplay } from 'src/display-controls';
import { connect } from '../store';
import { addTaskProgress, updateTaskResized, beginTaskEdit, plannerTaskPropertyName } from './actions';
import AddTaskPlanDialog from './AddTaskPlanDialog';
import moment from 'moment';
import { getUserName } from 'src/common/utils';

const columnsList = [
    { field: 'display', headerText: 'Task / Activity', width: 200, template: DisplayTemplate },
    { field: 'fields.summary', headerText: 'Summary', width: 300 },
    { field: 'assignee', headerText: 'Assignee', width: 300, template: AssigneeTemplate }
];

function SprintPlanner({
    height, sprintLists, planStartDate, planEndDate, planningData, resources,
    taskBarEdited, epicList, showTaskEditor,
    $userutils }) {
    const resourceMap = React.useMemo(() => resources.reduce((map, r) => {
        map[getUserName(r)] = r;
        return map;
    }, {}), [resources]);

    return (<div className="ja-plan-container">
        <GanttChart height={height} columns={columnsList}
            items={epicList}
            fromDate={planStartDate} toDate={planEndDate}
            isDayHoliday={$userutils.isHoliday}
            onAddTask={addTaskProgress}
            onTaskResized={updateTaskResized}
            onTaskEdit={beginTaskEdit}
            getItemTaskDetails={getIssueTaskDetails}
            taskDetailTemplate={TaskTemplate}
            taskDetailTemplateArgs={resourceMap}
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

function AssigneeTemplate(props) {
    const { taskData: { fields: { assignee } } } = props;

    return (<UserDisplay value={assignee} tag="span" imgClassName="img-x28" settings={{ showImage: true }} />);
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

function TaskTemplate({ item, args, task: { resources } }) {
    return (<>
        <ResourceView resources={resources} resourceMap={args} />
    </>);
}

function ResourceView({ resources, resourceMap }) {
    const resource = resourceMap[resources[0]];
    const { displayName, avatarUrls: { '24x24': imageUrl } = {} } = resource || {};

    return (<figure className="profile-picture p-1">
        <img src={imageUrl} alt={displayName} title={displayName}
            className="rounded-circle img-x26" />
        {resources.length > 1 && <span style={{ marginLeft: '-6px' }}
            className="badge bg-warning font-bold text-dark">+{resources.length - 1}</span>}
    </figure>);
}