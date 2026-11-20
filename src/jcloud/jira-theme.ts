import { FullContext, view } from '@forge/bridge';

import { useThemeStore } from '@stores/theme-store';

import type { ThemeMode } from '@types';

const colorModeAttribute = 'data-color-mode';

function toThemeMode(colorMode: string | null | undefined): ThemeMode {
    return colorMode === 'dark' ? 'dark' : 'light';
}

export async function syncJiraTheme(context: FullContext): Promise<void> {
    const { setPreference } = useThemeStore.getState();
    const root = document.documentElement;

    setPreference(toThemeMode(context.theme?.colorMode));

    new MutationObserver(() => setPreference(toThemeMode(root.getAttribute(colorModeAttribute)))).observe(root, {
        attributes: true,
        attributeFilter: [colorModeAttribute],
    });

    await view.theme.enable();

    if (root.hasAttribute(colorModeAttribute)) {
        setPreference(toThemeMode(root.getAttribute(colorModeAttribute)));
    }
}
