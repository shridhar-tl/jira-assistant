import React from 'react';
import SideBar from '../../pivot-report/editor/SideBar';
import RapidViewList from '../../../../components/RapidViewList';
import { Button, TextBox } from 'src/controls';

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
        && settings.noOfSprints > 3
        && settings.velocitySprints > 3;

    return (
        <SideBar show={show} onHide={onHide} title="Report Config"
            controls={null} width="500" contentClassName="p-0">
            <div className="p-3">
                <label className="font-bold pb-2 block">Select Sprint Boards:</label>
                <RapidViewList value={settings.sprintBoards} multiple onChange={setSprintBoards} />
                <span className="help-text block">
                    Select all the sprint boards for which you would like to view Say-Do Ratio report.
                </span>
            </div>
            <div className="p-3">
                <label className="font-bold pb-2 block">Number of Sprints:</label>
                <TextBox value={settings.noOfSprints} field="noOfSprints" onChange={setNumeric} />
                <span className="help-text block">
                    Provide the number of sprints to be displayed in chart and table. Minimum value allowed is 3.
                </span>
            </div>
            <div className="p-3">
                <label className="font-bold pb-2 block">Number of Sprints for velocity:</label>
                <TextBox value={settings.velocitySprints} field="velocitySprints" onChange={setNumeric} />
                <span className="help-text block">
                    Provide the number of sprints to be used for velocity calculation.
                    The average completed story points count of all the sprints would be considered as velocity of each sprint.
                    Minimum value allowed is 3.
                </span>
            </div>
            {!settings?.storyPointField && <div className="p-3">
                <label className="font-bold pb-2 block">Story Points field unavailable:</label>
                Select value for "Story Points field" under General settings -&gt; "Default Values" tab.
                This report cannot be generated without having that setting configured.
            </div>}
            <div className="p-3">
                <Button className="float-end me-2" icon="fa fa-arrow-right"
                    iconPos="right" label="Generate Report" disabled={!allowGeneratingReport}
                    onClick={generateReport} title="Generated report for selected boards" />
            </div>
        </SideBar>
    );
}

export default ReportSettings;