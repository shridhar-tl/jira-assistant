import { useState, useCallback } from 'react';

import { Modal, Button, TabView, TabPage } from '@components';

import { useWorklogStore } from '../datastore';
import DataSourceSettings from './DataSourceSettings';
import FieldsListSettings from './FieldsListSettings';
import FormattingSettings from './FormattingSettings';
import LogFilterSettings from './LogFilterSettings';

interface SettingsDialogProps {
    onHide: (result?: any) => void;
}

function SettingsDialog({ onHide }: SettingsDialogProps) {
    const storeState = useWorklogStore();
    const [isOpen, setIsOpen] = useState(true);
    const [modifiedSettings, setModifiedSettings] = useState<any>({});
    const [allSettings, setAllSettings] = useState(storeState);

    const updateState = useCallback(
        (newModified: any) => {
            setModifiedSettings(newModified);
            setAllSettings({ ...storeState, ...newModified });
        },
        [storeState],
    );

    const setValue = useCallback(
        (key: string, value: any) => {
            updateState({ ...modifiedSettings, [key]: value });
        },
        [modifiedSettings, updateState],
    );

    const setFieldValue = useCallback(
        (value: any, field: string) => {
            setValue('fields', { ...allSettings.fields, [field]: value });
        },
        [allSettings.fields, setValue],
    );

    const setBoards = useCallback(
        (boards: any[]) => {
            const { sprintList } = allSettings;
            updateState({
                ...modifiedSettings,
                sprintBoards: boards,
                sprintList:
                    sprintList &&
                    boards.reduce((sprints: any, board: any) => {
                        sprints[board.id] = sprintList[board.id];
                        return sprints;
                    }, {}),
            });
        },
        [allSettings, modifiedSettings, updateState],
    );

    const handleDone = () => {
        const finalModified = getFinalStateToSave(storeState, modifiedSettings, allSettings);
        setIsOpen(false);
        onHide({ modifiedSettings: finalModified });
    };

    const handleClose = () => {
        setIsOpen(false);
        onHide();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Report Configurations" size="xl">
            <div className="-m-6">
                <TabView className="settings-tabs">
                    <TabPage header="Datasource">
                        <div className="p-5">
                            <DataSourceSettings state={allSettings} setValue={setValue} setBoards={setBoards} />
                        </div>
                    </TabPage>
                    <TabPage header="Formatting">
                        <div className="p-5">
                            <FormattingSettings state={allSettings} setValue={setValue} />
                        </div>
                    </TabPage>
                    <TabPage header="Fields list">
                        <div className="p-5">
                            <FieldsListSettings
                                fields={allSettings.fields}
                                setFieldValue={setFieldValue}
                                epicField={allSettings.epicField}
                            />
                        </div>
                    </TabPage>
                    <TabPage header="Log filter">
                        <div className="p-5">
                            <LogFilterSettings state={allSettings} setValue={setValue} />
                        </div>
                    </TabPage>
                    <TabPage header="JQL filter">
                        <div className="p-5 space-y-3">
                            <textarea
                                value={allSettings.jql || ''}
                                onChange={(e) => setValue('jql', e.target.value)}
                                className="w-full h-80 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Provide the additional JQL filters to be applied while fetching data."
                            />
                            <p className="text-sm text-secondary">
                                <strong>Note:</strong> Date range and user list filter will be added automatically.
                            </p>
                        </div>
                    </TabPage>
                </TabView>
                <div className="flex justify-end px-5 py-3 border-t border-gray-200 dark:border-gray-700">
                    <Button onClick={handleDone} leftIcon={<i className="fa fa-save" />}>
                        Done
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default SettingsDialog;

function getFinalStateToSave(settings: any, modifiedSettings: any, allSettings: any) {
    const { reportLoaded, userListMode, timeframeType } = settings;
    const result = { ...modifiedSettings };

    if (reportLoaded) {
        result.reportLoaded =
            (!result.userListMode || result.userListMode === userListMode) &&
            (!result.timeframeType || result.timeframeType === timeframeType);
    }

    const { sprintBoards, selSprints } = allSettings;
    const selectedBoards =
        sprintBoards?.reduce((obj: any, cur: any) => {
            obj[cur.id] = true;
            return obj;
        }, {}) || {};
    const keysToDel = Object.keys(selSprints || {}).filter((k) => !selectedBoards[k]);

    if (keysToDel.length) {
        const newSelSprints = { ...allSettings.selSprints };
        keysToDel.forEach((k) => delete newSelSprints[k]);
        result.selSprints = newSelSprints;
    }

    return result;
}
