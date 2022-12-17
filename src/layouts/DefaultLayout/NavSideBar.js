import React from 'react';
import {
    ButtonItem,
    LinkItem,
    NavigationFooter,
    NavigationHeader,
    NestableNavigationContent,
    Section,
    SideNavigation
} from '@atlaskit/side-navigation';
import AsideUserInfo from './AsideUserInfo';
import BuildDate from './BuildDate';
import './NavSideBar.scss';

const NavSideBar = function ({ onLogout, menus, navigate, location }) {
    const renderMenu = menu => {
        const Item = menu.external ? LinkItem : ButtonItem;
        return (<Item key={menu.id} testId={menu.id} href={menu.url} target="_blank" rel="noreferrer noopener"
            className="btn-menu" onClick={menu.external ? undefined : () => navigate(menu.url)}
            iconBefore={<span className={menu.icon} />} isSelected={menu.url === location.pathname}
            iconAfter={menu.badge ? (<span class={`badge bg-${menu.badge.variant}`}>{menu.badge.text}</span>) : undefined}
        >{menu.name}</Item>);
    };

    return (<div className="sidebar-container sidebar">
        <SideNavigation label="Navigation Menus" testId="side-navigation">
            <NavigationHeader className="nav-header">
                <AsideUserInfo onLogout={onLogout} />
            </NavigationHeader>
            <NestableNavigationContent initialStack={[]} testId="nestable-navigation-content"            >
                {menus.map((section, i) => (<Section key={i} title={section.name}>
                    {section.items.map(renderMenu)}
                </Section>))}
            </NestableNavigationContent>
            <NavigationFooter className="nav-footer" testId="nav-footer">
                <BuildDate />
            </NavigationFooter>
        </SideNavigation>
    </div>);
};

export default React.memo(NavSideBar);