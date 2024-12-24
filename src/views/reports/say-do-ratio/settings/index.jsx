import React from 'react';
import { isPluginBuild } from 'src/constants/build-info';
import SideBar from '../../pivot-report/editor/SideBar';
import RapidViewList from '../../../../components/RapidViewList';
import { Button, Checkbox, TextBox } from 'src/controls';

function ReportSettings({ settings: actualSettings, show, onHide, onDone }) {
    const [settings, updateSettings] = React.useState(actualSettings);
    const $this = React.useRef({});
    $this.current.settings = settings;
    $this.current.onDone = onDone;

    const handleChange = React.useCallback((newSettings) => {
        const newState = { ...$this.current.settings, ...newSettings };
        updateSettings(newState);
    }, []);
    const setSprintBoards = React.useCallback((sprintBoards) => handleChange({ sprintBoards }), [handleChange]);
    const setNumeric = React.useCallback((value, field) => handleChange({ [field]: parseInt(value) || '' }), [handleChange]);

    const generateReport = React.useCallback(() => $this.current.onDone($this.current.settings), []);

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
            {!isPluginBuild && <div className="p-3">
                <Checkbox checked={true} label="Do not show issues removed from sprint as committed" />
                <div className="help-text d-block mt-1">
                    If an issue is removed from sprint before closing it, then it would not be considered as committed which impacts Sa-Do-Ratio.
                </div>
            </div>}
            <div className="p-3">
                <Checkbox checked={true} label="Include non working days in cycle time calculation" />
            </div>
            <div className="p-3">
                <Button className="float-end me-2" icon="fa fa-arrow-right"
                    iconPos="right" label="Generate Report" disabled={!allowGeneratingReport}
                    onClick={generateReport} title="Generated report for selected boards" />
            </div>
        </SideBar>
    );
}

export default ReportSettings;