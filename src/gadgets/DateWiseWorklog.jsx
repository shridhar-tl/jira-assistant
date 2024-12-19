import React from 'react';
import BaseGadget, { GadgetActionType } from './BaseGadget';
import { inject } from '../services';
import moment from 'moment';
import { DatePicker } from '../controls';
import { showContextMenu } from '../components/ContextMenu';
import ChangeTracker from '../components/ChangeTracker';
import { WorklogContext } from '../common/context';
import UserDateWiseWorklog from '../components/shared/UserDateWiseWorklog';

class DateWiseWorklog extends BaseGadget {
    static contextType = WorklogContext;
    constructor(props) {
        super(props, 'Daywise worklog', 'fa-list-alt');
        inject(this, "WorklogService", "UtilsService", "MessageService");
        this.contextMenu = [
            { label: "Upload worklog", icon: "fa fa-clock", command: () => this.uploadWorklog() },
            { label: "Add worklog", icon: "fa fa-bookmark", command: () => this.addWorklog() } //ToDo: Add option for move to progress, show in tree view
        ];
    }

    refreshData = async () => this.setState({ lastUpdated: new Date() });

    showContext = (e, b) => {
        this.selectedDay = b;
        showContextMenu(e, this.contextMenu);
    };

    dateSelected(date) {
        this.settings.dateRange = date;
        if (date.toDate) {
            this.refreshData();
            if (!date.auto) {
                this.saveSettings();
            }
        }
    }

    async uploadWorklog() {
        const toUpload = this.selectedDay.ticketList.filter(t => !t.worklogId).map(t => t.id);
        if (toUpload.length === 0) {
            return;
        }

        this.setState({ isLoading: true });
        try {
            await this.$worklog.uploadWorklogs(toUpload);
            super.performAction(GadgetActionType.WorklogModified);
        } catch (err) {
            if (err.message) {
                this.$message.error(err.message);
            }
        } finally {
            this.refreshData();
            this.setState({ isLoading: false });
        }
    }

    addWorklog() {
        let date = moment(this.selectedDay.dateLogged).toDate();
        if (moment(date).isSame(moment(), 'day')) {
            date = new Date();
        }

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
    }

    renderCustomActions() {
        return <DatePicker range={true} value={this.settings.dateRange} onChange={(e) => this.dateSelected(e)} style={{ marginRight: "35px" }} />;
    }

    render() {
        const { state: { isLoading, lastUpdated } } = this;

        return super.renderBase(<>
            <UserDateWiseWorklog lastUpdated={lastUpdated} settings={this.settings} showContext={this.showContext} editWorklog={this.editWorklog} setLoader={this.setLoader} />
            <ChangeTracker key={this.context.timerEntry?.key} enabled={!isLoading && this.context.needReload} onChange={this.refreshData} />
        </>);
    }
}

export default DateWiseWorklog;