import { create } from 'zustand';

interface GeneralSettings {
    dateFormat?: string;
    timeFormat?: string;
    startOfWeek?: number;
    workingDays?: number[];
    startOfDay?: string;
    endOfDay?: string;
    minHours?: number;
    maxHours?: number;
    commentLength?: number;
    hasGoogleCredentials?: boolean;
    hasOutlookCredentials?: boolean;
    [key: string]: any;
}

interface AdvancedSettings {
    disableJiraUpdates?: boolean;
    jiraUpdatesJQL?: string;
    suggestionJQL?: string;
    openTicketsJQL?: string;
    disableDevNotification?: boolean;
    enableExceptionLogging?: boolean;
    enableAnalyticsLogging?: boolean;
    [key: string]: any;
}

interface SettingsState {
    generalSettings: GeneralSettings;
    advancedSettings: AdvancedSettings;
    isLoading: boolean;

    setGeneralSettings: (settings: GeneralSettings) => void;
    updateGeneralSetting: (key: string, value: any) => void;
    setAdvancedSettings: (settings: AdvancedSettings) => void;
    updateAdvancedSetting: (key: string, value: any) => void;
    setLoading: (loading: boolean) => void;
    clearSettings: () => void;
}

const initialState = {
    generalSettings: {},
    advancedSettings: {},
    isLoading: false,
};

export const useSettingsStore = create<SettingsState>((set) => ({
    ...initialState,

    setGeneralSettings: (settings) => set({ generalSettings: settings }),
    updateGeneralSetting: (key, value) =>
        set((state) => ({
            generalSettings: {
                ...state.generalSettings,
                [key]: value,
            },
        })),
    setAdvancedSettings: (settings) => set({ advancedSettings: settings }),
    updateAdvancedSetting: (key, value) =>
        set((state) => ({
            advancedSettings: {
                ...state.advancedSettings,
                [key]: value,
            },
        })),
    setLoading: (loading) => set({ isLoading: loading }),
    clearSettings: () => set(initialState),
}));
