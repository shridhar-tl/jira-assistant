import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { TextBox } from '../../../controls';
import DataSourceSettings from './DataSourceSettings';
import FieldsListSettings from './FieldsListSettings';
import FormattingSettings from './FormattingSettings';
import LogFilterSettings from './LogFilterSettings';
import './Settings.scss';

const Settings = function ({ settings, onChange }) {
    const [modifiedSettings, setModifiedSettings] = useState({});
    const [allSettings, setAllSettings] = useState(settings);

    const updateState = (modifiedSettings) => {
        setModifiedSettings(modifiedSettings);
        const newAllSettings = { ...settings, ...modifiedSettings };
        setAllSettings(newAllSettings);
        onChange(newAllSettings, modifiedSettings);
    };

    const setValue = (key, value) => updateState({ ...modifiedSettings, [key]: value });

    const setFieldValue = (value, field) => {
        setValue('fields', {
            ...allSettings.fields,
            [field]: value
        });
    };

    const setBoards = (boards) => {
        const { sprintList } = allSettings;

        updateState({
            ...modifiedSettings,
            sprintBoards: boards,
            sprintList: sprintList && boards.reduce((sprints, board) => {
                sprints[board.id] = sprintList[board.id];
                return sprints;
            }, {})
        });
    };

    return (
        <TabView className="worklog-settings">
            <TabPanel header="Datasource" leftIcon="fa fa-cog" contentClassName="pad-22">
                <DataSourceSettings state={allSettings} setValue={setValue} setBoards={setBoards} />
            </TabPanel>
            <TabPanel header="Formatting" leftIcon="fa fa-cog" contentClassName="pad-22">
                <FormattingSettings state={allSettings} setValue={setValue} />
            </TabPanel>
            <TabPanel header="Fields list" leftIcon="fa fa-cog" contentClassName="pad-22">
                <FieldsListSettings fields={allSettings.fields} setFieldValue={setFieldValue} epicField={allSettings.epicField} />
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
};

export default Settings;
/*
function setObjectValue(obj, field, value) {
    if (field.includes('.')) {
        const parts = field.split('.');
        const curField = parts.splice(0, 1)[0];
        const partObj = obj[curField];

        const newValue = setObjectValue(partObj, parts.join('.'));
        setObjectValue(obj, curField, newValue);
    } else {
        obj = { ...obj, [field]: value };
    }

    return obj;
}*/