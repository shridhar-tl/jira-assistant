import React from 'react';
import BaseDialog from '../../dialogs/BaseDialog';
import { Button, TextBox, Checkbox } from '../../controls';
import { TabView, TabPanel } from 'primereact/tabview';
import { inject } from '../../services';

class WorklogSettings extends BaseDialog {
    constructor(props) {
        super(props, "Report configurations");
        inject(this, "ConfigService");
        this.className = "no-padding";

        const { pageSettings } = props;
        this.state = { showDialog: true, pageSettings: { ...pageSettings } };
        this.hideEstimate = pageSettings.hideEstimate;
    }

    getFooter() {
        return <Button icon="fa fa-save" label="Done" onClick={this.onDone} />;
    }

    onDone = () => {
        this.$config.saveSettings('reports_UserDayWise', this.state.pageSettings);
        this.onHide(this.state.pageSettings);
    };

    setValue = (field, value) => {
        let { pageSettings } = this.state;
        pageSettings[field] = value;
        pageSettings = { ...pageSettings };
        this.setState({ pageSettings });
    };

    render() {
        const { setValue, state: { pageSettings: { logFormat, breakupMode, timeZone, jql, hideEstimate, showCostReport,
            showProject, showParentSummary, showIssueType, showEpic, showAssignee, showReporter
        } } } = this;

        return super.renderBase(
            <TabView className="query-tab">
                <TabPanel header="General" leftIcon="fa fa-cog" contentClassName="pad-22">
                    <div className="form-group row">
                        <label className="col-md-3 col-form-label">Log hour format</label>
                        <div className="col-md-9 col-form-label">
                            <div className="form-check">
                                <label className="form-check-label">
                                    <input className="form-check-input" value={logFormat} onChange={() => setValue("logFormat", "1")} type="radio" checked={logFormat === "1"} name="hourformat" />
                                    Format hours (2h 30m)
                                </label>
                            </div>
                            <div className="form-check">
                                <label className="form-check-label">
                                    <input className="form-check-input" value={logFormat} onChange={() => setValue("logFormat", "2")} type="radio" checked={logFormat === "2"} name="hourformat" />
                                    Show in hours (2.5)
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <label className="col-md-3 col-form-label">Log breakup</label>
                        <div className="col-md-9 col-form-label">
                            <div className="form-check">
                                <label className="form-check-label">
                                    <input className="form-check-input" value={breakupMode} onChange={() => setValue("breakupMode", "1")} type="radio" checked={breakupMode === "1"} name="logbreakup" />
                                    Single entry (Sum worklog added for same ticket on same day)
                                </label>
                            </div>
                            <div className="form-check">
                                <label className="form-check-label">
                                    <input className="form-check-input" value={breakupMode} onChange={() => setValue("breakupMode", "2")} type="radio" checked={breakupMode === "2"} name="logbreakup" />
                                    Individual entry (Display individual entry for each of the worklog)
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <label className="col-md-3 col-form-label">Report timezone (experimental)</label>
                        <div className="col-md-9 col-form-label">
                            <div className="form-check">
                                <label className="form-check-label">
                                    <input className="form-check-input" value={timeZone} onChange={() => setValue("timeZone", "1")} type="radio" checked={timeZone === "1"} name="timezone" />
                                    Use my local time zone for all users
                                </label>
                            </div>
                            <div className="form-check">
                                <label className="form-check-label">
                                    <input className="form-check-input" value={timeZone} onChange={() => setValue("timeZone", "2")} type="radio" checked={timeZone === "2"} name="timezone" />
                                    Use containing groups timezone for all users
                                </label>
                            </div>
                            <div className="form-check">
                                <label className="form-check-label">
                                    <input className="form-check-input" value={timeZone} onChange={() => setValue("timeZone", "3")} type="radio" checked={timeZone === "3"} name="timezone" />
                                    Use individual users timezone
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-4">
                            <Checkbox checked={showCostReport} onChange={(e) => setValue("showCostReport", e)} label="Show cost report" />
                            {!!this.showCostReport !== !!showCostReport && <span className="pad-l-15"> ( <i className="fa fa-exclamation-triangle" title="Change will take effect only after report is refreshed" /> )</span>}
                        </div>
                        <div className="col-4">
                            <Checkbox checked={showProject} onChange={(e) => setValue("showProject", e)} label="Show Project details" />
                        </div>
                        <div className="col-4">
                            <Checkbox checked={showParentSummary} onChange={(e) => setValue("showParentSummary", e)} label="Show Parent ticket" />
                        </div>
                        <div className="col-4">
                            <Checkbox checked={showIssueType} onChange={(e) => setValue("showIssueType", e)} label="Show Issue Type" />
                        </div>
                        <div className="col-4">
                            <Checkbox checked={showEpic} onChange={(e) => setValue("showEpic", e)} label="Show Epic" />
                        </div>
                        <div className="col-4">
                            <Checkbox checked={showAssignee} onChange={(e) => setValue("showAssignee", e)} label="Show Assignee" />
                        </div>
                        <div className="col-4">
                            <Checkbox checked={showReporter} onChange={(e) => setValue("showReporter", e)} label="Show Reporter" />
                        </div>
                        <div className="col-12">
                            <Checkbox checked={hideEstimate} onChange={(e) => setValue("hideEstimate", e)} label="Hide estimate related fields" />
                            {!!this.hideEstimate !== !!hideEstimate && <span className="pad-l-15"> ( <i className="fa fa-exclamation-triangle" title="Change will take effect only after report is refreshed" /> )</span>}
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header="JQL Filter" leftIcon="fa fa-filter">
                    <TextBox multiline={true} value={jql} onChange={(val) => setValue("jql", val)} style={{ width: '100%', height: 411 }}
                        placeholder="Provide the additional JQL filters to be applied while fetching data." defaultValue={""} />
                    <span><strong>Note:</strong> Date range and user list filter will be added automatically.</span>
                </TabPanel>
            </TabView >
        );
    }
}

export default WorklogSettings;