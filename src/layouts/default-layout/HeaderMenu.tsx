import { memo, useCallback, useMemo } from 'react';

import { useLocation, useNavigate } from 'react-router';

import classNames from 'classnames';

import type { MenuItem, MenuSection } from '@/constants/navigation';

import { MenuNav, type MenuNavItem } from '@components';

interface HeaderMenuProps {
    menus: MenuSection[];
}

const isMenuActive = (menu: MenuItem, pathname: string) => !menu.external && (pathname === menu.url || pathname.startsWith(menu.url + '/'));

function findActiveMenu(menus: MenuSection[], pathname: string) {
    let active: { section: MenuSection; menu: MenuItem } | null = null;
    for (const section of menus) {
        for (const menu of section.items) {
            if (isMenuActive(menu, pathname) && (!active || menu.url.length > active.menu.url.length)) {
                active = { section, menu };
            }
        }
    }
    return active;
}

function renderBadge(badge: MenuItem['badge']) {
    if (!badge) {
        return undefined;
    }
    return (
        <span
            className={classNames('px-1.5 py-0.5 text-[10px] font-semibold rounded-full leading-tight', {
                'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': badge.variant === 'info',
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300': badge.variant === 'success',
                'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300': badge.variant === 'danger',
            })}
        >
            {badge.text}
        </span>
    );
}

function HeaderMenu({ menus }: HeaderMenuProps) {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const active = useMemo(() => findActiveMenu(menus, pathname), [menus, pathname]);

    const items = useMemo<MenuNavItem[]>(
        () =>
            menus.map((section) => ({
                id: `G-${section.name}`,
                label: active?.section === section ? `${section.name} › ${active.menu.name}` : section.name,
                children: section.items.map((menu) => ({
                    id: menu.id,
                    label: menu.name,
                    icon: <i className={classNames(menu.icon, 'w-4 text-center')} />,
                    badge: renderBadge(menu.badge),
                })),
            })),
        [menus, active],
    );

    const selectMenu = useCallback(
        (id: string) => {
            const menu = menus.flatMap((s) => s.items).find((m) => m.id === id);
            if (!menu) {
                return;
            }
            if (menu.external) {
                window.open(menu.url, '_blank', 'noopener,noreferrer');
            } else {
                navigate(menu.url);
            }
        },
        [menus, navigate],
    );

    return (
        <MenuNav
            items={items}
            orientation="horizontal"
            size="sm"
            selectedId={active?.menu.id || ''}
            onSelect={selectMenu}
            ariaLabel="Jira Assistant menu"
            className="h-12 min-w-0 flex-1 border-b-0! bg-transparent! [&_.eui-menu-nav-item-depth-0]:h-12"
        />
    );
}

export default memo(HeaderMenu);
