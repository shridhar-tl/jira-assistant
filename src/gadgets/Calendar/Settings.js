import React from 'react';
import config from '../../customize';
import BaseDialog from '../../dialogs/BaseDialog';
import { Checkbox, ColorPicker, Button, RadioButton } from '../../controls';

const { googleCalendar, outlookCalendar } = config.features.integrations;
const showMeetings = outlookCalendar !== false || googleCalendar !== false;

class CalendarSettings extends BaseDialog {
    constructor(props) {
        super(props, "Calendar configurations");
        this.state = { showDialog: true, settings: { ...props.settings } };
        this.style = { width: "667px" };
    }

    setValue = (value, field) => {
        let { settings } = this.state;
        settings = { ...settings };

        if (value || value === false) {
            settings[field] = value;
        }
        else {
            delete settings[field];
        }

        this.setState({ settings: settings });
    };

    onDone = () => {
        this.props.onDone(this.state.settings);
        this.onHide();
    };

    getFooter() {
        return <>
            <Button text type="secondary" icon="fa fa-times" label="Cancel" onClick={this.onHide} />
            <Button type="primary" icon="fa fa-save" label="Done" onClick={this.onDone} />
        </>;
    }

    render() {
        const { settings } = this.state;

        return super.renderBase(<div className="pad-22">
            <h3 className="control-sidebar-heading">Item Colors</h3>
            {showMeetings && <div className="form-group row">
                <label className="col-md-3 col-form-label">Meeting entry color</label>
                <div className="col-md-9 col-form-label">
                    <ColorPicker value={settings.eventColor} fieldName="eventColor" onChange={this.setValue} />
                    <label className="form-check-label">
                        Specify the color of the entry for meeting
                    </label>
                </div>
            </div>}
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
            {showMeetings && <div className="form-group">
                <Checkbox checked={settings.showMeetings || false} onChange={(val) => this.setValue(val, "showMeetings")} label="Display entry for meetings integrated from calendar" />
            </div>}
            <div className="form-group">
                <Checkbox checked={settings.showWorklogs || false} onChange={(val) => this.setValue(val, "showWorklogs")} label="Display worklog added by you" />
            </div>
            <div className="form-group">
                <Checkbox checked={settings.showInfo || false} onChange={(val) => this.setValue(val, "showInfo")} label="Display information about total hours logged on daily basis" />
            </div>
            <h5 className="control-sidebar-heading">Entry details</h5>
            <div className="form-group">
                <RadioButton value={settings.detailsMode || '1'} defaultValue="1" onChange={(val) => this.setValue(val, "detailsMode")} label="Display worklog comments on worklog entry" /><br />
                <RadioButton value={settings.detailsMode || '1'} defaultValue="2" onChange={(val) => this.setValue(val, "detailsMode")} label="Display ticket summary on worklog entry" /><br />
                <RadioButton value={settings.detailsMode || '1'} defaultValue="3" onChange={(val) => this.setValue(val, "detailsMode")} label="Try accomidate both worklog comments and ticket summary on worklog entry" />
            </div>
            <h3 className="control-sidebar-heading">Other options</h3>
            <div className="form-group">
                <Checkbox checked={settings.rowBanding || false} onChange={(val) => this.setValue(val, "rowBanding")} label="Enable alternate row color on calendar time grid" />
            </div>
            <div className="form-group">
                <Checkbox checked={settings.hideWeekends || false} onChange={(val) => this.setValue(val, "hideWeekends")} label="Hide weekends from calendar view (even when worklog already exists)" />
                &nbsp;( <span className="fa fa-exclamation-triangle" title="Will be applied only once the page is refreshed. Existing pending worklog would still be uploaded even if hidden" /> )
            </div>
            <div className="form-group">
                <Checkbox checked={settings.readableEvents || false} onChange={(val) => this.setValue(val, "readableEvents")} label="Allow small events to expand in height to make it readable" />
                &nbsp;( <span className="fa fa-exclamation-triangle" title="This settings may result in small events overlapping with other events. This settings would be applied only after page refresh." /> )
            </div>
        </div>);
    }
}

export default CalendarSettings;