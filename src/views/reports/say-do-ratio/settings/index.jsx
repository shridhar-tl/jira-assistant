import React from 'react';
import SideBar from '../../pivot-report/editor/SideBar';
import RapidViewList from '../../../../components/RapidViewList';
import { Button, Checkbox, TextBox } from 'src/controls';

function ReportSettings({ settings: actualSettings, show, onHide, onDone }) {
    const [settings, updateSettings] = React.useState(actualSettings);
    const [isLoading, setIsLoading] = React.useState(false);
    const $this = React.useRef({});
    $this.current.settings = settings;
    $this.current.onDone = onDone;

    const handleChange = React.useCallback((newSettings) => {
        const newState = { ...$this.current.settings, ...newSettings };
        updateSettings(newState);
    }, []);
    const setSprintBoards = React.useCallback((sprintBoards) => handleChange({ sprintBoards }), [handleChange]);
    const setNumeric = React.useCallback((value, field) => handleChange({ [field]: parseInt(value) || '' }), [handleChange]);
    const setBoolean = React.useCallback((value, field) => handleChange({ [field]: !!value }), [handleChange]);

    const generateReport = React.useCallback(() => {
        setIsLoading(true);
        $this.current.onDone($this.current.settings).finally(() => setIsLoading(false));
    }, []);

    const allowGeneratingReport = settings?.sprintBoards?.length > 0
        && settings.noOfSprints >= 3 && settings.noOfSprints < 13
        && settings.velocitySprints >= 3
        && !!settings.storyPointField;

    return (
        <SideBar show={show} onHide={onHide} title="Report Config"
            controls={null} width="500" contentClassName="p-0">
            <div className="p-3">
                <label className="fw-bold pb-2 d-block">Select Sprint Boards:</label>
                <RapidViewList value={settings.sprintBoards} multiple onChange={setSprintBoards} />
                <span className="help-text d-block">
                    Select all the sprint boards for which you would like to view Say-Do Ratio report.
                </span>
            </div>
            <div className="p-3">
                <label className="fw-bold pb-2 d-block">Number of Sprints:</label>
                <TextBox value={settings.noOfSprints} field="noOfSprints" onChange={setNumeric} maxLength={2} />
                <span className="help-text d-block">
                    Provide the number of sprints to be displayed in chart and table. Minimum value allowed is 3.
                </span>
            </div>
            <div className="p-3">
                <label className="fw-bold pb-2 d-block">Number of Sprints for velocity:</label>
                <TextBox value={settings.velocitySprints} field="velocitySprints" onChange={setNumeric} maxLength={1} />
                <span className="help-text d-block">
                    Provide the number of sprints to be used for velocity calculation.
                    The average completed story points count of all the sprints would be considered as velocity of each sprint.
                    Minimum value allowed is 3.
                </span>
            </div>
            {!settings?.storyPointField && <div className="p-3">
                <label className="fw-bold pb-2 d-block msg-error">Story Points field unavailable:</label>
                Select value for "Story Points field" under General settings -&gt; "Default Values" tab.
                Report cannot be generated without having "Story Points field" configured.
            </div>}
            <div className="p-3">
                <Checkbox checked={settings.includeNonWorkingDays} field="includeNonWorkingDays" onChange={setBoolean}
                    label="Include non working days in cycle time calculation" />
                <div className="help-text d-block mt-1">
                    You can configure working days from General Settings page.
                </div>
            </div>
            <div className="p-3">
                <Button className="float-end me-2" icon="fa fa-arrow-right" isLoading={isLoading}
                    iconPos="right" label="Generate Report" disabled={!allowGeneratingReport || isLoading}
                    onClick={generateReport} title="Generated report for selected boards" />
            </div>
        </SideBar>
    );
}

export default ReportSettings;