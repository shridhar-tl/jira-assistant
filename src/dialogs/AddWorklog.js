import React from 'react';
import { InputMask } from 'primereact/inputmask';
import BaseDialog from './BaseDialog';
import { inject } from '../services/injector-service';
import { Button, Checkbox, DatePicker, AutoComplete, TextBox } from '../controls';
import moment from 'moment';
import { GadgetActionType } from '../gadgets';

class AddWorklog extends BaseDialog {
    constructor(props) {
        super(props, "Add worklog", { width: '550px' });
        inject(this, "SessionService", "SuggestionService", "WorklogService", "MessageService");

        this.displayDateFormat = "yyyy-MM-dd HH:mm";
        this.minCommentLength = this.$session.CurrentUser.commentLength || 0;

        const { worklog } = props;
        this.state = this.getState(worklog);
        this.state.uploadImmediately = this.$session.CurrentUser.autoUpload || false;
    }

    UNSAFE_componentWillMount() {
        this.$suggestion.getTicketSuggestion().then(u => {
            this.allTicketList = u;
        });

        this.loadWorklog(this.state.log);
    }

    loadWorklog(log) {
        if (log.id) {
            this.fillWorklog(log, log.copy);
        }
    }

    getState(obj) {
        const newState = { showDialog: true, vald: {}, ctlClass: {}, isLoading: false, log: obj };

        if (!obj.id) {
            newState.log = {
                ticketNo: obj.ticketNo,
                dateStarted: moment(obj.startTime || obj.dateStarted || new Date()).toDate(),
                allowOverride: obj.allowOverride
            };

            if (obj.parentId) {
                newState.log.parentId = obj.parentId;
            }

            if (!obj.allowOverride && obj.timeSpent) {
                newState.log.timeSpent = obj.timeSpent;
            }

            if (obj.timeSpent) {
                newState.log.overrideTimeSpent = obj.timeSpent;
            }
            else {
                newState.log.overrideTimeSpent = '01:00';
            }

            this.validateData(newState.log, newState.vald, newState.ctlClass);
        }

        return newState;
    }

    searchTickets = (query) => {
        query = (query || "").toLowerCase();
        return this.allTicketList.filter(t => t.value.toLowerCase().indexOf(query) > -1 || t.label.toLowerCase().indexOf(query) > -1);
    }

    fillWorklog(worklog, copy) {
        return this.$worklog.getWorklog(worklog).then((d) => {
            if (d.timeSpent) {
                d.timeSpent = d.timeSpent.substring(0, 5);
                if (d.timeSpent === "00:00") {
                    d.timeSpent = null;
                }
            }
            if (d.overrideTimeSpent) {
                d.overrideTimeSpent = d.overrideTimeSpent.substring(0, 5);
                d.allowOverride = true;
            }

            if (copy) {
                delete d.id;
                delete d.isUploaded;
                delete d.worklogId;
                delete d.parentId;
                d.dateStarted = moment(`${(new Date()).format('yyyy/MM/dd')} ${d.dateStarted.format('HH:mm:ss')}`).toDate();
            }
            else {
                this.previousTime = d.dateStarted;
            }

            const newState = { log: d, vald: this.state.vald, ctlClass: this.state.ctlClass };
            this.validateData(newState.log, newState.vald, newState.ctlClass);
            this.setState(newState);
            return d;
        });
    }

    // eslint-disable-next-line complexity
    validateData(log, vald, ctlClass) {
        if (log.allowOverride) {
            log.overrideTimeSpent = log.overrideTimeSpent || log.timeSpent || "00:00";
        }

        let validation = true;

        const ticketNo = this.getTicketNo(log);
        validation = (vald.ticketNo = !(!ticketNo || ticketNo.length < 3)) && validation;
        validation = (vald.dateStarted = !(!log.dateStarted || log.dateStarted.length < 16)) && validation;
        vald.overrideTimeSpent = (log.allowOverride && log.overrideTimeSpent && log.overrideTimeSpent.length >= 4);
        vald.overrideTimeSpent = vald.overrideTimeSpent && this.$worklog.getTimeSpent(log.overrideTimeSpent) > 0;
        validation = (vald.overrideTimeSpent = vald.overrideTimeSpent || (!log.allowOverride && log.timeSpent && log.timeSpent.length >= 4)) && validation;
        validation = (vald.description = this.minCommentLength < 1 || !(!log.description || log.description.length < this.minCommentLength)) && validation;
        ctlClass.ticketNo = !vald.ticketNo ? 'is-invalid' : 'is-valid';
        ctlClass.dateStarted = !vald.dateStarted ? 'is-invalid' : 'is-valid';
        ctlClass.overrideTimeSpent = !vald.overrideTimeSpent ? 'is-invalid' : 'is-valid';
        ctlClass.description = !vald.description ? 'is-invalid' : 'is-valid';

        return validation;
    }

    saveWorklog = (worklog, vald, upload) => {
        if (!this.validateData(worklog, vald, this.state.ctlClass)) {
            this.$message.warning("Please provide value for all the mandatory fields", "Incomplete worklog details");
            return false;
        }

        this.setState({ isLoading: true });

        this.$worklog.saveWorklog({
            ticketNo: this.getTicketNo(worklog),
            dateStarted: worklog.dateStarted,
            overrideTimeSpent: worklog.overrideTimeSpent,
            description: worklog.description,
            worklogId: worklog.worklogId,
            isUploaded: worklog.isUploaded,
            timeSpent: worklog.timeSpent,
            parentId: worklog.parentId,
            id: worklog.id
        }, upload).then((result) => {
            this.props.onDone(worklog.id > 0 ? { type: GadgetActionType.WorklogModified, edited: result, previousTime: this.previousTime } : { type: GadgetActionType.WorklogModified, added: result });
            this.onHide();
        }, (e) => {
            this.setState({ isLoading: false });

            if (typeof e === "string") {
                this.$message.error(e);
            } else {
                console.error(e);
            }
        });
    }

