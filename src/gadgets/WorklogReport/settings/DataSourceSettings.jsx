import React, { useState } from 'react';
import RapidViewList from '../../../components/RapidViewList';
import { renderRadioButton } from './actions';
import { ShowMoreLink } from './Common';

const msgProjTimeFrame = 'Not applicable when timeframe below is selected as Sprint or when no default project is configured';

function DataSourceSettings({ setValue, setBoards, state }) {
    const { userListMode, timeframeType, sprintBoards, projects } = state;

    const disableProjects = timeframeType === '1' || !projects?.length;
    const alertProjTimeFrame = disableProjects && (<span
        className="fa fa-exclamation-triangle msg-warning margin-l-5" title={msgProjTimeFrame} />);

    return (<div className="settings-group">
        <div className="form-group row">
            <label className="col-md-3 col-form-label">User List</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('userListMode', '1', userListMode, setValue)}
                        Show all users who logged work
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('userListMode', '2', userListMode, setValue)}
                        Show only selected users
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('userListMode', '3', userListMode, setValue, { disabled: disableProjects })}
                        Show all users logged work on configured projects {alertProjTimeFrame}
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('userListMode', '4', userListMode, setValue, { disabled: disableProjects })}
                        Show selected users and all worklogs on configured projects {alertProjTimeFrame}
                    </label>
                </div>
            </div>
        </div>
        <div className="form-group row">
            <label className="col-md-3 col-form-label">Time frame type</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('timeframeType', '1', timeframeType, setValue, { disabled: userListMode === '3' || userListMode === '4' })}
                        Based on specific sprint
                        {(userListMode === '3' || userListMode === '4') && <span className="fa fa-exclamation-triangle msg-warning margin-l-5"
                            title="Not applicable based on User List selection above" />}
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('timeframeType', '2', timeframeType, setValue)}
                        Based on selected date range
                    </label>
                </div>
            </div>
        </div>
        {timeframeType === '1' && <SprintListComponent sprintBoards={sprintBoards} setBoards={setBoards} />}
        {timeframeType === '1' && <SprintAdditionalOptions state={state} setValue={setValue} />}
        {timeframeType === '2' && <ReportGrouping state={state} setValue={setValue} userListMode={userListMode} />}
    </div>);
}

export default DataSourceSettings;

const SprintListComponent = React.memo(function ({ setBoards, sprintBoards }) {
    return (<div className="form-group row">
        <label className="col-md-3 col-form-label">Choose Agile board *</label>
        <div className="col-md-9 col-form-label">
            <RapidViewList value={sprintBoards} onChange={setBoards} multiple={true} />
        </div>
    </div>);
});

function ReportGrouping({ setValue, state: { epicField, reportUserGrp, jql }, userListMode }) {
    return (<>
        <div className="form-group row">
            <label className="col-md-3 col-form-label">Users worklog grouping</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('reportUserGrp', '1', reportUserGrp, setValue)}
                        {userListMode === '2' ? 'Use default user groups' : 'Do not group worklogs'}
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('reportUserGrp', '2', reportUserGrp, setValue)}
                        Group worklogs based on project
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('reportUserGrp', '3', reportUserGrp, setValue)}
                        Group worklogs based on Issue type
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('reportUserGrp', '4', reportUserGrp, setValue, { disabled: !epicField })}
                        Group by Epic {!epicField && <span
                            className="fa fa-exclamation-triangle msg-warning margin-l-5"
                            title="JIRA Epic field name must be configured in general settings -> default values tab" />}
                    </label>
                </div>
            </div>
        </div>
        {userListMode === '1' && <div className="col-md-12">
            <strong>Caution:</strong> Pulling worklogs of all the users on a specific timerange could result in pulling huge data and cause performance issues.
            {(jql ? "Ensure you have necessary filters in JQL." : "Use JQL to add additional filters as necessary.")}
        </div>}
    </>);
}

const SprintAdditionalOptions = React.memo(function ({ setValue, state: { sprintStartRounding, sprintEndRounding } }) {
    const [showMore, setShowMore] = useState(false);

    return (<>
        <ShowMoreLink showMore={showMore} setShowMore={setShowMore} />
        {showMore && <div className="form-group row">
            <label className="col-md-3 col-form-label">Sprint start date rounding</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('sprintStartRounding', '1', sprintStartRounding, setValue)}
                        Match exact start date time of sprint
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('sprintStartRounding', '2', sprintStartRounding, setValue)}
                        Consider start of day as start date
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('sprintStartRounding', '3', sprintStartRounding, setValue)}
                        Consider start of next day as start date
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('sprintStartRounding', '4', sprintStartRounding, setValue)}
                        Use end of previous sprint (if available)
                    </label>
                </div>
            </div>
        </div>}
        {showMore && <div className="form-group row">
            <label className="col-md-3 col-form-label">Sprint end date rounding</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('sprintEndRounding', '1', sprintEndRounding, setValue)}
                        Match exact end date time of sprint
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('sprintEndRounding', '2', sprintEndRounding, setValue)}
                        Consider end of day as end date
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('sprintEndRounding', '3', sprintEndRounding, setValue)}
                        Consider end of previous day as end date
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('sprintEndRounding', '4', sprintEndRounding, setValue)}
                        Use start of next sprint (if available)
                    </label>
                </div>
            </div>
        </div>}
    </>);
});