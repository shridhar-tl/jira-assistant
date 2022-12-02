import React from 'react';
import RapidViewList from '../../../components/RapidViewList';
import { DatePicker } from '../../../controls';
import { renderCheckbox } from './actions';

function DataSourceSettings({ setValue, setBoards, state }) {
    const { userListMode, timeframeType, dateRange, sprintBoards } = state;

    return (<div className="settings-group">
        <div className="form-group row">
            <label className="col-md-3 col-form-label">User List</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderCheckbox('userListMode', '1', userListMode, setValue)}
                        Show all users who logged work
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderCheckbox('userListMode', '2', userListMode, setValue)}
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
                        {renderCheckbox('timeframeType', '1', timeframeType, setValue)}
                        Based on specific sprint
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderCheckbox('timeframeType', '2', timeframeType, setValue)}
                        Based on selected time range
                    </label>
                </div>
            </div>
        </div>
        <TimeFrameComponent timeframeType={timeframeType} dateRange={dateRange} sprintBoards={sprintBoards} setValue={setValue} setBoards={setBoards} />
        <ReportGrouping state={state} setValue={setValue} />
    </div>
    );
}

export default DataSourceSettings;


function TimeFrameComponent({ timeframeType, dateRange, sprintBoards, setValue, setBoards }) {
    if (timeframeType === '2') {
        return (<DateRangeComponent dateRange={dateRange} setValue={setValue} />);
    } else {
        return (<SprintListComponent sprintBoards={sprintBoards} setBoards={setBoards} />);
    }
}

function DateRangeComponent({ setValue, dateRange }) {
    return (<div className="form-group row">
        <label className="col-md-3 col-form-label">Choose date range</label>
        <div className="col-md-9 col-form-label">
            <label className="form-check-label">
                <DatePicker value={dateRange} range={true} onChange={(val) => setValue('dateRange', val)} />
            </label>
        </div>
    </div>);
}

const SprintListComponent = React.memo(function ({ setBoards, sprintBoards }) {
    return (<div className="form-group row">
        <label className="col-md-3 col-form-label">Choose Agile board</label>
        <div className="col-md-9 col-form-label">
            <RapidViewList value={sprintBoards} onChange={setBoards} />
        </div>
    </div>);
});

function ReportGrouping({ setValue, state: { userListMode, timeframeType, reportUserGrp, jql } }) {
    if (userListMode !== '1' || timeframeType !== '2') {
        return null;
    }

    return (<>
        <div className="form-group row">
            <label className="col-md-3 col-form-label">User grouping</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderCheckbox('reportUserGrp', '1', reportUserGrp, setValue)}
                        Do not group the users
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderCheckbox('reportUserGrp', '2', reportUserGrp, setValue)}
                        Group the users based on project
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