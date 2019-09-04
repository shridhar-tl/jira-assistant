import React from 'react';
import BaseGadget, { GadgetActionType } from './BaseGadget';
import { ScrollableTable, THead, TBody, Column, NoDataRow } from '../components/ScrollableTable';
import { inject } from '../services/injector-service';
import { showContextMenu } from '../controls/ContextMenu';
import { Button, Checkbox } from '../controls';

class PendingWorklog extends BaseGadget {
    //dateStarted
    constructor(props) {
        super(props, 'Worklog - [Pending upload]', 'fa-clock-o');
        inject(this, "WorklogService", "UtilsService", "UserUtilsService", "MessageService");

        this.contextMenu = [
            { label: "Select worklog", icon: "fa fa-check-square-o", command: () => this.selectRowItem(this.selectedItem) },
            { label: "Edit worklog", icon: "fa fa-edit", command: () => this.editWorklogObj() },
            { label: "Copy worklog", icon: "fa fa-copy", command: () => this.editWorklogObj(true) },
            { label: "Upload worklog", icon: "fa fa-upload", command: () => this.uploadWorklog([this.selectedItem]) },
            { label: "Delete worklog", icon: "fa fa-trash-o", command: () => this.deleteWorklog([this.selectedItem]) }
        ];

        this.state.selAllChk = true;
        this.state.isLoading = true;
    }

    UNSAFE_componentWillMount() {
        this.refreshData();
    }

    refreshData() {
        this.setState({ isLoading: true });

        return this.$worklog.getPendingWorklogs()
            .then((worklogs) => {
                const { selAllChk } = this.state;

                worklogs.forEach((w) => {
                    w.rowClass = this.$utils.getRowStatus(w);
                    w.displayDate = this.$userutils.formatDateTime(w.dateStarted);
                    w.selected = selAllChk;
                    w.timeSpent = this.$utils.formatTs(w.timeSpent);
                    w.overrideTimeSpent = this.$utils.formatTs(w.overrideTimeSpent);
                });

                this.setState({ isLoading: false, worklogs });
            });
    }

    editWorklogObj(copy) {
        const newObj = Object.create(this.selectedItem);
        newObj.copy = copy;
        this.addWorklog(newObj);
    }

    selectAll = (selAllChk) => {
        const { worklogs } = this.state;
        worklogs.forEach(wl => wl.selected = selAllChk);
        this.setState({ worklogs: [...worklogs], selAllChk });
    }

    getRowStatus(d, index) {
        return d.rowClass;
    }

    getTicketUrl(ticketNo) { return this.$userutils.getTicketUrl(ticketNo); }

    showContext(e, b) {
        this.selectedItem = b;
        showContextMenu(e, this.contextMenu);
    }

    uploadWorklog(items) {
        if (!items) {
            items = this.state.worklogs.filter((w) => w.selected);
        }
        const ids = items.map((w) => w.id);
        if (ids.length === 0) {
            this.$message.info("Select the worklogs to be uploaded!");
            return;
        }

        this.setState({ isLoading: true });

        this.$worklog.uploadWorklogs(ids).then((result) => {
            this.setState({ isLoading: false, worklogs: result });
            super.performAction(GadgetActionType.WorklogModified);
        }, (obj) => {
            if (obj && obj.$message) {
                this.$message.warning(obj.message);
            }
            this.refreshData();
        });
    }

    deleteWorklog(items) {
        if (!items) {
            items = this.state.worklogs.filter((w) => w.selected);
        }
        const ids = items.map((w) => w.id);
        if (ids.length === 0) {
            this.$message.info("Select the worklogs to be deleted!");
            return;
        }
        this.isLoading = true;
        this.$worklog.deleteWorklogs(ids).then((result) => {
            this.refreshData();
            this.performAction(GadgetActionType.DeletedWorklog);
        });
    }

    executeEvent(action) {
        if (action.type === GadgetActionType.AddWorklog || action.type === GadgetActionType.DeletedWorklog || action.type === GadgetActionType.WorklogModified) {
            this.refreshData();
        }
        else {
            super.executeEvent(action);
        }
    }

    selectRowItem(item) {
        item.selected = !item.selected;
        const { worklogs } = this.state;
        this.setState({ worklogs: [...worklogs] });
    }

    renderCustomActions() {
        return <>
            <Button icon="fa fa-upload" onClick={() => this.uploadWorklog()} title="Upload selected worklogs" />
            <Button type="danger" icon="fa fa-trash-o" onClick={() => this.deleteWorklog()} title="Delete selected worklogs" />
        </>;

    }

    render() {
        const { worklogs, selAllChk } = this.state;

        return super.renderBase(
            <ScrollableTable dataset={worklogs}>
                <THead>
                    <tr>
                        <Column className="w40" noExport={true}><Checkbox checked={selAllChk} onChange={this.selectAll} /></Column>
                        <Column sortBy="ticketNo">Ticket No</Column>
                        <Column sortBy="summary">Summary</Column>
                        <Column sortBy="dateStarted">Log Time</Column>
                        <Column sortBy="timeSpent">Time Spent</Column>
                        <Column sortBy="overrideTimeSpent">Override Time</Column>
                        <Column>Description</Column>
                    </tr>
                </THead>
                <TBody>
                    {b => {
                        return <tr key={b.id} onContextMenu={(e) => this.showContext(e, b)}>
                            <td className="text-center">
                                {b.selected && <Checkbox checked={true} onChange={() => this.selectRowItem(b)} />}
                                {!b.selected && <i className="fa fa-ellipsis-v" onClick={(e) => this.showContext(e, b)}></i>}
                            </td>
                            <td><a href={b.ticketNo} rel="noopener noreferrer" className="link strike" target="_blank">{b.ticketNo}</a></td>
                            <td>{b.summary}</td>
                            <td>{b.displayDate}</td>
                            <td>{b.timeSpent}</td>
                            <td>{b.overrideTimeSpent}</td>
                            <td>{b.description}</td>
                        </tr>;
                    }}
                </TBody>
                <NoDataRow span={7}>No worklog pending to be uploaded!</NoDataRow>
            </ScrollableTable>
        );
    }
}

export default PendingWorklog;