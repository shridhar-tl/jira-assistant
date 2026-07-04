import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'light',
            setTheme: (theme) => {
                set({ theme });
                document.body.classList.remove('mode-light', 'mode-dark');
                document.body.classList.add(`mode-${theme}`);
            },
            toggleTheme: () => {
                const newTheme = get().theme === 'light' ? 'dark' : 'light';
                get().setTheme(newTheme);
            },
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    document.body.classList.remove('mode-light', 'mode-dark');
                    document.body.classList.add(`mode-${state.theme}`);
                }
            },
        },
    ),
);
