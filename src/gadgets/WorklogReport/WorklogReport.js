import React from 'react';
import { Button } from '../../controls';
import BaseGadget from '../BaseGadget';
import { getSettingsObj, withProvider } from './datastore';
import CustomActions from './settings/CustomActions';
import Settings from './settings/Settings';
import { fetchData, getSprintsList, setStateValue, worklogAdded, hideWorklog, groupsChanged, getSettingsToStore } from './actions';
import { inject } from '../../services/injector-service';
import Report from './Report';
import AddWorklog from '../../dialogs/AddWorklog';
import GroupEditor from '../../dialogs/GroupEditor';

class WorklogReport extends BaseGadget {
    constructor(props) {
        super(props, 'Worklog Report', 'fa-clock-o');
        inject(this, 'SessionService', 'ConfigService', 'UserGroupService');
        this.selSprints = props.selSprints;
    }

    async componentDidMount() {
        const settings = getSettingsObj(this.$session.pageSettings.reports_WorklogReport);
        const addl = getSprintsList(settings);

        const userGroups = await this.$usergroup.getUserGroups();
        this.props.setStateValue({ userGroups, ...settings, ...addl });
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
    };
    refreshData = () => {
        this.selSprints = this.props.selSprints;
        this.dateRange = this.props.dateRange;
        this.props.fetchData();
    };
    inputChanged = () => {
        if (this.selSprints !== this.props.selSprints && this.dateRange !== this.props.dateRange) {
            this.saveSettings();
            this.refreshData();
        }
    };

    async saveSettings() {
        const settings = this.props.getSettingsToStore();
        await this.$config.saveSettings('reports_WorklogReport', settings);
    }

    renderCustomActions() {
        return <>
            <CustomActions onInputChanged={this.inputChanged} showGroupsPopup={this.showGroups} />
            <Button icon="fa fa-cogs" onClick={this.showSettings} title="Show settings" />
        </>;
    }

    render() {
        const { showWorklogPopup, worklogItem, worklogAdded, hideWorklog, userGroups } = this.props;
        const { showSettings, showGroupsPopup, isLoading } = this.state;

        return super.renderBase(
            <div className="worklog-report-container">
                {showSettings && <Settings onHide={this.settingsChanged} />}
                {showGroupsPopup && <GroupEditor groups={userGroups} onHide={this.groupsChanged} />}
                {!isLoading && <Report isLoading={isLoading} />}
                {showWorklogPopup && <AddWorklog worklog={worklogItem} onDone={worklogAdded}
                    onHide={hideWorklog} uploadImmediately={true} />}
            </div>
        );
    }
}

export default withProvider(WorklogReport,
    ({
        selSprints, dateRange, loadingData: isLoading, showWorklogPopup, worklogItem, userGroups
    }) => ({ selSprints, dateRange, isLoading, showWorklogPopup, worklogItem, userGroups }),
    { fetchData, setStateValue, worklogAdded, hideWorklog, getSettingsToStore, groupsChanged });
