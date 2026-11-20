import type { ThemeMode, ThemePreference } from '@types';

const darkSchemeQuery = '(prefers-color-scheme: dark)';

export function getSystemTheme(): ThemeMode {
    return window.matchMedia(darkSchemeQuery).matches ? 'dark' : 'light';
}

export function resolveTheme(preference: ThemePreference): ThemeMode {
    return preference === 'system' ? getSystemTheme() : preference;
}

export function watchSystemTheme(onChange: (theme: ThemeMode) => void): () => void {
    const query = window.matchMedia(darkSchemeQuery);
    const listener = (e: MediaQueryListEvent) => onChange(e.matches ? 'dark' : 'light');
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
}
