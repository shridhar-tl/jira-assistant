import { useCallback } from 'react';

import { useService } from '@/services/injector';

import { useSettingsStore } from '@stores';

import { SettingsCategory } from '@types';

export function useSettings() {
    const {
        generalSettings,
        advancedSettings,
        isLoading,
        setGeneralSettings,
        updateGeneralSetting,
        setAdvancedSettings,
        updateAdvancedSetting,
        setLoading,
        clearSettings,
    } = useSettingsStore();

    const { $settings } = useService('SettingsService');

    const loadSettings = useCallback(
        async (userId: number) => {
            setLoading(true);

            try {
                const general = await $settings.getGeneralSettings(userId);
                const advanced = await $settings.getAdvancedSettings(userId);

                setGeneralSettings(general);
                setAdvancedSettings(advanced);
            } catch (error) {
                console.error('Failed to load settings:', error);
                throw error;
            } finally {
                setLoading(false);
            }
        },
        [$settings, setLoading, setGeneralSettings, setAdvancedSettings],
    );

    const saveGeneralSetting = useCallback(
        async (userId: number, key: string, value: any) => {
            try {
                await $settings.saveGeneralSetting(userId, key, value);
                updateGeneralSetting(key, value);
            } catch (error) {
                console.error('Failed to save general setting:', error);
                throw error;
            }
        },
        [$settings, updateGeneralSetting],
    );

    const saveAdvancedSetting = useCallback(
        async (userId: number, category: SettingsCategory, key: string, value: any) => {
            try {
                await $settings.saveSetting(userId, category, key, value);
                updateAdvancedSetting(key, value);
            } catch (error) {
                console.error('Failed to save advanced setting:', error);
                throw error;
            }
        },
        [$settings, updateAdvancedSetting],
    );

    const getDashboards = useCallback(
        async (userId: number) => {
            try {
                return await $settings.getDashboards(userId);
            } catch (error) {
                console.error('Failed to get dashboards:', error);
                throw error;
            }
        },
        [$settings],
    );

    return {
        generalSettings,
        advancedSettings,
        isLoading,
        loadSettings,
        saveGeneralSetting,
        saveAdvancedSetting,
        getDashboards,
        clearSettings,
    };
}
