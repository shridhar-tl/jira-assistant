/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { Link } from 'react-router-dom';
import BuildDate from './BuildDate';
import './NavSideBar.scss';

function NavItem({ menu, pathname }) {
    const isSelected = menu.url === pathname;

    return (<li className={isSelected ? 'nav-active' : undefined}>
        <Link key={menu.id} testId={menu.id} to={menu.url} target={menu.external ? "_blank" : undefined} rel="noreferrer noopener"
            className={`nav-link ${isSelected ? "selected " : ""}btn-menu`}
        >
            <span className={`icon ${menu.icon}`} />
            {menu.name}
            {menu.badge ? (<span className={`float-end badge bg-${menu.badge.variant}`}>{menu.badge.text}</span>) : null}
        </Link>
    </li>);
}

function NavSection({ section, pathname }) {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const toggleExpand = React.useCallback(() => setIsExpanded(val => !val), [setIsExpanded]);

    const isActive = section.items.some(m => m.url === pathname);

    return (<li className={`nav-parent${isExpanded ? ' nav-expanded' : ''}${isActive ? ' nav-active' : ''}`}>
        <a className="nav-link" onClick={toggleExpand}>
            <i className={section.icon} aria-hidden="true"></i>
            <span>{section.name}</span>
        </a>
        <ul className="nav nav-children">
            {section.items.map((menu, i) => <NavItem key={i} menu={menu} pathname={pathname} />)}
        </ul>
    </li>);

}

const NavSideBar = function ({ onLogout, menus, navigate, location: { pathname } = {} }) {
    return (<aside id="sidebar-left" className="sidebar-left">
        <div className="nano has-scrollbar">
            <div className="nano-content" tabIndex="0" style={{ right: '-17px' }}>
                <nav id="menu" className="nav-main" role="navigation">
                    <ul className="nav nav-main">
                        {menus.map((section, i) => <NavSection key={i} section={section} pathname={pathname} />)}
                    </ul>
                </nav>
            </div>
        </div>
        <div className="sidebar-header">
            <div className="sidebar-title">
                <BuildDate />
            </div>
            <div className="sidebar-toggle d-none d-md-block">
                <i className="fas fa-indent" aria-label="Toggle sidebar" />
            </div>
        </div>
    </aside>);
};

export default React.memo(NavSideBar);