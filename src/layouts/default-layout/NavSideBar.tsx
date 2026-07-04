import { memo, useCallback, useRef, useState } from 'react';

import { NavLink, useLocation } from 'react-router-dom';

import classNames from 'classnames';

import { Icons } from '@/constants/icons';
import type { MenuItem, MenuSection } from '@/constants/navigation';

import { useNavigationStore } from '@stores';

import BuildDate from './BuildDate';

// Collapsed nav width: 56px (w-14), Expanded nav width: 215px
const COLLAPSED_W = 'w-14';
const EXPANDED_W = 'w-53.75';

interface NavSideBarProps {
    menus: MenuSection[];
}

function NavSideBar({ menus }: NavSideBarProps) {
    const location = useLocation();
    const { isSidebarCollapsed, toggleSidebarCollapse } = useNavigationStore();
    const [isHovering, setIsHovering] = useState(false);

    const enterSideBar = useCallback(() => setIsHovering(true), []);
    const leaveSideBar = useCallback(() => setIsHovering(false), []);

    const isOpen = !isSidebarCollapsed;
    const isExpanded = isOpen || isHovering;
    const isClosed = !isOpen && !isHovering;

    return (
        <div
            className={classNames('fixed left-0 top-12 h-[calc(100vh-3rem)] z-40 transition-all duration-300 flex group/sidebar', {
                [EXPANDED_W]: isExpanded,
                [COLLAPSED_W]: isClosed,
            })}
            onMouseLeave={leaveSideBar}
        >
            {/* Placeholder reserves space in document flow so main content doesn't overlap */}
            <div className={classNames('shrink-0 transition-all duration-300', { [COLLAPSED_W]: !isOpen, [EXPANDED_W]: isOpen })} />

            {/* Toggle button — hidden by default, visible on sidebar hover */}
            <div
                className="sidebar-toggler absolute z-50 top-10 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200"
                style={{ left: isExpanded ? '215px' : '56px', transform: 'translateX(-50%)' }}
                onMouseEnter={isHovering ? enterSideBar : undefined}
            >
                <button
                    tabIndex={0}
                    title={isOpen ? 'Collapse' : 'Expand'}
                    onClick={toggleSidebarCollapse}
                    className="sidebar-toggle-btn w-6 h-6 grid place-items-center rounded-full cursor-pointer border-none"
                >
                    {isOpen ? Icons.angleLeft : Icons.angleRight}
                </button>
            </div>

            <nav
                className={classNames(
                    'jira-sidebar absolute inset-0 flex flex-col overflow-hidden transition-all duration-300',
                    { [EXPANDED_W]: isExpanded, [COLLAPSED_W]: isClosed },
                )}
                onMouseEnter={enterSideBar}
            >
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
                    {menus.map((section, i) => (
                        <NavSection key={i} section={section} pathname={location.pathname} isExpanded={isExpanded} />
                    ))}
                </div>
                {isExpanded && (
                    <div className="jira-sidebar-footer px-3 py-2 text-[10px]">
                        <BuildDate />
                    </div>
                )}
            </nav>
        </div>
    );
}

interface NavSectionProps {
    section: MenuSection;
    pathname: string;
    isExpanded: boolean;
}

function NavSection({ section, pathname, isExpanded }: NavSectionProps) {
    const [expanded, setExpanded] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);
    const toggleExpand = useCallback(() => setExpanded((x: boolean) => !x), []);

    return (
        <div className="mb-2">
            {isExpanded ? (
                <div
                    className="jira-sidebar-section flex items-center justify-between px-3 py-1.5 cursor-pointer text-[10.5px] font-semibold uppercase tracking-[0.08em] group/section select-none"
                    onClick={toggleExpand}
                >
                    <span>{section.name}</span>
                    <span className="text-[9px] opacity-0 group-hover/section:opacity-100 transition-opacity">
                        {expanded ? Icons.angleDown : Icons.angleRight}
                    </span>
                </div>
            ) : (
                <div className="h-3" />
            )}
            <div
                ref={contentRef}
                className="space-y-0.5 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
                style={{
                    maxHeight: expanded ? `${section.items.length * 40}px` : '0px',
                    opacity: expanded ? 1 : 0,
                }}
            >
                {section.items.map((menu: MenuItem, i: number) => (
                    <NavItem key={i} menu={menu} pathname={pathname} isExpanded={isExpanded} />
                ))}
            </div>
        </div>
    );
}

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
                    {menu.badge && (
                        <span
                            className={classNames('px-1.5 py-0.5 text-[10px] font-semibold rounded-full leading-tight', {
                                'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': menu.badge.variant === 'info',
                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300': menu.badge.variant === 'success',
                                'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300': menu.badge.variant === 'danger',
                            })}
                        >
                            {menu.badge.text}
                        </span>
                    )}
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

export default memo(NavSideBar);
