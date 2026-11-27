import { useCallback, useState } from 'react';

import { Button, TabPage, TabView, TextArea } from '@components';

import type { AgileBoard } from '@components/shared/sprint-selector';

import { useWorklogStore, type WorklogReportState } from '../datastore';

import DataSourceSettings from './DataSourceSettings';
import FieldsListSettings from './FieldsListSettings';
import FormattingSettings from './FormattingSettings';
import LogFilterSettings from './LogFilterSettings';

export interface ReportSettingsResult {
    modifiedSettings: Partial<WorklogReportState>;
}

interface ReportSettingsProps {
    onDone: (result: ReportSettingsResult) => void;
}

export default function ReportSettings({ onDone }: ReportSettingsProps) {
    const storeState = useWorklogStore();
    const [modifiedSettings, setModifiedSettings] = useState<Partial<WorklogReportState>>({});
    const [allSettings, setAllSettings] = useState(storeState);

    const updateState = useCallback(
        (newModified: Partial<WorklogReportState>) => {
            setModifiedSettings(newModified);
            setAllSettings({ ...storeState, ...newModified });
        },
        [storeState],
    );

    const setValue = useCallback(
        (key: string, value: unknown) => {
            updateState({ ...modifiedSettings, [key]: value });
        },
        [modifiedSettings, updateState],
    );

    const setFieldValue = useCallback(
        (value: unknown, field: string) => {
            setValue('fields', { ...allSettings.fields, [field]: value });
        },
        [allSettings.fields, setValue],
    );

    const setBoards = useCallback(
        (boards: AgileBoard[]) => {
            const { sprintList } = allSettings;
            updateState({
                ...modifiedSettings,
                sprintBoards: boards,
                sprintList:
                    sprintList &&
                    boards.reduce<WorklogReportState['sprintList']>((sprints, board) => {
                        sprints[board.id] = sprintList[board.id];
                        return sprints;
                    }, {}),
            });
        },
        [allSettings, modifiedSettings, updateState],
    );

    const handleDone = useCallback(
        () => onDone({ modifiedSettings: getFinalStateToSave(storeState, modifiedSettings, allSettings) }),
        [onDone, storeState, modifiedSettings, allSettings],
    );

    return (
        <>
            <TabView className="settings-tabs" scrollable>
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
                        <FieldsListSettings fields={allSettings.fields} setFieldValue={setFieldValue} epicField={allSettings.epicField} />
                    </div>
                </TabPage>
                <TabPage header="Log filter">
                    <div className="p-5">
                        <LogFilterSettings state={allSettings} setValue={setValue} />
                    </div>
                </TabPage>
                <TabPage header="JQL filter">
                    <div className="p-5 space-y-3">
                        <TextArea
                            className="w-full font-mono"
                            rows={14}
                            value={allSettings.jql || ''}
                            onChange={(e) => setValue('jql', e.value)}
                            placeholder="Provide the additional JQL filters to be applied while fetching data."
                        />
                        <p className="text-sm text-secondary">
                            <strong>Note:</strong> Date range and user list filter will be added automatically.
                        </p>
                    </div>
                </TabPage>
            </TabView>
            <div className="flex justify-end px-5 py-3 border-t border-(--border-primary)">
                <Button onClick={handleDone} leftIcon={<i className="fa fa-save" />}>
                    Done
                </Button>
            </div>
        </>
    );
}

function getFinalStateToSave(settings: WorklogReportState, modifiedSettings: Partial<WorklogReportState>, allSettings: WorklogReportState) {
    const { reportLoaded, userListMode, timeframeType } = settings;
    const result = { ...modifiedSettings };

    if (reportLoaded) {
        result.reportLoaded =
            (!result.userListMode || result.userListMode === userListMode) &&
            (!result.timeframeType || result.timeframeType === timeframeType);
    }

    const { sprintBoards, selSprints } = allSettings;
    const selectedBoards =
        sprintBoards?.reduce<Record<string, boolean>>((obj, cur) => {
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
