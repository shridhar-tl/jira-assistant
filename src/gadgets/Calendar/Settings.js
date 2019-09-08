import React from 'react';
import BaseDialog from '../../dialogs/BaseDialog';
import { Checkbox, ColorPicker, Button } from '../../controls';

class CalendarSettings extends BaseDialog {
    constructor(props) {
        super(props, "Calendar configurations");
        this.state = { showDialog: true, settings: { ...props.settings } };
        this.style = { width: "667px" };
    }

    setValue = (value, field) => {
        let { settings } = this.state;
        settings = { ...settings };

        if (value) {
            settings[field] = value;
        }
        else {
            delete settings[field];
        }

        this.setState({ settings: settings });
    }

    onDone = () => {
        this.props.onDone(this.state.settings);
        this.onHide();
    }

    getFooter() {
        return <>
            <Button type="default" icon="fa fa-revert" label="Cancel" onClick={this.onHide} />
            <Button type="success" icon="fa fa-floppy-o" label="Done" onClick={this.onDone} />
        </>;
    }

    render() {
        const { settings } = this.state;

        return super.renderBase(<div className="pad-22">
            <h3 className="control-sidebar-heading">Item Colors</h3>
            <div className="form-group row">
                <label className="col-md-3 col-form-label">Meeting entry color</label>
                <div className="col-md-9 col-form-label">
                    <ColorPicker value={settings.eventColor} fieldName="eventColor" onChange={this.setValue} />
                    <label className="form-check-label">
                        Specify the color of the entry for meeting
                    </label>
                </div>
            </div>
            <div className="form-group row">
                <label className="col-md-3 col-form-label">Worklog entry color</label>
                <div className="col-md-9 col-form-label">
                    <ColorPicker value={settings.worklogColor} fieldName="worklogColor" onChange={this.setValue} />
                    <label className="form-check-label">Specify the color of the worklog entry</label>
                </div>
            </div>
            <div className="form-group row">
                <label className="col-md-3 col-form-label">Info color (Valid)</label>
                <div className="col-md-9 col-form-label">
                    <ColorPicker value={settings.infoColor_valid} fieldName="infoColor_valid" onChange={this.setValue} />
                    <label className="form-check-label">
                        Specify the color of the info entry when the total hours logged is equal to the max hours to log setting
                    </label>
                </div>
            </div>
            <div className="form-group row">
                <label className="col-md-3 col-form-label">Info color (Less)</label>
                <div className="col-md-9 col-form-label">
                    <ColorPicker value={settings.infoColor_less} fieldName="infoColor_less" onChange={this.setValue} />
                    <label className="form-check-label">
                        Specify the color of the info entry when the total hours logged is lesser than the max hours to log
                    </label>
                </div>
            </div>
            <div className="form-group row">
                <label className="col-md-3 col-form-label">Info color (High)</label>
                <div className="col-md-9 col-form-label">
                    <ColorPicker value={settings.infoColor_high} fieldName="infoColor_high" onChange={this.setValue} />
                    <label className="form-check-label">
                        Specify the color of the info entry when the total hours logged is higher than the max hours to log
                    </label>
                </div>
            </div>
            <h3 className="control-sidebar-heading">Show / Hide Entries</h3>
            <div className="form-group">
                <Checkbox checked={settings.showMeetings} onChange={(val) => this.setValue(val, "showMeetings")} label="Display entry for meetings integrated from calendar" />
            </div>
            <div className="form-group">
                <Checkbox checked={settings.showWorklogs} onChange={(val) => this.setValue(val, "showWorklogs")} label="Display worklog added by you" />
            </div>
            <div className="form-group">
                <Checkbox checked={settings.showInfo} onChange={(val) => this.setValue(val, "showInfo")} label="Display information about total hours logged on daily basis" />
            </div>
        </div>);
    }
}

export default CalendarSettings;