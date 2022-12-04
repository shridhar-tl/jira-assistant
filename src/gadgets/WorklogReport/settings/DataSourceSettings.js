import React from 'react';
import RapidViewList from '../../../components/RapidViewList';
import { renderRadioButton } from './actions';

function DataSourceSettings({ setValue, setBoards, state }) {
    const { userListMode, timeframeType, sprintBoards } = state;

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
            </div>
        </div>
        <div className="form-group row">
            <label className="col-md-3 col-form-label">Time frame</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('timeframeType', '1', timeframeType, setValue)}
                        Based on specific sprint
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('timeframeType', '2', timeframeType, setValue)}
                        Based on selected time range
                    </label>
                </div>
            </div>
        </div>
        {timeframeType === '1' && <SprintListComponent sprintBoards={sprintBoards} setBoards={setBoards} />}
        {userListMode === '1' && timeframeType === '2' && <ReportGrouping state={state} setValue={setValue} />}
    </div>
    );
}

export default DataSourceSettings;

const SprintListComponent = React.memo(function ({ setBoards, sprintBoards }) {
    return (<div className="form-group row">
        <label className="col-md-3 col-form-label">Choose Agile board *</label>
        <div className="col-md-9 col-form-label">
            <RapidViewList value={sprintBoards} onChange={setBoards} />
        </div>
    </div>);
});

function ReportGrouping({ setValue, state: { reportUserGrp, jql } }) {
    return (<>
        <div className="form-group row">
            <label className="col-md-3 col-form-label">Worklogs grouping</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('reportUserGrp', '1', reportUserGrp, setValue)}
                        Do not group worklogs
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
                        {renderRadioButton('reportUserGrp', '4', reportUserGrp, setValue)}
                        Group by Epic (JIRA Epic field name must be configured in general settings)
                    </label>
                </div>
            </div>
        </div>
        <div className="col-md-12">
            <strong>Caution:</strong> Pulling worklogs of all the users on a specific timerange could result in pulling huge data and cause performance issues.
            {(jql ? "Ensure you have necessary filters in JQL." : "Use JQL to add additional filters as necessary.")}
        </div>
    </>);
}