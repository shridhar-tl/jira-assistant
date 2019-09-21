import React from 'react';
import BaseGadget, { GadgetActionType } from './BaseGadget';
import { inject } from '../services';
import moment from 'moment';
import { DatePicker } from '../controls';
import { ScrollableTable, THead, Column, TBody, NoDataRow } from '../components/ScrollableTable';
import { showContextMenu } from '../controls/ContextMenu';

class DateWiseWorklog extends BaseGadget {
    constructor(props) {
        super(props, 'Daywise worklog', 'fa-list-alt');
        inject(this, "WorklogService", "UtilsService", "UserUtilsService");
        this.contextMenu = [
            { label: "Upload worklog", icon: "fa fa-clock-o", command: () => this.uploadWorklog() },
            { label: "Add worklog", icon: "fa fa-bookmark", command: () => this.addWorklog() } //ToDo: Add option for move to progress, show in tree view
        ];
    }

    UNSAFE_componentWillMount() {
        this.refreshData();
    }

    refreshData = () => {
        const selDate = this.settings.dateRange;
        if (!selDate || !selDate.fromDate) {
            return;
        }

        this.setState({ isLoading: true });

        selDate.dateWise = true;
        this.$worklog.getWorklogs(selDate).then((result) => {
            result.forEach((b) => b.rowClass = this.$utils.getRowStatus(b));
            this.setState({ worklogs: result, isLoading: false });
        });
    }

    getWorklogUrl(ticketNo, worklogId) {
        return this.$userutils.getWorklogUrl(ticketNo, worklogId);
    }

    showContext(e, b) {
        this.selectedDay = b;
        showContextMenu(e, this.contextMenu);
    }

    dateSelected(date) {
        this.settings.dateRange = date;
        if (date.toDate) {
            this.refreshData();
            if (!date.auto) {
                this.saveSettings();
            }
        }
    }

    uploadWorklog() {
        const toUpload = this.selectedDay.ticketList.filter(t => !t.worklogId).map(t => t.id);
        if (toUpload.length === 0) {
            return;
        }

        this.setState({ isLoading: true });

        this.$worklog.uploadWorklogs(toUpload).then(() => {
            this.refreshData();
            super.performAction(GadgetActionType.WorklogModified);
        }, (err) => { this.setState({ isLoading: false }); });
    }

    addWorklog() {
        const date = moment(this.selectedDay.dateLogged).toDate();
        let hrsRemaining = null;
        if (this.selectedDay.pendingUpload > 0) {
            hrsRemaining = this.$utils.formatTs(this.selectedDay.pendingUpload, true);
        }
        super.addWorklog({ startTime: date, timeSpent: hrsRemaining, allowOverride: hrsRemaining ? true : false });
    }

    executeEvent(action) {
        if (action.type === GadgetActionType.AddWorklog || action.type === GadgetActionType.DeletedWorklog || action.type === GadgetActionType.WorklogModified) {
            this.refreshData();
        }
        else {
            super.executeEvent(action);
        }
    }

    renderCustomActions() {
        return <DatePicker range={true} value={this.settings.dateRange} onChange={(e) => this.dateSelected(e)} style={{ marginRight: "35px" }} />;
    }

    render() {
        const {
            //settings, removeGadget, isFullScreen, tbl,
            state: { worklogs }
        } = this;

        return super.renderBase(
            <ScrollableTable dataset={worklogs}>
                <THead>
                    <tr>
                        <Column sortBy="dateLogged" style={{ width: '100px' }}>Logged Date</Column>
                        <Column sortBy="totalHours">Total Hours</Column>
                        <Column sortBy="uploaded">Uploaded</Column>
                        <Column sortBy="pendingUpload">Pending Upload</Column>
                        <Column>Ticket List</Column>
                    </tr>
                </THead>
                <TBody>
                    {(b) => {
                        return <tr key={b.dateLogged} onContextMenu={(e) => this.showContext(e, b)} className={b.rowClass}>
                            <td>{this.$userutils.formatDate(b.dateLogged)}</td>
                            <td>{this.$utils.formatTs(b.totalHours)}</td>
                            <td>{this.$utils.formatTs(b.uploaded)}</td>
                            <td>{this.$utils.formatTs(b.pendingUpload)}</td>
                            <td>
                                <ul className="tags">
                                    {b.ticketList.map((ld, x) => <li key={x}>
                                        {ld.worklogId && <a className="link badge badge-pill skin-bg-font" href={this.getWorklogUrl(ld.ticketNo, ld.worklogId)}
                                            target="_blank" rel="noopener noreferrer" title={ld.comment}>
                                            <span className="fa fa-clock-o" /> {ld.ticketNo}: {ld.uploaded}
                                        </a>}
                                        {!ld.worklogId && <span className="link badge badge-pill skin-bg-font" onClick={() => this.editWorklog(ld.id)} title={ld.comment}>
                                            <span className="fa fa-clock-o" /> {ld.ticketNo}: {ld.uploaded}
                                        </span>}
                                    </li>)}
                                </ul>
                            </td>
                        </tr>;
                    }}
                </TBody>
                <NoDataRow span={5}>No worklog exists for selected date range!</NoDataRow>
            </ScrollableTable>
        );
    }
}

export default DateWiseWorklog;