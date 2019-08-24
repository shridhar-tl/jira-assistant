import React from 'react';
import TabControlBase from './TabControlBase';
import { TextBox, Checkbox } from '../../../controls';
import TimePicker from '../../../controls/TimePicker';

class WorklogTab extends TabControlBase {
    render() {
        const {
            props: { settings }
        } = this;

        return (
            <div className="ui-g ui-fluid">
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Max hours to log</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <TimePicker value={settings.maxHours} onChange={(val) => this.setValue("maxHours", val)} placeholder="Choose max hours" />
                        <span className="help-block">Specify the maximum number of hours to be logged per day</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Auto upload worklog</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <Checkbox checked={settings.autoUpload} onChange={(val) => this.setValue("autoUpload", val)} label="Enable auto upload by default" />
                        <span className="help-block">All the worklogs will be automatically uploaded when created</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Worklog for closed tickets</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <Checkbox checked={settings.allowClosedTickets} onChange={(val) => this.setValue("allowClosedTickets", val)} label="Allow logging work on closed tickets" />
                        <span className="help-block">This feature will work only if your Jira server is configured to support it</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Min length for worklog comments</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <TextBox className="form-control" value={settings.commentLength} onChange={(val) => this.setValue("commentLength", val)}
                            keyfilter="int" maxLength={3} style={{ width: 150, display: 'inline-block' }} />
                        <span className="help-block">Provide the minimum count of characters to be used for worklog comments</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Default meeting ticket for worklog</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <TextBox id="txtTicketNo" className="form-control" value={settings.meetingTicket}
                            onChange={(val) => this.setValue("meetingTicket", val)} maxLength={100} style={{ width: 150, display: 'inline-block' }} />
                        <span className="help-block">Provide the list of meeting tickets seperated by ',' for which you would add worklog.</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Notify for missing worklog</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <Checkbox checked={settings.notifyWL} onChange={(val) => this.setValue("notifyWL", val)} label="Enable worklog notification" />
                        <span className="help-block">Notify you to add worklog for previous day if not added</span>
                    </div>
                </div>
            </div>
        );
    }
}

export default WorklogTab;