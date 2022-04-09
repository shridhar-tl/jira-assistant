import React, { PureComponent, Suspense } from 'react';
import { Route, Switch } from 'react-router-dom';
import * as router from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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
import { ContextMenu } from 'jsd-report';
import $ from 'jquery';
import AsideUserInfo from './AsideUserInfo';
import { setStartOfWeek } from '../../common/utils';

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
    setStartOfWeek(this.$session.CurrentUser.startOfWeek);

    this.$dashboard.onChange(() => this.setState({ menus: this.getMenus(userId) }));
    this.initBody();
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
    const items = navigation.items.map(p => {
      const route = { ...p };
      route.url = `/${userId}${route.url}`;
      return route;
    });

    const dashboards = this.$dashboard.getDashboards();

    if (dashboards?.length) {
      items.splice(1, 1, ...dashboards.map((p, i) => getDashboardMenu(p, i, userId)));
    }

    return { items };
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>;

  signOut = (e) => {
    e.preventDefault();
    this.props.history.push('/integrate');
  };

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
            <AppSidebarMinimizer />
          </AppSidebar>
          <main className="main">
            <DndProvider backend={HTML5Backend}>
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
                  </Switch>
                </Suspense>
              </Container>
            </DndProvider>
          </main>
        </div>
        <ContextMenu />
        <CustomDialog />
      </div>
    );
  }
}

export default DefaultLayout;
