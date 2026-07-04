import { useCallback, useState } from 'react';

import { Button } from '@components';

import { GadgetActionType } from '@constants';

import { GadgetContainer, useBaseGadget, type BaseGadgetProps } from './BaseGadget';
import { SettingsDialog } from './StatusWiseTimeSpent/SettingsDialog';
import './StatusWiseTimeSpent/StatusWiseTimeSpent.css';
import { StatusWiseTimeSpentContent } from './StatusWiseTimeSpent/StatusWiseTimeSpentContent';
import type { GridSettings, StatusWiseTimeSpentSettings } from './StatusWiseTimeSpent/types';
import { GadgetTitle } from './constants';

export default function StatusWiseTimeSpent(props: BaseGadgetProps) {
    const [showSettings, setShowSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const gadgetHook = useBaseGadget(props, {
        title: GadgetTitle.StatusWiseTimeSpent,
    });

    const settings: StatusWiseTimeSpentSettings = props.settings || {};
    const { jql, gridSettings } = settings;

    const handleSettingsChanged = useCallback(
        (newGridSettings: GridSettings) => {
            if (props.onAction) {
                props.onAction(
                    { type: GadgetActionType.SettingsChanged, data: { ...settings, gridSettings: newGridSettings } },
                    props.model,
                    props.index,
                );
            }
        },
        [props, settings],
    );

    const handlePageSettingsChanged = useCallback(
        (newSettings: StatusWiseTimeSpentSettings) => {
            if (props.onAction) {
                props.onAction({ type: GadgetActionType.SettingsChanged, data: newSettings }, props.model, props.index);
            }
            setShowSettings(false);
        },
        [props],
    );

    const handleRefresh = useCallback(() => {
        setRefreshKey((prev) => prev + 1);
    }, []);

    const renderCustomActions = () => {
        return (
            <Button layout="plain" leftIcon={<i className="fa fa-cogs" />} onClick={() => setShowSettings(true)} title="Show settings" />
        );
    };

    return (
        <GadgetContainer
            {...props}
            gadgetHook={gadgetHook}
            customActions={renderCustomActions()}
            refreshData={handleRefresh}
        >
            <div className="status-wise-ts-gadget h-full">
                {!jql ? (
                    <div className="flex items-center justify-center h-64 text-center p-4">
                        <div className="max-w-md">
                            <p className="text-secondary mb-2">No JQL was set to fetch the data.</p>
                            <p className="text-sm text-tertiary">
                                Click on <span className="fa fa-cogs mx-1" /> icon from top right corner of the gadget and modify the JQL to
                                fetch data from Jira.
                            </p>
                        </div>
                    </div>
                ) : (
                    <StatusWiseTimeSpentContent
                        key={refreshKey}
                        jql={jql}
                        settings={gridSettings}
                        settingsChanged={handleSettingsChanged}
                        setLoader={setIsLoading}
                        onAddWorklog={gadgetHook.addWorklog}
                    />
                )}
                {showSettings && (
                    <SettingsDialog settings={settings} onSave={handlePageSettingsChanged} onHide={() => setShowSettings(false)} />
                )}
            </div>
        </GadgetContainer>
    );
}
