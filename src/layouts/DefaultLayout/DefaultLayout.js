import React, { PureComponent, Suspense } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import * as router from 'react-router-dom';
import { Container } from 'reactstrap';

import "./DefaultLayout.scss";

import {
  AppAside,
  AppHeader,
  AppSidebar,
  AppSidebarFooter,
  AppSidebarForm,
  AppSidebarHeader,
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

const DefaultAside = React.lazy(() => import('./DefaultAside'));
const DefaultHeader = React.lazy(() => import('./DefaultHeader'));

class DefaultLayout extends PureComponent {
  constructor() {
    super();
    inject(this, "DashboardService", "SessionService", "CacheService");
    var { userId } = this.$session;
    this.state = { menus: this.getMenus(userId), userId };
  }

  UNSAFE_componentWillMount() {
    var { userId } = this.state;
    this.$dashboard.onChange(() => this.setState({ menus: this.getMenus(userId) }));
    this.initBody();
  }

  initBody() {
    var skinName = this.$cache.get('skin', true) || 'skin-blue';
    var isSideBarToggled = this.$cache.get('SideBarToggled');
    var isSideBarHidden = this.$cache.get('SideBarHidden');

    var body = $(document.body);
    body.addClass(skinName);

    if (isSideBarHidden) { body.addClass('sidebar-hidden brand-minimized'); }
    else if (isSideBarToggled) { body.addClass('sidebar-minimized brand-minimized'); }

    if (document.location.href.indexOf('?quick=true') > -1) {
      this.$session.isQuickView = true;
      body.addClass('quick-view');
    }
  }

  componentWillUnmount() {
    this.$dashboard.onChange(() => { });
  }

  getMenus(userId) {
    var dashboards = this.$dashboard.getDashboards();
    if (!dashboards || !dashboards.length) { return navigation; }

    var items = navigation.items.map(p => {
      var route = { ...p };
      route.url = "/" + userId + route.url;
      return route;
    });
    items.splice(1, 1, ...dashboards.map((p, i) => getDashboardMenu(p, i, userId)));
    return { items };
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  signOut(e) {
    e.preventDefault()
    this.props.history.push('/integrate');
  }

  render() {
    var { userId, menus } = this.state;

    return (
      <div className="app">
        <AppHeader fixed>
          <Suspense fallback={this.loading()}>
            <DefaultHeader onLogout={e => this.signOut(e)} />
          </Suspense>
        </AppHeader>
        <div className="app-body">
          <AppSidebar fixed display="lg">
            <AppSidebarHeader />
            <AppSidebarForm />
            <Suspense>
              <AppSidebarNav navConfig={menus} {...this.props} router={router} />
            </Suspense>
            <AppSidebarFooter />
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
                        path={"/" + userId + route.path}
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
          <AppAside fixed>
            <Suspense fallback={this.loading()}>
              <DefaultAside />
            </Suspense>
          </AppAside>
        </div>
        <ContextMenu />
      </div>
    );
  }
}

export default DefaultLayout;
