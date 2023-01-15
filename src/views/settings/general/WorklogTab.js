import React, { PureComponent } from 'react';
import config from '../../../customize';
import TabControlBase from './TabControlBase';
import { TextBox, Checkbox } from '../../../controls';
import TimePicker from '../../../controls/TimePicker';
import { inject } from '../../../services';

const { googleCalendar, outlookCalendar } = config.features.integrations;
const showMeetings = outlookCalendar !== false || googleCalendar !== false;

class WorklogTab extends TabControlBase {
    render() {
        const { settings, isAtlasCloud } = this.props;

        return (
            <div className="ui-g ui-fluid">
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Min & Max hours to log (HH:mm)</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <TimePicker value={settings.minHours} field="minHours" onChange={this.saveSetting}
                            placeholder="Choose min hours" />
                        <span> - </span>
                        <TimePicker value={settings.maxHours} field="maxHours" onChange={this.saveSetting}
                            placeholder="Choose max hours" />
                        <span className="help-block">Specify the minimum and maximum number of hours to be logged per day</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Default time spent (hh:mm)</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <TimePicker value={settings.defaultTimeSpent || 1} field="defaultTimeSpent" onChange={this.saveSetting} />
                        <span className="help-block">Specify the default value for time spent while adding worklog</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Auto upload worklog</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <Checkbox checked={settings.autoUpload} field="autoUpload" onChange={this.saveSetting} label="Enable auto upload by default" />
                        <span className="help-block">All the worklogs will be automatically uploaded when created</span>
                    </div>
                </div>
                {isAtlasCloud && <>
                    <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                        <strong>Notify users on worklog</strong>
                    </div>
                    <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                        <div className="form-group">
                            <Checkbox checked={settings.notifyUsers !== false} field="notifyUsers" onChange={this.saveSetting} label="Enable worklog notification" />
                            <span className="help-block">Enable whether users watching the issue are notified by email</span>
                        </div>
                    </div>
                </>}
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Worklog for closed tickets</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <Checkbox checked={settings.allowClosedTickets} field="allowClosedTickets" onChange={this.saveSetting} label="Allow logging work on closed tickets" />
                        <span className="help-block">This feature will work only if your Jira server is configured to allow it</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Min length for worklog comments</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <TextBox className="form-control" value={settings.commentLength} field="commentLength" onChange={this.saveIntSetting}
                            keyfilter="int" maxLength={3} style={{ width: 150, display: 'inline-block' }} />
                        <span className="help-block">Provide the minimum count of characters to be used for worklog comments</span>
                    </div>
                </div>
                {showMeetings && <>
                    <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                        <strong>Default meeting ticket for worklog</strong>
                    </div>
                    <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                        <div className="form-group">
                            <TicketNo value={settings.meetingTicket} field="meetingTicket" onChange={this.saveSetting} />
                            <span className="help-block">Provide the list of meeting tickets seperated by ',' for which you would add worklog</span>
                        </div>
                    </div>
                </>}
                {/*<div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Notify for missing worklog</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <Checkbox checked={settings.notifyWL} field="notifyWL" onChange={this.saveSetting} label="Enable worklog notification" />
                        <span className="help-block">Notify you to add worklog for previous day if not added</span>
                    </div>
                </div>*/}
            </div>
        );
    }
}

export default WorklogTab;

class TicketNo extends PureComponent {
    constructor(props) {
        super(props);
        this.oldValue = props.value;
        this.state = { value: props.value };
        inject(this, 'MessageService', 'TicketService');
    }

    UNSAFE_componentWillReceiveProps(props) {
        if (this.oldValue !== props.value) {
            this.oldValue = props.value;
            this.setState({ value: props.value });
        }
    }

    setValue = (value) => this.setState({ value });

    endEdit = async () => {
        const value = await this.validateTicket();
        if (typeof value === 'string') {
            this.props.onChange(value, this.props.field);
        }
    };

    validateTicket() {
        let { value } = this.state;
        let tickets = (value || "").trim();
        if (tickets) {
            tickets = tickets.replace(';', ',').replace(' ', ',');
            tickets = tickets.split(',').map(t => t.trim() || null);
            value = tickets.join();
            this.setState({ value });

            return this.$ticket.getTicketDetails(tickets).then(res => {
                const list = tickets.map(t => res[t.toUpperCase()] || t);
                const invalidTickets = list.filter(t => typeof t === "string");
                if (invalidTickets.length > 0) {
                    this.$message.warning(`Invalid default ticket number(s) specified for meetings: ${invalidTickets.join()}`);
                    return false;
                }
                return list.map(t => t.key).join();
            }, e => {
                const msgs = ((e.error || {}).errorMessages || []);
                if (msgs.some(m => m.toLowerCase().indexOf("'key' is invalid") > -1 || m.toLowerCase().indexOf("does not exist") > -1)) {
                    this.$message.warning("Invalid default ticket number specified for meetings!");
                }
                return false;
            });
        }
        else {
            return Promise.resolve(value);
        }
    }

    render() {
        return (
            <TextBox value={this.state.value} className="form-control"
                maxLength={100} style={{ width: 150, display: 'inline-block' }}
                onChange={this.setValue} onBlur={this.endEdit} />
        );
    }
}