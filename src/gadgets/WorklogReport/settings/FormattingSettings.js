import React, { useState } from 'react';
import { renderRadioButton } from './actions';
import { ShowMoreLink } from './Common';

function FormattingSettings({ setValue, state, state: { logFormat, timeZone, daysToHide } }) {
    const [showMore, setShowMore] = useState(false);

    return (<div className="settings-group">
        <div className="form-group row">
            <label className="col-md-3 col-form-label">Report timezone (experimental)</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('timeZone', '1', timeZone, setValue)}
                        Use my local time zone for all users
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('timeZone', '2', timeZone, setValue)}
                        Use containing groups timezone for all users
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('timeZone', '3', timeZone, setValue)}
                        Use individual users timezone
                    </label>
                </div>
            </div>
        </div>
        <div className="form-group row">
            <label className="col-md-3 col-form-label">Days to hide in Daywise view</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('daysToHide', '1', daysToHide, setValue)}
                        Show all days
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('daysToHide', '2', daysToHide, setValue)}
                        Hide non working days without worklog
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('daysToHide', '3', daysToHide, setValue)}
                        Hide all days without worklog
                    </label>
                </div>
            </div>
        </div>
        <div className="form-group row">
            <label className="col-md-3 col-form-label">Log hour format</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('logFormat', '1', logFormat, setValue)}
                        Format hours (2h 30m)
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('logFormat', '2', logFormat, setValue)}
                        Show as number (2.5)
                    </label>
                </div>
            </div>
        </div>

        <ShowMoreLink showMore={showMore} setShowMore={setShowMore} />
        {showMore && <MoreFormattingSettings setValue={setValue} state={state} />}
    </div>);
}

export default FormattingSettings;

function MoreFormattingSettings({ setValue, state: { breakupMode, userDisplayFormat, rIndicator } }) {
    return (<>
        <div className="form-group row">
            <label className="col-md-3 col-form-label">User display format</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('userDisplayFormat', '1', userDisplayFormat, setValue)}
                        Show user display name only
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('userDisplayFormat', '2', userDisplayFormat, setValue)}
                        Show user display name with avatar
                    </label>
                </div>
            </div>
        </div>
        <div className="form-group row">
            <label className="col-md-3 col-form-label">Log breakup</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('breakupMode', '1', breakupMode, setValue)}
                        Single entry (Sum worklog added for same ticket on same day)
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('breakupMode', '2', breakupMode, setValue)}
                        Individual entry (Display individual entry for each of the worklog)
                    </label>
                </div>
            </div>
        </div>
        <div className="form-group row">
            <label className="col-md-3 col-form-label">Range indicator</label>
            <div className="col-md-9 col-form-label">
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('rIndicator', '1', rIndicator, setValue)}
                        Show thermometer as indicator
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('rIndicator', '2', rIndicator, setValue)}
                        Highlight background as indicator
                    </label>
                </div>
                <div className="form-check">
                    <label className="form-check-label">
                        {renderRadioButton('rIndicator', '0', rIndicator, setValue)}
                        Do not show any indicator
                    </label>
                </div>
            </div>
        </div>
    </>);
}