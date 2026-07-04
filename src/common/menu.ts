import { JAWebRootUrl } from '../constants/urls';
import injectServices, { inject } from '../services/index-menu';

interface MenuConfig {
    action?: number;
    menus?: Array<{ name: string; url: string }>;
    url?: string;
    index?: number;
}

(async function () {
    injectServices();
    const svc: any = {};
    inject(svc, 'AppBrowserService', 'SettingsService');

    const { $jaBrowserExtn, $settings } = svc;
    const switched = await $settings.get('useWebVersion');
    const indexHtml = '/index.html';
    const indexPageUrl = switched ? JAWebRootUrl : indexHtml;
    const currentUserId = (await $settings.get('CurrentUserId')) || localStorage.getItem('CurrentUserId');

    const hasTabAccess = (): Promise<boolean> => {
        try {
            return $jaBrowserExtn.hasPermission({ permissions: ['activeTab'] });
        } catch {
            return Promise.resolve(false);
        }
    };

    if (!currentUserId) {
        hasTabAccess().then((hasPermission) => {
            if (hasPermission) {
                document.location.href = `${indexPageUrl}?quick=true#/integrate`;
            } else {
                $jaBrowserExtn.openTab(`${indexPageUrl}#/integrate`);
                window.close();
            }
        });
    } else {
        const replacePattern = ['chrome://newtab/', 'chrome://tabs', 'about:newtab', 'about:tabs', 'about:blank'];

        function menuClicked(event: Event): void {
            const target = event.currentTarget as HTMLElement;
            openUrl(target.getAttribute('s-href')!);
        }

        function openUrl(url: string): void {
            url = `${indexPageUrl}${switched ? '' : '#'}${url}`;
            const handleError = () => false;

            hasTabAccess()
                .then((hasAccess) => {
                    if (hasAccess) {
                        return $jaBrowserExtn
                            .getCurrentUrl()
                            .then((curUrl: string) => !curUrl || replacePattern.indexOf(curUrl.toLowerCase()) > -1, handleError);
                    } else {
                        return false;
                    }
                }, handleError)
                .then((replace: boolean) => {
                    if (replace) {
                        $jaBrowserExtn.replaceTabUrl(url);
                    } else {
                        $jaBrowserExtn.openTab(url);
                    }
                    setTimeout(() => window.close(), 600);
                });
        }

        function bindEvents(): void {
            const links = document.getElementsByTagName('a');
            for (let i = 0; i < links.length; i++) {
                links[i].addEventListener('click', menuClicked);
            }
        }

        let menu: MenuConfig | string | null = (await $settings.get('menuAction')) || localStorage.getItem('menuAction');
        if (menu) {
            try {
                if (typeof menu === 'string') {
                    menu = JSON.parse(menu);
                }
                const menuConfig = menu as MenuConfig;
                switch (menuConfig.action || 1) {
                    case 1:
                        if (menuConfig.menus && menuConfig.menus.length > 0 && Array.isArray(menuConfig.menus)) {
                            const menus = document.getElementById('menus');
                            let html = '';
                            for (let i = 0; i < menuConfig.menus.length; i++) {
                                const m = menuConfig.menus[i];
                                html += `<li><a s-href="${m.url}">${m.name}</a></li>`;
                            }
                            if (menus) {
                                menus.innerHTML = html;
                            }
                        }
                        bindEvents();
                        break;
                    default:
                        bindEvents();
                        break;
                    case 2:
                        openUrl(menuConfig.url || '/dashboard/0');
                        break;
                    case 3:
                        document.location.href = `${indexHtml}?quick=true#/dashboard/${menuConfig.index || 0}`;
                        break;
                }
            } catch (err) {
                console.error(err);
                bindEvents();
            }
        } else {
            bindEvents();
        }
    }
})();
