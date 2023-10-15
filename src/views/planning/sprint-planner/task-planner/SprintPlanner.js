import React from 'react';
import moment from 'moment';
import { getUserName } from 'src/common/utils';
import GanttChart from 'src/components/gantt-chart';
import { IssueDisplay, UserDisplay } from 'src/display-controls';
import { connect } from '../store';
import { plannerTaskPropertyName } from '../store/constants';
import { addTaskProgress, updateTaskResized, beginTaskEdit } from './actions';
import AddTaskPlanDialog from './AddTaskPlanDialog';

const columnsList = [
    { field: 'display', headerText: 'Task / Activity', width: 200, template: DisplayTemplate },
    { field: 'fields.summary', headerText: 'Summary', width: 300 },
    { field: 'assignee', headerText: 'Assignee', width: 300, template: AssigneeTemplate }
];

function SprintPlanner({
    height, sprintLists, planStartDate, planEndDate, resources,
    epicList, showTaskEditor, $userutils }) {
    const milestones = React.useMemo(() => sprintLists.map(s => ({ date: s.endDate, name: s.name })), [sprintLists]);
    const resourceMap = React.useMemo(() => resources.reduce((map, r) => {
        map[getUserName(r)] = r;
        return map;
    }, {}), [resources]);

    return (<div className="ja-plan-container absolute">
        <GanttChart height={height} columns={columnsList} markers={milestones}
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
        return getParentTaskDetails(issue, planStartDate);
    }

    return generateIssueTaskDetails(issue, planStartDate);
}

function generateIssueTaskDetails(issue, planStartDate) {
    if (issue.taskDetails) {
        return { taskDetails: issue.taskDetails };
    }

    const { [plannerTaskPropertyName]: tasks } = issue.properties;

    const taskDetails = tasks?.map((t, i) => getTaskDetail(issue, t, planStartDate, i, tasks.length));

    issue.taskDetails = taskDetails;

    return { taskDetails };
}

function getParentTaskDetails(epic, planStartDate) {
    if (epic.taskDetails) {
        return { allowAdd: false, taskDetails: epic.taskDetails };
    }

    const taskDetail = epic.child.reduce((result, issue) => {
        issue.epicKey = epic.key;
        const { taskDetails } = generateIssueTaskDetails(issue, planStartDate);
        if (!taskDetails?.length) {
            return result;
        }

        const firstTask = taskDetails[0];
        const lastTask = taskDetails[taskDetails.length - 1];

        if (!result.startCol || result.startCol > firstTask.startCol) {
            if (result.noOfDays) {
                const curNoOfDays = (result.startCol + result.noOfDays) - firstTask.startCol;
                if (result.noOfDays < curNoOfDays) {
                    result.noOfDays = curNoOfDays;
                }
            }
            result.startCol = firstTask.startCol;

        }

        if (!result.noOfDays || result.noOfDays < firstTask.noOfDays) {
            result.noOfDays = firstTask.noOfDays;
        }

        const actualEndCol = lastTask.startCol + lastTask.noOfDays;

        const actualNoOfDays = actualEndCol - result.startCol;

        if (actualNoOfDays > result.noOfDays) {
            result.noOfDays = actualNoOfDays;
        }

        return result;
    }, { allowEdit: false, resources: [] });

    epic.taskDetails = taskDetail.noOfDays ? [taskDetail] : [];

    return { allowAdd: false, taskDetails: epic.taskDetails };
}

function getTaskDetail(issue, task, planStartDate, index, count) {
    const { startDate, endDate, resources } = task;
    const $startDate = moment(startDate);
    const startCol = $startDate.diff(planStartDate, 'days');
    const noOfDays = moment(endDate).diff($startDate, 'days') + 1;

    return {
        startCol, noOfDays, resources,
        taskId: `task-bar-${issue.key}-${index === 0 ? 'first' : (index === count - 1 ? 'last' : index)}`
    };
}

function TaskTemplate({ item, args, task: { resources } }) {
    return (<>
        <ResourceView resources={resources} resourceMap={args} />
    </>);
}

function ResourceView({ resources, resourceMap }) {
    const firstResource = resources[0]?.id;
    const resource = firstResource && resourceMap[firstResource];
    const { displayName, avatarUrls: { '24x24': imageUrl } = {} } = resource || {};

    return (<figure className="profile-picture p-1">
        <img src={imageUrl} alt={displayName} title={displayName}
            className="rounded-circle img-x26" />
        {resources.length > 1 && <span style={{ marginLeft: '-6px' }}
            className="badge bg-warning font-bold text-dark">+{resources.length - 1}</span>}
    </figure>);
}