import React from 'react';
import { inject } from '../../services/injector-service';
import AddWorklog from '../../dialogs/AddWorklog';
import GroupEditor from '../../dialogs/GroupEditor';
import { Button } from '../../controls';
import BaseGadget from '../BaseGadget';
import { getInitialSettings, withProvider } from './datastore';
import {
    fetchData, setStateValue, worklogAdded,
    hideWorklog, groupsChanged, getSettingsToStore
} from './actions';
import CustomActions from './settings/CustomActions';
import SettingsDialog from './settings/SettingsDialog';
import Report from './Report';
import WorklogReportInfo from './WorklogReportInfo';

class WorklogReport extends BaseGadget {
    constructor(props) {
        super(props, 'Worklog Report', 'fa-clock');
        inject(this, 'ConfigService');
        this.selSprints = props.selSprints;
    }

    UNSAFE_componentWillReceiveProps(changes) {
        const { isLoading } = changes;
        this.setState({ isLoading });
        super.UNSAFE_componentWillReceiveProps(changes);
    }

    showSettings = () => this.setState({ showSettings: true });
    settingsChanged = () => this.setState({ showSettings: false });
    showGroups = () => this.setState({ showGroupsPopup: true });
    hideGroups = (groups) => {
        this.props.groupsChanged(groups);
        this.setState({ showGroupsPopup: false });
        if (this.props.isGadget) {
            this.saveSettings();
        }
    };
    refreshData = () => {
        this.selSprints = this.props.selSprints;
        this.dateRange = this.props.dateRange;
        this.props.fetchData();
    };
    inputChanged = () => {
        if (this.selSprints !== this.props.selSprints || this.dateRange !== this.props.dateRange) {
            this.saveSettings();
            this.refreshData();
        }
    };

    saveSettings = async () => {
        const { isGadget } = this.props;

        const settings = this.props.getSettingsToStore({ incUserGroups: isGadget });

        if (isGadget) {
            this.settings = { ...this.settings, reportSettings: settings };
            super.saveSettings();
        } else {
            await this.$config.saveSettings('reports_WorklogReport', settings);
        }
    };

    renderCustomActions() {
        return <>
            {!this.state.showSettings && <CustomActions onInputChanged={this.inputChanged} showGroupsPopup={this.showGroups} />}
            <Button text icon="fa fa-cogs" onClick={this.showSettings} title="Show settings" />
        </>;
    }

    render() {
        const { showWorklogPopup, worklogItem, worklogAdded, hideWorklog, userGroups, reportLoaded } = this.props;
        const { showSettings, showGroupsPopup, isLoading } = this.state;

        return super.renderBase(
            <div className="worklog-report-container">
                {showSettings && <SettingsDialog onHide={this.settingsChanged} />}
                {showGroupsPopup && <GroupEditor groups={userGroups} onHide={this.hideGroups} />}
                {!reportLoaded && !isLoading && <WorklogReportInfo />}
                {reportLoaded && <Report isLoading={isLoading} onSettingsChanged={this.saveSettings} />}
                {showWorklogPopup && <AddWorklog worklog={worklogItem} onDone={worklogAdded}
                    onHide={hideWorklog} uploadImmediately={true} />}
            </div>
        );
    }
}

export default withProvider(WorklogReport,
    ({
        selSprints, dateRange, loadingData: isLoading, reportLoaded, showWorklogPopup, worklogItem, userGroups
    }) => ({ selSprints, dateRange, isLoading, reportLoaded, showWorklogPopup, worklogItem, userGroups }),
    { fetchData, setStateValue, worklogAdded, hideWorklog, getSettingsToStore, groupsChanged },
    null,
    ({ isGadget, settings }) => {
        let storedSettings = null;

        if (isGadget) {
            storedSettings = settings?.reportSettings;
        } else {
            const { $session } = inject('SessionService');
            storedSettings = $session.pageSettings.reports_WorklogReport;
        }

        return getInitialSettings(storedSettings || {});
    });
