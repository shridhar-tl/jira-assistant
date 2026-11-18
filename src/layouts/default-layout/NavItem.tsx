import { memo } from 'react';

import { NavLink } from 'react-router';

import classNames from 'classnames';

import type { MenuItem } from '@/constants/navigation';

import MenuBadge from './MenuBadge';

interface NavItemProps {
    menu: MenuItem;
    pathname: string;
    isExpanded: boolean;
}

function NavItem({ menu, pathname, isExpanded }: NavItemProps) {
    const isSelected = pathname === menu.url || pathname.startsWith(menu.url + '/');

    const content = (
        <div
            className={classNames('jira-sidebar-item relative flex items-center gap-3 py-2 rounded-md transition-colors duration-150 text-[13px]', {
                'px-3': isExpanded,
                'justify-center px-0': !isExpanded,
                'jira-sidebar-item--active': isSelected,
            })}
            data-testid={menu.id}
        >
            <i
                className={classNames(menu.icon, 'jira-sidebar-icon text-center shrink-0', {
                    'text-[17px] w-5': !isExpanded,
                    'text-[15px] w-4': isExpanded,
                })}
            />
            {isExpanded && (
                <>
                    <span className="flex-1 truncate font-medium leading-5">{menu.name}</span>
                    {menu.badge && <MenuBadge badge={menu.badge} />}
                </>
            )}
        </div>
    );

    if (menu.external) {
        return (
            <a href={menu.url} target="_blank" rel="noopener noreferrer" className="jira-sidebar-link no-underline block">
                {content}
            </a>
        );
    }

    return (
        <NavLink to={menu.url} className="jira-sidebar-link no-underline block">
            {content}
        </NavLink>
    );
}

export default memo(NavItem);
