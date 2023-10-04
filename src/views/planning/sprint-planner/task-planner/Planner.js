import moment from 'moment';
import {
    GanttComponent, DayMarkers, Inject,
    Selection, Toolbar, Edit, ColumnsDirective, ColumnDirective,
    EventMarkersDirective, EventMarkerDirective
} from '@syncfusion/ej2-react-gantt';
import { connect } from '../store';
import { IssueDisplay } from '../../../../display-controls';
import { taskBarEdited } from '../handlers/index';

const resourceFields = {
    id: 'id',
    name: 'displayName',
    unit: 'unit'
};

const taskFields = {
    id: 'id',
    display: 'source',
    summary: 'summary',
    startDate: 'startDate',
    duration: 'duration',
    progress: 'progress',
    endDate: 'endDate',
    dependency: 'dependency',
    resourceInfo: 'resources',
    child: 'child',
    manual: 'isManual',
    segments: 'segments'
};
const labelSettings = {
    leftLabel: 'resources'
};
const splitterSettings = {
    position: "35%"
};
const editSettings = {
    allowAdding: true,
    allowEditing: true,
    allowDeleting: true,
    allowTaskbarEditing: true,
    showDeleteConfirmDialog: true
};
const toolbar = ['Add', 'Edit', 'Update', 'Delete', 'Cancel', 'ExpandAll', 'CollapseAll'];

function Planner({
    height, sprintLists, planStartDate, planEndDate, planningData, resources,
    taskBarEdited }) {
    return (<div className="ja-plan-container">
        <GanttComponent id='JASprintPlanner' dataSource={planningData} treeColumnIndex={1}
            allowSelection={true} resourceFields={resourceFields}
            highlightWeekends={true} toolbar={toolbar} editSettings={editSettings}
            splitterSettings={splitterSettings}
            height={height} taskMode='Custom' taskFields={taskFields}
            labelSettings={labelSettings} resources={resources}
            projectStartDate={planStartDate} projectEndDate={planEndDate}
            actionComplete={taskBarEdited}>
            <ColumnsDirective>
                <ColumnDirective field='id' visible={false} />
                <ColumnDirective field='display' headerText='Task / Activity'
                    width="200" template={DisplayTemplate}></ColumnDirective>
                <ColumnDirective field='summary' headerText='Summary' width="300" allowEditing={false} />
                <ColumnDirective field='resources' headerText='Resources' width="300" />
                <ColumnDirective field='effort' headerText='Effort' allowEditing={false} />
                <ColumnDirective field='sprint' headerText='Sprint' allowEditing={false} />
            </ColumnsDirective>
            <EventMarkersDirective>
                {sprintLists?.map(s => <EventMarkerDirective key={s.id} label={s.name}
                    day={moment(s.endDate).endOf('day').toDate()} />)}
            </EventMarkersDirective>
            <Inject services={[Edit, Selection, Toolbar, DayMarkers]} />
        </GanttComponent>
    </div>);
}

export default connect(Planner,
    ({ sprintLists, planStartDate, planEndDate, planningData, resources }) =>
        ({ sprintLists, planStartDate, planEndDate, planningData, resources }),
    { taskBarEdited });

function DisplayTemplate(props) {
    const { taskData: { rowType, source } } = props;

    if (rowType === 'status') {
        return source.name;
    } else {
        return (<IssueDisplay value={source} tag="span"
            settings={{ showStatus: false }}
        />);
    }
}