import { create } from 'zustand';

import type { ThemeState } from '@types';

import { applyBodyTheme } from './apply-body-theme';
import { resolveTheme } from './system-theme';

export const useThemeStore = create<ThemeState>()((set, get) => ({
    preference: 'light',
    theme: 'light',
    setPreference: (preference) => {
        const theme = resolveTheme(preference);
        set({ preference, theme });
        applyBodyTheme(theme);
    },
    toggleTheme: () => {
        get().setPreference(get().theme === 'light' ? 'dark' : 'light');
    },
}));