    getTicketNo(worklog) {
        if (!worklog || !worklog.ticketNo) {
            return null;
        }
        return (typeof worklog.ticketNo === 'string') ? worklog.ticketNo : worklog.ticketNo.value;
    }

    deleteWorklog(log) {
        this.setState({ isLoading: true });
        const prevTicketNo = log.ticketNo;
        log.ticketNo = prevTicketNo.value || prevTicketNo;
        this.$worklog.deleteWorklog(log).then((result) => {
            this.setState({ isLoading: false });
            this.showPopup = false;
            this.props.onDone({
                type: GadgetActionType.DeletedWorklog, removed: log.id,
                deleted: log.id, deletedObj: log
            });
        }, () => { log.ticketNo = prevTicketNo; });
    }

    setValue = (field, value) => {
        let { log } = this.state;

        if (value) {
            log[field] = value;
        }
        else {
            delete log[field];
        }

        log = { ...log };

        this.setState({ log });
    }

    getFooter() {
        const {
            isLoading,
            state: { log, vald, uploadImmediately }
        } = this;

        return <>
            {!log.id && <Checkbox checked={uploadImmediately} className="pull-left" label="Upload immediately to Jira" onChange={(chk) => this.setState({ uploadImmediately: chk })} />}
            {log.id > 0 && <Button type="danger" icon="fa fa-trash-o" label="Delete" className="pull-left" disabled={isLoading} onClick={() => this.deleteWorklog(log)} />}
            {log.id > 0 && !log.worklogId && <Button type="success" isLoading={isLoading} icon="fa fa-upload" label="Save & Upload" className="pull-left" disabled={isLoading}
                onClick={() => this.saveWorklog(log, vald, true)} />}
            <Button type="primary" icon="fa fa-save" label="Save" isLoading={isLoading} disabled={isLoading} onClick={() => this.saveWorklog(log, vald, uploadImmediately && !(log.id > 0))} />
            <Button type="secondary" icon="fa fa-times" label="Cancel" onClick={this.onHide} />
        </>;
    }

    formatTs = (val) => {
        return val;
    }

    render() {
        const {
            minCommentLength,
            state: { log, vald }
        } = this;

        return super.renderBase(<div className="pad-22">
            <div className="row pad-b">
                <div className="col-sm-3">
                    <strong>Log time</strong>
                </div>
                <div className="p-col-9 col-sm-9">
                    <div className="form-group">
                        <div className="ctlClass.dateStarted">
                            <DatePicker value={log.dateStarted} showTime={true} onChange={(val) => this.setValue("dateStarted", val)} />
                        </div>
                        <span className={`help-block ${vald.dateStarted ? '' : 'msg-error'}`}>Provide the time you had started the work</span>
                    </div>
                </div>
            </div>

            <div className="row pad-b">
                <div className="col-sm-3">
                    <strong>Ticket no</strong>
                </div>
                <div className="col-sm-9">
                    <AutoComplete value={log.ticketNo} displayField="value" className="w-p-100"
                        placeholder="Enter the ticket number or start typing the summary to get suggestion"
                        dataset={this.searchTickets} disabled={log.isUploaded} maxlength={20}
                        onChange={(val) => this.setValue("ticketNo", val)}>
                        {(ticket) => <span style={{ fontSize: 12, margin: '10px 10px 0 0' }}>{ticket.value} - {ticket.label}</span>}
                    </AutoComplete>
                    <span className={`help-block ${vald.ticketNo ? '' : 'msg-error'}`}>Provide the ticket no on which you had to log your work</span>
                </div>
            </div>

            <div className="row pad-b">
                <div className="col-sm-3">
                    <strong>Actual time spent</strong>
                </div>
                <div className="col-sm-2">
                    <strong>{this.formatTs(log.timeSpent) || '-'}</strong>
                </div>
                <div className="col-sm-4">
                    <strong>Override time spent</strong>
                </div>
                <div className="col-sm-3">
                    <div className="form-group no-margin">
                        <div className="p-inputgroup ctlClass.overrideTimeSpent">
                            <span className="p-inputgroup-addon">
                                <Checkbox checked={log.allowOverride || false} onChange={(val) => this.setValue("allowOverride", val)} />
                            </span>
                            <InputMask mask="99:99" className="w-80" value={log.overrideTimeSpent || ""} placeholder="00:00" maxlength={5} disabled={!log.allowOverride}
                                onChange={(e) => this.setValue("overrideTimeSpent", e.value)} />
                        </div>
                    </div>
                </div>
                <div className="col-sm-3"></div>
                <div className="col-sm-9 no-t-padding">
                    <span className={`help-block ${vald.overrideTimeSpent ? '' : 'msg-error'}`}>
                        Provide the time spent on this task (override to change existing)</span>
                </div>
            </div>

            <div className="row">
                <div className="col-sm-3">
                    <strong>Comments</strong>
                </div>
                <div className="col-sm-9">
                    <TextBox multiline={true} rows={5} value={log.description || ""} className={`form-control ${vald.description ? '' : 'ctl-error'}`}
                        onChange={(val) => this.setValue("description", val)}
                        placeholder={`Provide a brief info about the task you had done.${minCommentLength ? ` Should be atleast ${minCommentLength} chars is length.` : ''}`} />
                </div>
            </div>
        </div>
        );
    }
}

export default AddWorklog;