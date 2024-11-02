import React from 'react';
import BaseGadget, { GadgetActionType } from './BaseGadget';
import { inject } from '../services';
import { DatePicker } from '../controls';
import ChangeTracker from '../components/ChangeTracker';
import { WorklogContext } from '../common/context';
import WorklogBarChart from '../components/shared/worklog-bar-chart';

class WorklogBarChartGadget extends BaseGadget {
    static contextType = WorklogContext;
    constructor(props) {
        super(props, 'Worklog Bar Chart', 'fa-bar-chart');
        inject(this, "WorklogService", "UtilsService", "MessageService");
    }

    refreshData = async () => this.setState({ lastUpdated: new Date() });

    dateSelected = (date) => {
        this.settings.dateRange = date;
        if (date.toDate) {
            this.refreshData();
            if (!date.auto) {
                this.saveSettings();
            }
        }
    };

    executeEvent(action) {
        if (action.type === GadgetActionType.AddWorklog || action.type === GadgetActionType.DeletedWorklog || action.type === GadgetActionType.WorklogModified) {
            this.refreshData();
        }
    }

    renderCustomActions() {
        return <DatePicker range={true} value={this.settings.dateRange} onChange={this.dateSelected} style={{ marginRight: "35px" }} />;
    }

    render() {
        const { state: { isLoading, lastUpdated } } = this;

        return super.renderBase(<>
            <WorklogBarChart lastUpdated={lastUpdated} settings={this.settings} setLoader={this.setLoader} />
            <ChangeTracker key={this.context.timerEntry?.key} enabled={!isLoading && this.context.needReload} onChange={this.refreshData} />
        </>);
    }
}

export default WorklogBarChartGadget;