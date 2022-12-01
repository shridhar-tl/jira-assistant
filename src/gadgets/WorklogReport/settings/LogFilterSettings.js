import React from 'react';
import { DatePicker, TextBox } from '../../../controls';
import { renderCheckbox } from './actions';

function LogFilterSettings({ setValue, state: { logFilterType, filterThrsType, filterDays, filterDate } }) {
    return (<div className="settings-group">
        <div className="form-group row">
            <label className="col-md-3 col-form-label">Filter worklogs by creation/updation</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderCheckbox('logFilterType', '1', logFilterType, setValue)}
                        Show all worklogs
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderCheckbox('logFilterType', '2', logFilterType, setValue)}
                        Show worklogs logged before the threshold
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderCheckbox('logFilterType', '3', logFilterType, setValue)}
                        Show worklogs logged after the threshold
                    </label>
                </div>
            </div>
        </div>
        <div className="form-group row">
            <label className="col-md-3 col-form-label">Threshold type</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderCheckbox('filterThrsType', '1', filterThrsType, setValue)}
                        X number of days from the log date
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderCheckbox('filterThrsType', '2', filterThrsType, setValue)}
                        X number of days from the last date
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderCheckbox('filterThrsType', '3', filterThrsType, setValue)}
                        On a specific date selected
                    </label>
                </div>
            </div>
        </div>
        {filterThrsType !== '3' && <div className="form-group row">
            <label className="col-md-3 col-form-label">Threshold days</label>
            <div className="col-md-9">
                <TextBox className="form-check-input" value={filterDays} onChange={(val) => setValue("filterDays", val)} />
            </div>
        </div>}
        {filterThrsType === '3' && <div className="form-group row">
            <label className="col-md-3 col-form-label">Threshold date</label>
            <div className="col-md-9">
                <DatePicker value={filterDate} onChange={(val) => setValue('filterDate', val)} />
            </div>
        </div>}
        <div>
            <strong>Info:</strong> This tab lets to filter the worklog based on the date when the worklog was created/updated by the user.
            This would help you to eliminate or identify worklogs added after a threshold date.
        </div>
        <br />
        <div>
            <strong>Note:</strong> Changes in this tab would reflect only after you refresh the report.
        </div>
    </div >
    );
}

export default LogFilterSettings;
