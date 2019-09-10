import React, { PureComponent, Suspense } from 'react';
import { Route, Switch } from 'react-router-dom';
import * as router from 'react-router-dom';
import { Container } from 'reactstrap';
import { CustomDialog } from "../../dialogs";

import "./DefaultLayout.scss";

import {
  //AppAside,
  AppHeader,
  AppSidebar,
  //AppSidebarFooter,
  AppSidebarMinimizer,
  AppSidebarNav2 as AppSidebarNav,
} from '@coreui/react';
// sidebar nav config
import navigation, { getDashboardMenu } from '../../_nav';
// routes config
import routes from '../../routes';
import { inject } from '../../services/injector-service';
import ContextMenu from '../../controls/ContextMenu';
import $ from 'jquery';
import AsideUserInfo from './AsideUserInfo';

//const DefaultAside = React.lazy(() => import('./DefaultAside'));
const DefaultHeader = React.lazy(() => import('./DefaultHeader'));

class DefaultLayout extends PureComponent {
  constructor() {
    super();
    inject(this, "DashboardService", "SessionService", "CacheService");
    const { userId } = this.$session;
    this.state = { menus: this.getMenus(userId), userId };
  }

  UNSAFE_componentWillMount() {
    const { userId } = this.state;
    this.$dashboard.onChange(() => this.setState({ menus: this.getMenus(userId) }));
    this.initBody();

    this.$cache.set("useNewUI", true, null, true);
  }

  initBody() {
    const skinName = this.$cache.get('skin', true) || 'skin-blue';
    const isSideBarToggled = this.$cache.get('SideBarToggled');
    const isSideBarHidden = this.$cache.get('SideBarHidden');

    const body = $(document.body);
    body.addClass(skinName.replace('-light', '')); //ToDo: once old version is removed, need to permenently update skin color instead of replace

    if (isSideBarHidden) { body.addClass('sidebar-hidden brand-minimized'); }
    else if (isSideBarToggled) { body.addClass('sidebar-minimized brand-minimized'); }

    if (document.location.href.indexOf('?quick=true') > -1) {
      this.$session.isQuickView = true;
      body.addClass('quick-view');
    }
  }

  componentWillUnmount() {
    this.$dashboard.onChange(() => { /* Nothing to be done here */ });
  }

  getMenus(userId) {
    const dashboards = this.$dashboard.getDashboards();
    if (!dashboards || !dashboards.length) { return navigation; }

    const items = navigation.items.map(p => {
      const route = { ...p };
      route.url = `/${userId}${route.url}`;
      return route;
    });
    items.splice(1, 1, ...dashboards.map((p, i) => getDashboardMenu(p, i, userId)));
    return { items };
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  signOut = (e) => {
    e.preventDefault();
    this.props.history.push('/integrate');
  }

  render() {
    const { userId, menus } = this.state;

    return (
      <div className="app">
        <AppHeader fixed>
          <Suspense fallback={this.loading()}>
            <DefaultHeader onLogout={this.signOut} />
          </Suspense>
        </AppHeader>
        <div className="app-body">
          <AppSidebar fixed display="lg">
            <AsideUserInfo onLogout={this.signOut} />
            <Suspense>
              <AppSidebarNav navConfig={menus} {...this.props} router={router} />
            </Suspense>
            {/*<AppSidebarFooter />*/}
            <AppSidebarMinimizer />
          </AppSidebar>
          <main className="main">
            <Container fluid>
              <Suspense fallback={this.loading()}>
                <Switch>
                  {routes.map((route, idx) => {
                    return route.component ? (
                      <Route
                        key={idx}
                        path={`/${userId}${route.path}`}
                        exact={route.exact}
                        name={route.name}
                        render={props => (
                          <route.component {...props} />
                        )} />
                    ) : (null);
                  })}
                  {/*<Redirect from="/" to="/dashboard/0" />*/}
                </Switch>
              </Suspense>
            </Container>
          </main>
          {/*<AppAside fixed>
            <Suspense fallback={this.loading()}>
              <DefaultAside />
            </Suspense>
          </AppAside>*/}
        </div>
        <ContextMenu />
        <CustomDialog />
      </div>
    );
  }
}

export default DefaultLayout;
