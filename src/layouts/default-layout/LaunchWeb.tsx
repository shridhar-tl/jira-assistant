import { useCallback, useEffect, useMemo, useState } from 'react';

import { useLocation } from 'react-router-dom';

import { isExtnBuild, isWebBuild } from '@/constants/build-info';
import { JAWebLaunchUrl } from '@/constants/urls';

import { inject } from '@services';

import { Button, showContextMenu } from '@components';

const options = isWebBuild
    ? {
          btnText: 'Extn',
          btnTooltip: 'Go back to extension',
          launchText: 'Launch Extension',
          switchText: 'Switch back',
          launchTooltip: 'Launch Jira Assistant extension once',
          switchTooltip: 'Switch back to Jira Assistant extension',
      }
    : {
          btnText: 'Web',
          btnTooltip: 'Checkout Jira Assistant Web',
          launchText: 'Launch JA Web',
          switchText: 'Switch to JA Web',
          launchTooltip: 'Launch latest Jira Assistant Web version once',
          switchTooltip: 'Switch to Web version. You can come back later any time.',
      };

export default function LaunchWeb() {
    const [launchUrl, setLaunchUrl] = useState<string | null>(null);
    const [switched, setSwitched] = useState(false);
    const location = useLocation();

    const { $settings, $jaBrowserExtn } = inject('SettingsService', 'AppBrowserService');

    const usingExtn = useMemo(() => isWebBuild && localStorage.getItem('authType') === '1', []);

    useEffect(() => {
        (async () => {
            if (isWebBuild) {
                const url = await $jaBrowserExtn.getLaunchUrl('index.html');
                setLaunchUrl(url);
            } else {
                setLaunchUrl(JAWebLaunchUrl);
            }
            const sw = await $settings.get('useWebVersion');
            setSwitched(sw);
        })();
    }, [$settings, $jaBrowserExtn]);

    const getLaunchPath = useCallback(() => {
        const curPath = location.pathname;
        return `${launchUrl}#${curPath}`;
    }, [launchUrl, location.pathname]);

    const switchToWeb = useCallback(
        async (always?: boolean) => {
            if (always !== false) {
                await $settings.set('useWebVersion', !isWebBuild || null);
            }
            window.location.href = getLaunchPath();
        },
        [$settings, getLaunchPath],
    );

    const showOptions = useMemo(() => {
        return !!launchUrl && (isExtnBuild || (usingExtn && switched));
    }, [launchUrl, usingExtn, switched]);

    const showMenus = useCallback(
        (e: React.MouseEvent) => {
            const menus: any[] = [
                {
                    label: options.launchText,
                    icon: <span className="fa fa-external-link" />,
                    command: () => switchToWeb(false),
                },
                {
                    label: options.switchText,
                    icon: <span className="fa fa-plug" />,
                    command: () => switchToWeb(),
                },
            ];
            showContextMenu(e.nativeEvent as any, menus);
        },
        [switchToWeb],
    );

    if (!showOptions) {
        return null;
    }

    return (
        <li className="nav-item list-none">
            <Button
                variant="success"
                onClick={showMenus}
                leftIcon={<i className="fa fa-external-link" />}
                title={options.btnTooltip}
                size="sm"
            >
                {options.btnText}
            </Button>
        </li>
    );
}
