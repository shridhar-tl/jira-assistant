import React from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { inject } from '../../../services';
import { Button, TextBox } from '../../../controls';
import BaseDialog from '../../../dialogs/BaseDialog';
import { connect, getSettingsObj } from '../datastore';
import { fillSprintList, setStateValue } from '../actions';
import DataSourceSettings from './DataSourceSettings';
import FieldsListSettings from './FieldsListSettings';
import FormattingSettings from './FormattingSettings';
import LogFilterSettings from './LogFilterSettings';
import './Settings.scss';

class Settings extends BaseDialog {
    constructor(props) {
        super(props, "Report configurations");
        inject(this, "ConfigService");
        this.className = "no-padding";
        this.state = { showDialog: true, modifiedSettings: {}, allSettings: props.settings };
    }

    getFooter() {
        return <Button icon="fa fa-floppy-o" label="Done" onClick={this.onDone} />;
    }

    updateState(modifiedSettings) {
        const { settings } = this.props;
        const allSettings = { ...settings, ...modifiedSettings };
        this.setState({ modifiedSettings, allSettings });
    }

    setValue = (key, value) => {
        let { modifiedSettings } = this.state;
        modifiedSettings = { ...modifiedSettings, [key]: value };
        this.updateState(modifiedSettings);
    };

    setFieldValue = (checked, field) => {
        this.setValue('fields', {
            ...this.state.allSettings.fields,
            [field]: checked
        });
    };

    setBoards = (boards) => {
        const { allSettings: { sprintList }, modifiedSettings } = this.state;

        this.updateState({
            ...modifiedSettings,
            sprintBoards: boards,
            sprintList: sprintList && boards.reduce((sprints, board) => {
                sprints[board.id] = sprintList[board.id];
                return sprints;
            }, {})
        });
    };

    onDone = async () => {
        const settings = this.getFinalStateToSave();
        await this.$config.saveSettings('reports_WorklogReport', settings);
        this.props.fillSprintList();
        this.onHide(settings);
    };

    getFinalStateToSave() {
        const { settings: { reportLoaded, userListMode, timeframeType } } = this.props;
        const { modifiedSettings, allSettings } = this.state;
        if (reportLoaded) {
            // Clear the report
            modifiedSettings.reportLoaded =
                // when userListMode is changed
                (!modifiedSettings.userListMode || modifiedSettings.userListMode === userListMode)
                // or when timeframeType is changed
                && (!modifiedSettings.timeframeType || modifiedSettings.timeframeType === timeframeType)
                ;
        }
        this.props.setStateValue(modifiedSettings);
        const settings = getSettingsObj(allSettings);
        return settings;
    }

    render() {
        const { setValue, setFieldValue, setBoards } = this;
        const { allSettings } = this.state;

        return super.renderBase(
            <TabView styleclass="worklog-settings">
                <TabPanel header="Datasource" leftIcon="fa fa-cog" contentClassName="pad-22">
                    <DataSourceSettings state={allSettings} setValue={setValue} setBoards={setBoards} />
                </TabPanel>
                <TabPanel header="Formatting" leftIcon="fa fa-cog" contentClassName="pad-22">
                    <FormattingSettings state={allSettings} setValue={setValue} />
                </TabPanel>
                <TabPanel header="Fields list" leftIcon="fa fa-cog" contentClassName="pad-22">
                    <FieldsListSettings fields={allSettings.fields} setFieldValue={setFieldValue} />
                </TabPanel>
                <TabPanel header="Log filter" leftIcon="fa fa-filter" contentClassName="pad-22">
                    <LogFilterSettings state={allSettings} setValue={setValue} />
                </TabPanel>
                <TabPanel header="JQL filter" leftIcon="fa fa-filter">
                    <TextBox multiline={true} value={allSettings.jql} onChange={(val) => setValue("jql", val)} style={{ width: '100%', height: 411 }}
                        placeholder="Provide the additional JQL filters to be applied while fetching data." defaultValue={""} />
                    <span><strong>Note:</strong> Date range and user list filter will be added automatically.</span>
                </TabPanel>
            </TabView >
        );
    }
}

export default connect(Settings, (settings) => ({ settings }), { fillSprintList, setStateValue });