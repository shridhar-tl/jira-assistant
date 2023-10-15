import { Sidebar } from 'primereact/sidebar';
import Workspace from '../../../components/Workspace';
import { connect } from './store';
import { setWorkSpace, setCalendar } from './store/settings.actions';
import WikiCalendar from '../../../components/WikiCalendar';

function Settings({ visible, onHide }) {
    return (<Sidebar visible={visible} position="right" onHide={onHide}>
        <div className="ja-planner-settings">
            <CalendarSettings />
        </div>
    </Sidebar>);
}

export default connect(Settings);

const CalendarSettings = connect(function ({ workspace,
    leaveCalendar, holidayCalendar,
    setWorkSpace, setCalendar }) {
    return (<div className="calendar-config">
        <h3>Calendar configurations</h3>
        <div>
            <div className="row">
                <div className="col-12">
                    <strong>Confluence Workspace</strong>
                </div>
                <div className="col-12">
                    <div className="form-group">
                        <Workspace value={workspace} onChange={setWorkSpace} />
                        <span className="help-block">Workspace to pull calendar from</span>
                    </div>
                </div>

                <div className="col-12">
                    <strong>Leave calendars</strong>
                </div>
                <div className="col-12">
                    <div className="form-group">
                        <WikiCalendar value={leaveCalendar} field="leaveCalendar" workspace={workspace} onChange={setCalendar} />
                        <span className="help-block">Entries considered as leave for individual resources</span>
                    </div>
                </div>

                <div className="col-12">
                    <strong>Holiday calendars</strong>
                </div>
                <div className="col-12">
                    <div className="form-group">
                        <WikiCalendar value={holidayCalendar} field="holidayCalendar" workspace={workspace} onChange={setCalendar} />
                        <span className="help-block">Events considered as holiday for all resource</span>
                    </div>
                </div>
            </div>
        </div>
    </div>);
}, ({
    settings: { workspace, leaveCalendar, holidayCalendar } }) =>
    ({ workspace, leaveCalendar, holidayCalendar }),
    { setWorkSpace, setCalendar });