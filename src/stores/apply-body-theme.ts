import type { ThemeMode } from '@types';

export function applyBodyTheme(theme: ThemeMode): void {
    document.body.classList.remove('mode-light', 'mode-dark');
    document.body.classList.add(`mode-${theme}`);
}
