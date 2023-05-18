import moment from 'moment';
import {
    GanttComponent, DayMarkers, Inject,
    Selection, Toolbar, Edit, ColumnsDirective, ColumnDirective,
    EventMarkersDirective, EventMarkerDirective
} from '@syncfusion/ej2-react-gantt';
import { connect } from './store';
import { IssueDisplay } from '../../../display-controls';

const resourceFields = {
    id: 'id',
    name: 'displayName',
    unit: 'unit'
};

function Planner({ sprintLists, planStartDate, planEndDate, planningData, resources }) {
    const taskFields = {
        id: 'id',
        display: 'source',
        summary: 'summary',
        startDate: 'startDate',
        duration: 'duration',
        progress: 'progress',
        endDate: 'endDate',
        dependency: 'predecessor',
        resourceInfo: 'resources',
        child: 'child',
        manual: 'isManual',
        segments: 'segments'
    };
    const labelSettings = {
        leftLabel: 'Shridhar'
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

    return (<div className="ja-plan-container"><div className='control-pane'>
        <div className='control-section'>
            <GanttComponent id='TaskMode' dataSource={planningData} treeColumnIndex={1}
                allowSelection={true} resourceFields={resourceFields}
                highlightWeekends={true} toolbar={toolbar} editSettings={editSettings}
                splitterSettings={splitterSettings}
                height='100%' taskMode='Custom' taskFields={taskFields}
                labelSettings={labelSettings}
                projectStartDate={planStartDate} projectEndDate={planEndDate}
                resources={resources}
            >
                <ColumnsDirective>
                    <ColumnDirective field='id' visible={false} />
                    <ColumnDirective field='display' headerText='User / Task'
                        width="200" template={DisplayTemplate}></ColumnDirective>
                    <ColumnDirective field='summary' headerText='Summary' width="300" />
                    <ColumnDirective field='resource' headerText='Resource' width="300" />
                    <ColumnDirective field='effort' headerText='Effort'></ColumnDirective>
                    <ColumnDirective field='sprint' headerText='Sprint'></ColumnDirective>
                </ColumnsDirective>
                <EventMarkersDirective>
                    {sprintLists?.map(s => (<EventMarkerDirective key={s.id} day={moment(s.endDate).endOf('day').toDate()} label={s.name} />))}
                </EventMarkersDirective>
                <Inject services={[Edit, Selection, Toolbar, DayMarkers]} />
            </GanttComponent>
        </div>

    </div></div>);
}

export default connect(Planner,
    ({ sprintLists, planStartDate, planEndDate, planningData, resources }) =>
        ({ sprintLists, planStartDate, planEndDate, planningData, resources }));

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