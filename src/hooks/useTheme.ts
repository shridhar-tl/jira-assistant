import { useThemeStore } from '@stores';

export function useTheme() {
    const { preference, theme, setPreference, toggleTheme } = useThemeStore();

    return {
        preference,
        theme,
        setPreference,
        toggleTheme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
    };
}
