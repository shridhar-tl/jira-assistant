import React from 'react';
import { InputNumber } from 'primereact/inputnumber';
import { DatePicker } from '../../../controls';
import { renderCheckbox } from './actions';

function LogFilterSettings({ setValue, state: { logFilterType, filterThrsType, filterDays, filterDate, wlDateSelection } }) {
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
            <label className="col-md-3 col-form-label">Date selection</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderCheckbox('wlDateSelection', '1', wlDateSelection, setValue)}
                        Use updated date of worklog if its modified after creation
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderCheckbox('wlDateSelection', '2', wlDateSelection, setValue)}
                        Always use worklog creation date only
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
                <InputNumber className="form-check-input" value={filterDays} maxLength={3} maxFractionDigits={0}
                    onValueChange={({ value }) => setValue("filterDays", value)} />
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
