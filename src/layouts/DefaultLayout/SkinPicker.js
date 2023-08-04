import React from 'react';
import { inject } from '../../services/injector-service';
import { EventCategory } from '../../constants/settings';

const darkSkinName = 'skin-dark';

function SkinPicker() {
    const [isDarkSkin, setIsDarkSkin] = React.useState(false);

    React.useEffect(() => {
        (async function () {
            setIsDarkSkin(await getIsDarkSkin());
        })();
    }, []);

    const toggleSkin = React.useCallback(() => {
        setIsDarkSkin(isDark => {
            setSkin(!isDark);

            return !isDark;
        });
    }, [setIsDarkSkin]);

    if (isDarkSkin) {
        return (<span className="fa fa-adjust nav-link pointer" onClick={toggleSkin} />);
    } else {
        return (<span className="fa fa-adjust nav-link pointer" onClick={toggleSkin} />);
    }
}

export default SkinPicker;

async function getIsDarkSkin() {
    const { $settings } = inject("SettingsService", "AnalyticsService");
    return await $settings.get('skin') === 'skin-dark';
}

function setSkin(isDark) {
    const { $settings, $analytics } = inject("SettingsService", "AnalyticsService");
    const body = document.body.classList;

    body.remove(darkSkinName);

    if (isDark) {
        body.add(darkSkinName);
    }

    $settings.set('skin', isDark ? darkSkinName : '');
    $analytics.trackEvent("Skin changed", EventCategory.HeaderActions, isDark ? 'skin-dark' : 'skin-light');
}