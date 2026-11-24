import { memo, useCallback, useEffect } from 'react';

import { useLocation } from 'react-router';

import type { MenuSection } from '@/constants/navigation';

import { Drawer } from '@components';

import { useNavigationStore } from '@stores';

import NavMenu from './NavMenu';

const drawerSize = 'min(280px, 85vw)';
const drawerHeader = (
    <span className="text-base font-normal tracking-wide text-(--text-primary) whitespace-nowrap">
        Jira <span className="font-medium">Assistant</span>
    </span>
);

const ignorePanelToggle = () => {};

interface MobileNavDrawerProps {
    menus: MenuSection[];
    userId?: number;
}

function MobileNavDrawer({ menus, userId }: MobileNavDrawerProps) {
    const { pathname } = useLocation();
    const { isNavDrawerOpen, setNavDrawerOpen } = useNavigationStore();

    const closeDrawer = useCallback(() => setNavDrawerOpen(false), [setNavDrawerOpen]);

    const closeOnLinkClick = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            if ((e.target as HTMLElement).closest('a')) {
                closeDrawer();
            }
        },
        [closeDrawer],
    );

    useEffect(() => {
        closeDrawer();
    }, [pathname, closeDrawer]);

    useEffect(() => closeDrawer, [closeDrawer]);

    return (
        <Drawer
            open={isNavDrawerOpen}
            onClose={closeDrawer}
            position="left"
            size={drawerSize}
            fullWidthOnMobile={false}
            className="jira-sidebar jira-nav-drawer"
            header={drawerHeader}
            ariaLabel="Navigation menu"
        >
            <nav className="flex flex-col h-full" onClick={closeOnLinkClick}>
                <NavMenu
                    menus={menus}
                    userId={userId}
                    pathname={pathname}
                    isExpanded
                    onPanelToggle={ignorePanelToggle}
                    onDialogOpen={closeDrawer}
                />
            </nav>
        </Drawer>
    );
}

export default memo(MobileNavDrawer);
