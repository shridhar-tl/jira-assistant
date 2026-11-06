import { useCallback, useEffect, useRef, useState } from 'react';

import GroupEditor from '@/dialogs/GroupEditor';
import type { UserGroup } from '@/types';

import { Button } from '@components';

import { GadgetActionType } from '@constants';

import { GadgetContainer, useBaseGadget, type BaseGadgetProps } from './BaseGadget';
import { GadgetTitle } from './constants';
import { howItWorks } from './TimeInStatus/constants';
import DateRangeSelector from './TimeInStatus/DateRangeSelector';
import SettingsDialog from './TimeInStatus/SettingsDialog';
import { getPageSettings, normalizeSettings, savePageSettings } from './TimeInStatus/settings';
import TimeInStatusView from './TimeInStatus/TimeInStatusView';
import type { StoredTimeInStatusSettings, TimeInStatusDateRange, TimeInStatusSettings } from './TimeInStatus/types';
import useTimeInStatus from './TimeInStatus/useTimeInStatus';

const hint = (
    <ul className="gadget-hint">
        {howItWorks.map((text) => (
            <li key={text}>{text}</li>
        ))}
    </ul>
);

function getInitialSettings({ isGadget, settings }: BaseGadgetProps): TimeInStatusSettings {
    return isGadget === false ? getPageSettings() : normalizeSettings(settings as StoredTimeInStatusSettings | undefined);
}

export default function TimeInStatusGadget(props: BaseGadgetProps) {
    const { isGadget, onAction, model, index } = props;
    const gadgetHook = useBaseGadget(props, { title: GadgetTitle.TimeInStatus });
    const { setIsLoading, settingsRef: gadgetSettingsRef, addWorklog } = gadgetHook;

    const [settings, setSettings] = useState<TimeInStatusSettings>(() => getInitialSettings(props));
    const [showSettings, setShowSettings] = useState(false);
    const [showGroups, setShowGroups] = useState(false);
    const settingsRef = useRef(settings);

    const state = useTimeInStatus(settings);
    const { reload, isLoading } = state;

    useEffect(() => {
        setIsLoading(isLoading);
    }, [isLoading, setIsLoading]);

    const applySettings = useCallback(
        (newSettings: TimeInStatusSettings) => {
            settingsRef.current = newSettings;
            setSettings(newSettings);

            if (isGadget === false) {
                savePageSettings(newSettings).catch((err: unknown) => console.error('Failed to save time in status settings:', err));
            } else {
                const { fullWidth, fullHeight } = gadgetSettingsRef.current;
                gadgetSettingsRef.current = { fullWidth, fullHeight, ...newSettings };
                onAction?.({ type: GadgetActionType.SettingsChanged, data: gadgetSettingsRef.current }, model, index);
            }
        },
        [isGadget, onAction, model, index, gadgetSettingsRef],
    );

    const handleSettingsChange = useCallback(
        (changes: Partial<TimeInStatusSettings>) => applySettings({ ...settingsRef.current, ...changes }),
        [applySettings],
    );

    const handleSettingsSaved = useCallback(
        (newSettings: TimeInStatusSettings) => {
            setShowSettings(false);
            applySettings(normalizeSettings(newSettings));
        },
        [applySettings],
    );

    const handleDateRangeChange = useCallback(
        (dateRange: TimeInStatusDateRange) => handleSettingsChange({ dateRange }),
        [handleSettingsChange],
    );

    const openSettings = useCallback(() => setShowSettings(true), []);
    const hideSettings = useCallback(() => setShowSettings(false), []);
    const openGroups = useCallback(() => setShowGroups(true), []);

    const handleGroupsHide = useCallback(
        (userGroups?: UserGroup[]) => {
            setShowGroups(false);
            if (userGroups) {
                handleSettingsChange({ userGroups });
            }
        },
        [handleSettingsChange],
    );

    const customActions = (
        <>
            {state.isConfigured && <DateRangeSelector value={settings.dateRange} onChange={handleDateRangeChange} />}
            <Button
                layout="plain"
                leftIcon={<i className="fa fa-users" />}
                onClick={openGroups}
                title="Choose users / groups for the report"
                size="sm"
            />
            <Button layout="plain" leftIcon={<i className="fa fa-cogs" />} onClick={openSettings} title="Show settings" size="sm" />
        </>
    );

    return (
        <GadgetContainer {...props} gadgetHook={gadgetHook} customActions={customActions} refreshData={reload} hint={hint}>
            <TimeInStatusView
                settings={settings}
                state={state}
                onSettingsChange={handleSettingsChange}
                onAddWorklog={addWorklog}
            />
            {showSettings && <SettingsDialog settings={settings} onSave={handleSettingsSaved} onHide={hideSettings} />}
            {showGroups && <GroupEditor groups={settings.userGroups ?? undefined} onHide={handleGroupsHide} />}
        </GadgetContainer>
    );
}
