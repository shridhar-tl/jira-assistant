import { create } from 'zustand';

import type { ThemeState } from '@types';

import { applyBodyTheme } from './apply-body-theme';

export const useThemeStore = create<ThemeState>()((set, get) => ({
    theme: 'light',
    setTheme: (theme) => {
        set({ theme });
        applyBodyTheme(theme);
    },
    toggleTheme: () => {
        get().setTheme(get().theme === 'light' ? 'dark' : 'light');
    },
}));
