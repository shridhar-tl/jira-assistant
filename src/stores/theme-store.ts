import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ThemeMode, ThemePreference, ThemeState } from '@types';

import { applyBodyTheme } from './apply-body-theme';
import { getSystemTheme, resolveTheme, watchSystemTheme } from './system-theme';

interface PersistedThemeState {
    preference: ThemePreference;
}

interface LegacyPersistedThemeState {
    theme?: ThemeMode;
}

let stopWatchingSystemTheme: (() => void) | undefined;

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => {
            const applyTheme = (theme: ThemeMode) => {
                set({ theme });
                applyBodyTheme(theme);
            };

            const setPreference = (preference: ThemePreference) => {
                set({ preference });
                applyTheme(resolveTheme(preference));

                stopWatchingSystemTheme?.();
                stopWatchingSystemTheme = preference === 'system' ? watchSystemTheme(applyTheme) : undefined;
            };

            return {
                preference: 'system',
                theme: getSystemTheme(),
                setPreference,
                toggleTheme: () => setPreference(get().theme === 'dark' ? 'light' : 'dark'),
            };
        },
        {
            name: 'theme-storage',
            version: 1,
            partialize: (state): PersistedThemeState => ({ preference: state.preference }),
            migrate: (persisted, version): PersistedThemeState => {
                if (version === 0) {
                    return { preference: (persisted as LegacyPersistedThemeState | undefined)?.theme ?? 'system' };
                }
                return persisted as PersistedThemeState;
            },
            onRehydrateStorage: () => (state) => {
                state?.setPreference(state.preference);
            },
        },
    ),
);
