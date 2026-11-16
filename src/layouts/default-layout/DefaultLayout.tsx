import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router';

import classNames from 'classnames';

import defaultNavigation, { getDashboardMenu, type MenuItem, type MenuSection } from '@/_nav';
import { ContextMenuProvider } from '@/components/shared/ContextMenu';
import { isQuickView, isWebBuild, redirectToRoute } from '@/constants/build-info';
import { useWorklogStore } from '@/stores/worklog-store';

import { inject } from '@services';

import { useNavigationStore } from '@stores';

import AppContent from './AppContent';
import DefaultHeader from './DefaultHeader';
import NavSideBar from './NavSideBar';

export default function DefaultLayout() {
    const navigate = useNavigate();
    const { isSidebarCollapsed } = useNavigationStore();
    const { loadTracker } = useWorklogStore();
    const [, forceUpdate] = useState(0);

    const { $dashboard, $session, $cache, $settings, $jaBrowserExtn } = inject(
        'DashboardService',
        'SessionService',
        'SettingsService',
        'CacheService',
        'AppBrowserService',
    );

    const userId = $session.userId;
    const dashboards = $dashboard.getDashboards();

    useEffect(() => {
        $jaBrowserExtn.connectAndKeepAlive(loadTracker);
        loadTracker();
        window.addEventListener('focus', loadTracker);

        initBody($settings);

        $dashboard.onChange(() => forceUpdate((n: number) => n + 1));

        return () => {
            $dashboard.onChange(() => {});
            window.removeEventListener('focus', loadTracker);
        };
    }, []);

    const signOut = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            $cache.clear();
            $settings.set('CurrentUserId', undefined);
            if (isWebBuild) {
                redirectToRoute();
            } else {
                navigate('/integrate');
            }
        },
        [$cache, $settings, navigate],
    );

    const menus = useMemo(() => {
        if (!userId) return defaultNavigation;

        const items = defaultNavigation.map((section: MenuSection) => {
            const { items: sectionItems, ...sectionData } = section;
            const mappedSection: MenuSection = {
                ...sectionData,
                items: sectionItems.map((item: MenuItem) => {
                    if (item.external) {
                        return item;
                    }
                    return {
                        ...item,
                        url: `/${userId}${item.url}`,
                    };
                }),
            };
            return mappedSection;
        });

        const currentDashboards = $dashboard.getDashboards();
        if (currentDashboards?.length) {
            const dashboardSection = items.find((s: MenuSection) => s.isDashboard);
            if (dashboardSection) {
                dashboardSection.items.splice(0, 1, ...currentDashboards.map((d: any, i: number) => getDashboardMenu(d, i, userId)));
            }
        }

        return items;
    }, [userId, dashboards]);

    const sidebarWidth = isSidebarCollapsed ? '3.5rem' : '220px';

    return (
        <ContextMenuProvider>
            <div className={classNames('app bg-(--bg-secondary)', isQuickView ? 'w-[720px] h-[500px] overflow-hidden' : 'min-h-screen')}>
                <DefaultHeader onLogout={signOut} isQuickView={isQuickView} />

                <div className={classNames('pt-12 flex', isQuickView ? 'h-full' : 'min-h-screen')}>
                    {!isQuickView && <NavSideBar menus={menus} userId={userId} />}

                    <main
                        className={classNames('flex-1 min-w-0 transition-all duration-300', !isQuickView && 'min-h-[calc(100vh-3rem)]')}
                        style={{
                            marginLeft: isQuickView ? undefined : sidebarWidth,
                            maxWidth: isQuickView ? undefined : `calc(100vw - ${sidebarWidth})`,
                        }}
                    >
                        <AppContent />
                    </main>
                </div>
            </div>
        </ContextMenuProvider>
    );
}

async function initBody($settings: any) {
    const skinName = (await $settings.get('skin')) || 'skin-blue';
    document.body.classList.add(skinName);
}
