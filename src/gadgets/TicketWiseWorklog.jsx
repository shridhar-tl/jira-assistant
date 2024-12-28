import React from 'react';
import * as moment from 'moment';
import BaseGadget from './BaseGadget';
import { inject } from '../services';
import { showContextMenu } from '../components/ContextMenu';
import { ScrollableTable, THead, TBody, NoDataRow, Column } from '../components/ScrollableTable';
import { DatePicker } from '../controls';
import { DateDisplay } from '../display-controls';
import { GadgetActionType } from './_constants';
import Link from '../controls/Link';

class TicketWiseWorklog extends BaseGadget {
    constructor(props) {
        super(props, 'Ticketwise worklog', 'fa-list-alt');
        inject(this, "WorklogService", "UserUtilsService", "UtilsService", "MessageService");

        this.contextMenu = [
            { label: "Upload worklog", icon: "fa fa-clock", command: () => this.uploadWorklog() },
            { label: "Add worklog", icon: "fa fa-bookmark", command: () => this.addWorklog() } //ToDo: Add option for move to progress, show in tree view
        ];
    }

    componentDidMount() {
        super.componentDidMount();
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
    };

    showContext(e, b) {
        this.selectedTicket = b;
        showContextMenu(e, this.contextMenu);
    }

    dateSelected = (date) => {
        this.settings.dateRange = date;
        if (date.toDate) {
            this.refreshData();
            if (!date.auto) {
                this.saveSettings();
            }
        }
    };

    renderCustomActions() {
        return <DatePicker range={true} value={this.settings.dateRange} onChange={this.dateSelected} style={{ marginRight: "35px" }} />;
    }

    getWorklogUrl(ticketNo, worklogId) {
        return this.$userutils.getWorklogUrl(ticketNo, worklogId);
    }

    getTicketUrl(ticketNo) { return this.$userutils.getTicketUrl(ticketNo); }

    async uploadWorklog() {
        const toUpload = this.selectedTicket.logData.filter(t => !t.worklogId).map(t => t.id);
        if (!toUpload.length) {
            return;
        }

        this.setState({ isLoading: true });
        try {
            await this.$worklog.uploadWorklogs(toUpload);
            this.refreshData();
            super.performAction(GadgetActionType.WorklogModified);
        } catch (err) {
            if (err.message) {
                this.$message.error(err.message);
            }
        } finally {
            this.setState({ isLoading: false });
        }
    }

    addWorklog() {
        const { ticketNo } = this.selectedTicket;
        const startTime = moment().subtract(1, 'hours').toDate();
        super.addWorklog({ ticketNo, startTime, timeSpent: '01:00', allowOverride: true });
    }

    render() {
        const { worklogs } = this.state;

        return super.renderBase(
            <ScrollableTable dataset={worklogs} exportSheetName="Ticketwise worklog">
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
                    {(b) => <tr key={b.ticketNo} onContextMenu={(e) => this.showContext(e, b)} className={b.rowClass}>
                        <td><Link href={b.ticketUrl} className="link strike">{b.ticketNo}</Link></td>
                        <td>{b.summary}</td>
                        <td>{b.totalHours}</td>
                        <td>{b.uploaded}</td>
                        <td>{b.pendingUpload}</td>
                        <td>{b.parentKey ? (`${b.parentKey} - ${b.parentSumm}`) : ''}</td>
                        <td>
                            <ul className="tags">
                                {b.logData.map((ld, x) => <li key={x}>
                                    {ld.worklogId && <Link className="link badge rounded-pill skin-bg-font" href={this.getWorklogUrl(b.ticketNo, ld.worklogId)}
                                        title={ld.comments}>
                                        <span className="fa fa-clock" />  <DateDisplay tag="span" value={ld.dateLogged} />: {ld.uploaded}
                                    </Link>}
                                    {!ld.worklogId && <span className="link badge rounded-pill skin-bg-font" onClick={() => this.editWorklog(ld.id)} title={ld.comments}>
                                        <span className="fa fa-clock" /> <DateDisplay tag="span" value={ld.dateLogged} />: {ld.uploaded}
                                    </span>}
                                </li>)}
                            </ul>
                        </td>
                        <td>{b.description}</td>
                    </tr>}
                </TBody>
                <NoDataRow span={8}>No records exists</NoDataRow>
            </ScrollableTable>
        );
    }
}

export default TicketWiseWorklog;