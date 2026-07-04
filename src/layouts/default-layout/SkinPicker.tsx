import { memo } from 'react';

import { BrightSunIcon, NightLightIcon } from 'fluxo-ui/icons';

import { useTheme } from '@hooks';

function SkinPicker() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <li
            className="nav-item list-none cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-(--text-secondary) hover:bg-(--bg-hover) hover:text-(--text-primary)"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light theme' : 'Switch to dark mode'}
        >
            {isDark ? <BrightSunIcon className="size-5" /> : <NightLightIcon className="size-5" />}
        </li>
    );
}

export default memo(SkinPicker);
