import React from 'react';
import BaseGadget from './BaseGadget';
import { inject } from '../services';
import { showContextMenu } from '../controls/ContextMenu';
import { ScrollableTable, THead, TBody, NoDataRow, Column } from '../components/ScrollableTable';
import { Dialog } from '../dialogs/CommonDialog';

class TicketWiseWorklog extends BaseGadget {
    constructor(props) {
        super(props, 'Ticketwise worklog', 'fa-list-alt');
        inject(this, "WorklogService", "UserUtilsService", "UtilsService");

        this.settings.dateRange = {};
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
        selDate.dateWise = false;
        this.$worklog.getWorklogs(selDate).then((worklogs) => {
            worklogs.forEach((b) => {
                b.rowClass = this.$utils.getRowStatus(b);
                b.ticketUrl = this.$userutils.getTicketUrl(b.ticketNo);
                b.totalHours = this.$utils.formatTs(b.totalHours);
                b.uploaded = this.$utils.formatTs(b.uploaded);
                b.pendingUpload = this.$utils.formatTs(b.pendingUpload);
            });
            this.setState({ isLoading: false, worklogs });
        });
    }

    showContext(e, b) {
        this.selectedTicket = b;
        showContextMenu(e, this.contextMenu);
    }

    dateSelected($event) {
        this.settings.dateRange = $event.date;
        this.refreshData();
        if (!$event.auto) {
            this.saveSettings();
        }
    }

    getWorklogUrl(ticketNo, worklogId) {
        return this.$utils.getWorklogUrl(ticketNo, worklogId);
    }

    getTicketUrl(ticketNo) { return this.$userutils.getTicketUrl(ticketNo); }
    uploadWorklog() { Dialog.alert("This functionality is not yet implemented!", "Unimplemented functionality!"); }
    addWorklog() { Dialog.alert("This functionality is not yet implemented!", "Unimplemented functionality!"); }

    render() {
        const { worklogs } = this.state;

        return super.renderBase(
            <ScrollableTable dataset={worklogs}>
                <THead>
                    <tr>
                        <Column sortBy="ticketNo" style={{ width: '100px' }}>Ticket No</Column>
                        <Column sortBy="summary">Summary</Column>
                        <Column sortBy="totalHours">Total Hours</Column>
                        <Column sortBy="uploaded">Uploaded</Column>
                        <Column sortBy="pendingUpload">Pending Upload</Column>
                        <Column sortBy="parentKey">Parent Ticket</Column>
                        <Column>Dates Logged</Column>
                        <Column style={{ width: '400px' }}>Description</Column>
                    </tr>
                </THead>
                <TBody>
                    {(b) => {
                        return <tr key={b.ticketNo} onContextMenu={(e) => this.showContext(e, b)} className={b.rowClass}>
                            <td><a href={b.ticketUrl} rel="noopener noreferrer" className="link strike" target="_blank">{b.ticketNo}</a></td>
                            <td>{b.summary}</td>
                            <td>{b.totalHours}</td>
                            <td>{b.uploaded}</td>
                            <td>{b.pendingUpload}</td>
                            <td>{b.parentKey ? (`${b.parentKey} - ${b.parentSumm}`) : ''}</td>
                            <td>
                                <ul className="tags">
                                    {b.logData.map((ld, x) => <li key={x}>
                                        {ld.worklogId && <a className="link badge badge-pill skin-bg-font" href="{{ getWorklogUrl(w.ticketNo, ld.worklogId)}}"
                                            target="_blank" rel="noopener noreferrer" title={ld.comments}>
                                            <span className="fa fa-clock-o" /> {ld.dateLogged} {ld.uploaded}
                                        </a>}
                                        {!ld.worklogId && <span className="link badge badge-pill skin-bg-font" onClick={() => this.editWorklog(ld.id)} title={ld.comments}>
                                            <span className="fa fa-clock-o" /> {ld.dateLogged}: {ld.uploaded}
                                        </span>}
                                    </li>)}
                                </ul>
                            </td>
                            <td>{b.description}</td>
                        </tr>;
                    }}
                </TBody>
                <NoDataRow span={7}>No records exists</NoDataRow>
            </ScrollableTable>
        );
    }
}

export default TicketWiseWorklog;