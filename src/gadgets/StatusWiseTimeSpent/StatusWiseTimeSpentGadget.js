import React from 'react';
import BaseGadget from '../BaseGadget';
import { inject } from '../../services/injector-service';
import StatusWiseTimeSpent from './StatusWiseTimeSpent';
import { Button } from '../../controls';
import SettingsDialog from './SettingsDialog';

class StatusWiseTimeSpentGadget extends BaseGadget {
    constructor(props) {
        super(props, 'Status Wise Time Spent', 'fa-list-alt');
        inject(this, "SessionService", "AnalyticsService");
        this.state.gridKey = 0;
    }

    settingsChanged = (gridSettings) => {
        this.pageSettingsChanged({ gridSettings });
    };

    pageSettingsChanged = (settings) => {
        if (settings) {
            this.settings = { ...this.settings, ...settings };
            this.saveSettings();
        }
        this.setState({ showSettings: false, settings });
    };

    showSettings = () => {
        this.setState({ showSettings: true });
    };

    renderCustomActions() {
        return <Button icon="fa fa-cogs" onClick={this.showSettings} title="Show settings" />;
    }

    setLoader = (isLoading) => {
        this.setState({ isLoading });
    };

    refreshData = () => {
        let { gridKey } = this.state;
        gridKey++;
        this.setState({ gridKey });
    };

    render() {
        const { showSettings, gridKey } = this.state;
        const { jql, gridSettings } = this.settings || {};

        return super.renderBase(
            <div className="status-wise-ts-gadget">
                {!jql && <div className="no-jql">
                    No JQL was set to fetch the data. Click on <span className="fa fa-cogs" /> icon from top right corner of the gadget and modify the JQL to fetch data from Jira.
                </div>}
                {jql && <StatusWiseTimeSpent key={gridKey} setLoader={this.setLoader} jql={jql}
                    settings={gridSettings} settingsChanged={this.settingsChanged} onAddWorklog={this.addWorklogOn} />}
                {showSettings && <SettingsDialog pageSettings={this.settings} onHide={this.pageSettingsChanged} />}
            </div>
        );
    }
}

export default StatusWiseTimeSpentGadget;