import { useCallback, useRef, useState } from 'react';

import { GadgetActionType } from '@/constants';

import { Button } from '@components';

import AddWorklog from '../dialogs/AddWorklog';
import GroupEditor from '../dialogs/GroupEditor';
import { inject } from '../services/injector';

import { GadgetContainer, useBaseGadget, type BaseGadgetProps } from './BaseGadget';
import { GadgetTitle } from './constants';
import { fetchData, groupsChanged } from './WorklogReport/actions';
import {
    getInitialSettings,
    getSettingsObj,
    getSprintsList,
    useWorklogDispatch,
    useWorklogGetState,
    useWorklogStore,
    withProvider,
} from './WorklogReport/datastore';
import Report from './WorklogReport/Report';
import CustomActions from './WorklogReport/settings/CustomActions';
import SettingsDialog from './WorklogReport/settings/SettingsDialog';
import WorklogReportInfo from './WorklogReport/WorklogReportInfo';

function WorklogReportInner(props: BaseGadgetProps) {
    const gadgetHook = useBaseGadget(props, {
        title: GadgetTitle.WorklogReport,
    });

    const [showSettings, setShowSettings] = useState(false);
    const [showGroupsPopup, setShowGroupsPopup] = useState(false);

    const state = useWorklogStore();
    const dispatch = useWorklogDispatch();
    const getState = useWorklogGetState();

    const { reportLoaded, loadingData, showWorklogPopup, worklogItem, userGroups } = state;

    const selSprintsRef = useRef<any>(state.selSprints);
    const dateRangeRef = useRef<any>(state.dateRange);

    const saveSettings = useCallback(
        async (opts?: { incUserGroups?: boolean }, overrideState?: any) => {
            const { $config } = inject('ConfigService');
            const stateToUse = overrideState ? { ...getState(), ...overrideState } : getState();
            const settings = getSettingsObj(stateToUse, opts);

            if (props.isGadget) {
                props.onAction?.({ type: GadgetActionType.SettingsChanged, data: { reportSettings: settings } }, props.model, props.index);
            } else {
                await $config.saveSettings('reports_WorklogReport', settings);
            }
        },
        [props, getState],
    );

    const refreshData = useCallback(async () => {
        selSprintsRef.current = getState().selSprints;
        dateRangeRef.current = getState().dateRange;

        gadgetHook.setIsLoading(true);
        try {
            await fetchData(dispatch, getState)();
        } finally {
            gadgetHook.setIsLoading(false);
        }
    }, [dispatch, getState, gadgetHook]);

    const inputChanged = useCallback(() => {
        const currentState = getState();
        if (selSprintsRef.current !== currentState.selSprints || dateRangeRef.current !== currentState.dateRange) {
            saveSettings();
            refreshData();
        }
    }, [saveSettings, refreshData, getState]);

    const handleSettingsHide = useCallback(
        async (result?: any) => {
            setShowSettings(false);
            if (result) {
                const { modifiedSettings } = result;
                dispatch(modifiedSettings);
                await saveSettings(undefined, modifiedSettings);
                const mergedState = { ...getState(), ...modifiedSettings };
                dispatch(getSprintsList(mergedState));
            }
        },
        [dispatch, getState, saveSettings],
    );

    const handleGroupsHide = useCallback(
        (groups?: any[]) => {
            setShowGroupsPopup(false);
            if (groups && Array.isArray(groups)) {
                groupsChanged(dispatch)(groups);
                if (props.isGadget) {
                    saveSettings({ incUserGroups: true });
                }
            }
        },
        [dispatch, props.isGadget, saveSettings],
    );

    const handleWorklogDone = useCallback(() => {
        dispatch({ showWorklogPopup: false, worklogItem: null });
    }, [dispatch]);

    const handleWorklogHide = useCallback(() => {
        dispatch({ showWorklogPopup: false, worklogItem: null });
    }, [dispatch]);

    const renderCustomActions = () => (
        <>
            {!showSettings && <CustomActions onInputChanged={inputChanged} showGroupsPopup={() => setShowGroupsPopup(true)} />}
            <Button
                layout="plain"
                leftIcon={<i className="fa fa-cogs" />}
                onClick={() => setShowSettings(true)}
                title="Show settings"
                size="sm"
            />
        </>
    );

    return (
        <GadgetContainer
            {...props}
            gadgetHook={gadgetHook}
            customActions={renderCustomActions()}
            refreshData={refreshData}
        >
            <div className="worklog-report-container">
                {showSettings && <SettingsDialog onHide={handleSettingsHide} />}
                {showGroupsPopup && <GroupEditor groups={userGroups} onHide={handleGroupsHide} />}
                {!reportLoaded && !loadingData && <WorklogReportInfo />}
                {reportLoaded && <Report isLoading={loadingData} onSettingsChanged={() => saveSettings()} />}
                {showWorklogPopup && (
                    <AddWorklog worklog={worklogItem} onDone={handleWorklogDone} onHide={handleWorklogHide} uploadImmediately={true} />
                )}
            </div>
        </GadgetContainer>
    );
}

export const WorklogReport = withProvider(
    WorklogReportInner,
    undefined,
    undefined,
    undefined,
    ({ isGadget, settings }: BaseGadgetProps) => {
        let storedSettings: any;

        if (isGadget) {
            storedSettings = settings?.reportSettings;
        } else {
            const { $session } = inject('SessionService');
            storedSettings = $session.pageSettings?.reports_WorklogReport;
        }

        return getInitialSettings(storedSettings || {}) as any;
    },
);
