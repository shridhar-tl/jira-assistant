import { useCallback, useEffect, useRef, useState } from 'react';

import GroupEditor from '@/dialogs/GroupEditor';
import type { UserGroup } from '@/types';

import { Button } from '@components';

import { GadgetActionType } from '@constants';

import { GadgetContainer, useBaseGadget, type BaseGadgetProps } from './BaseGadget';
import { GadgetTitle } from './constants';
import { howItWorks } from './WorkloadHeatmap/constants';
import HeatmapPeriodControls from './WorkloadHeatmap/HeatmapPeriodControls';
import SettingsDialog from './WorkloadHeatmap/SettingsDialog';
import { getPageSettings, normalizeSettings, savePageSettings } from './WorkloadHeatmap/settings';
import type { WorkloadHeatmapSettings } from './WorkloadHeatmap/types';
import useWorkloadHeatmap from './WorkloadHeatmap/useWorkloadHeatmap';
import WorkloadHeatmapView from './WorkloadHeatmap/WorkloadHeatmapView';

const hint = (
    <ul className="gadget-hint">
        {howItWorks.map((text) => (
            <li key={text}>{text}</li>
        ))}
    </ul>
);

function getInitialSettings({ isGadget, settings }: BaseGadgetProps): WorkloadHeatmapSettings {
    return isGadget === false ? getPageSettings() : normalizeSettings(settings?.heatmapSettings);
}

export default function WorkloadHeatmapGadget(props: BaseGadgetProps) {
    const { isGadget, onAction, model, index } = props;
    const gadgetHook = useBaseGadget(props, { title: GadgetTitle.WorkloadHeatmap });
    const { setIsLoading, settingsRef: gadgetSettingsRef } = gadgetHook;

    const [settings, setSettings] = useState<WorkloadHeatmapSettings>(() => getInitialSettings(props));
    const [showSettings, setShowSettings] = useState(false);
    const [showGroups, setShowGroups] = useState(false);
    const settingsRef = useRef(settings);

    const state = useWorkloadHeatmap(settings);
    const { reload } = state;

    useEffect(() => {
        setIsLoading(state.isLoading);
    }, [state.isLoading, setIsLoading]);

    const applySettings = useCallback(
        (newSettings: WorkloadHeatmapSettings) => {
            settingsRef.current = newSettings;
            setSettings(newSettings);

            if (isGadget === false) {
                savePageSettings(newSettings).catch((err: unknown) => console.error('Failed to save workload heatmap settings:', err));
            } else {
                gadgetSettingsRef.current = { ...gadgetSettingsRef.current, heatmapSettings: newSettings };
                onAction?.({ type: GadgetActionType.SettingsChanged, data: gadgetSettingsRef.current }, model, index);
            }
        },
        [isGadget, onAction, model, index, gadgetSettingsRef],
    );

    const handleSettingsChange = useCallback(
        (changes: Partial<WorkloadHeatmapSettings>) => applySettings({ ...settingsRef.current, ...changes }),
        [applySettings],
    );

    const handleSettingsSaved = useCallback(
        (newSettings: WorkloadHeatmapSettings) => {
            setShowSettings(false);
            applySettings(normalizeSettings(newSettings));
        },
        [applySettings],
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
            {state.isConfigured && <HeatmapPeriodControls settings={settings} state={state} onSettingsChange={handleSettingsChange} />}
            <Button
                layout="plain"
                leftIcon={<i className="fa fa-users" />}
                onClick={openGroups}
                title="Choose users / groups for the heatmap"
                size="sm"
            />
            <Button layout="plain" leftIcon={<i className="fa fa-cogs" />} onClick={openSettings} title="Show settings" size="sm" />
        </>
    );

    return (
        <GadgetContainer {...props} gadgetHook={gadgetHook} customActions={customActions} refreshData={reload} hint={hint}>
            <WorkloadHeatmapView settings={settings} state={state} onSettingsChange={handleSettingsChange} />
            {showSettings && <SettingsDialog settings={settings} onSave={handleSettingsSaved} onHide={hideSettings} />}
            {showGroups && <GroupEditor groups={settings.userGroups ?? undefined} onHide={handleGroupsHide} />}
        </GadgetContainer>
    );
}
