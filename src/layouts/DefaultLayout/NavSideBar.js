import React from 'react';
import classNames from 'classnames';
import { Link } from 'src/controls';
import BuildDate from './BuildDate';
import { Icons } from 'src/constants/icons';
import './NavSideBar.scss';

function NavSideBar({ onLogout, menus, location: { pathname } }) {
    const [isOpen, setSideBarVisibility] = React.useState(true);
    const [isHovering, setCursorInSidebar] = React.useState(false);

    const toggleSidebar = React.useCallback(() => {
        setSideBarVisibility(isOpen => !isOpen);
        setCursorInSidebar(false);
    }, [setSideBarVisibility, setCursorInSidebar]);

    const enterSideBar = React.useCallback(() => setCursorInSidebar(true), [setCursorInSidebar]);
    const leaveSideBar = React.useCallback(() => setCursorInSidebar(false), [setCursorInSidebar]);

    const className = classNames('sidebar-container', { open: isOpen, hover: isHovering });

    return (
        <div className={className} onMouseLeave={leaveSideBar}>
            <div className="sidebar-placeholder" />
            <div className="sidebar-toggler" onMouseEnter={isHovering ? enterSideBar : undefined}            >
                <button tabIndex={0} title={isOpen ? "Collapse" : "Expand"} onClick={toggleSidebar}>
                    {isOpen ? Icons.angleLeft : Icons.angleRight}
                </button>
            </div>
            <nav onMouseEnter={enterSideBar}>
                <div className="sidebar-content">
                    {menus.map((section, i) => (<NavSection key={i} section={section} title={section.name} pathname={pathname} />))}
                </div>
                <div className="build-info">
                    <BuildDate />
                </div>
            </nav>
        </div>
    );
}

function NavSection({ section, pathname }) {
    const [expanded, setExpanded] = React.useState(true);
    const toggleExpand = React.useCallback(() => setExpanded(x => !x), [setExpanded]);

    return (<div className={`nav-section${expanded ? ' expanded' : ' collapsed'}`}>
        <span className="section">
            <span className="toggle-icon" onClick={toggleExpand}>
                {expanded ? Icons.angleDown : Icons.angleRight}
            </span>
            <div className="section-name">{section.name}</div>
        </span>
        {expanded && section.items.map((menu, i) => <NavItem key={i} menu={menu} pathname={pathname} />)}
    </div>);
}

function NavItem({ menu, pathname }) {
    const isSelected = menu.url === pathname;

    return (
        <span className={`menu${isSelected ? ' selected' : ''}`}>
            <Link href={menu.url} newTab={menu.external || false}>
                <span className="wrapper">
                    <span className={`icon ${menu.icon}`} />
                    <span className="menu-text">{menu.name}</span>
                    {menu.badge && (<span className={`badge bg-${menu.badge.variant}`}>{menu.badge.text}</span>)}
                </span>
            </Link>
        </span>
    );
}

export default React.memo(NavSideBar);