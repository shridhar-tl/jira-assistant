import { memo, useCallback, useState } from 'react';

import { Icons } from '@/constants/icons';
import type { MenuItem, MenuSection } from '@/constants/navigation';

import NavItem from './NavItem';
import SidebarFooter from './SidebarFooter';

interface NavMenuProps {
    menus: MenuSection[];
    userId?: number;
    pathname: string;
    isExpanded: boolean;
    onPanelToggle: (isOpen: boolean) => void;
    onDialogOpen: () => void;
}

function NavMenu({ menus, userId, pathname, isExpanded, onPanelToggle, onDialogOpen }: NavMenuProps) {
    return (
        <>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-3 px-2">
                {menus.map((section, i) => (
                    <NavSection key={i} section={section} pathname={pathname} isExpanded={isExpanded} />
                ))}
            </div>
            <SidebarFooter
                userId={userId}
                pathname={pathname}
                isExpanded={isExpanded}
                onPanelToggle={onPanelToggle}
                onDialogOpen={onDialogOpen}
            />
        </>
    );
}

interface NavSectionProps {
    section: MenuSection;
    pathname: string;
    isExpanded: boolean;
}

function NavSection({ section, pathname, isExpanded }: NavSectionProps) {
    const [expanded, setExpanded] = useState(true);
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

export default memo(NavMenu);
