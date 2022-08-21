import React, { PureComponent, Suspense } from 'react';
import { Route, Switch } from 'react-router-dom';
import * as router from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container } from 'reactstrap';
import Dialog, { CustomDialog } from "../../dialogs";

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
import AsideUserInfo from './AsideUserInfo';
import { setStartOfWeek } from '../../common/utils';
import BuildDate from './BuildDate';
import { WorklogContextProvider } from '../../common/context';
import { isWebBuild } from '../../constants/build-info';

const DefaultHeader = React.lazy(() => import('./DefaultHeader'));

class DefaultLayout extends PureComponent {
  constructor() {
    super();
    inject(this, "DashboardService", "SessionService", "SettingsService", "CacheService", "WorklogTimerService", "MessageService");
    const { userId } = this.$session;
    this.state = { menus: this.getMenus(userId), userId };
    this.initApp();
  }

  initApp() {
    const { userId } = this.state;
    setStartOfWeek(this.$session.CurrentUser.startOfWeek);

    this.loadTracker();
    window.addEventListener('focus', this.loadTracker);

    this.$dashboard.onChange(() => this.setState({ menus: this.getMenus(userId) }));
    this.initBody();
  }

  loadTracker = () => this.$wltimer.getCurrentTimer().then((entry) => {
    const oldKey = this.state.timerEntry?.key;
    this.setTimer(entry, oldKey && oldKey !== entry?.key);
  });

  async initBody() {
    const body = document.body.classList;

    if (document.location.href.indexOf('?quick=true') > -1) {
      this.$session.isQuickView = true;
      body.add('quick-view');
    }

    const skinName = (await this.$settings.get('skin', true)) || 'skin-blue';
    body.add(skinName);
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
    this.$cache.clear();
    this.$settings.set('CurrentUserId');
    this.$settings.set('CurrentJiraUrl');
    if (isWebBuild) {
      document.location.href = '/';
    } else {
      this.props.history.push('/integrate');
    }
  };

  setTimer = (timerEntry, needReload = false) => {
    this.worklogContextProps = { ...this.worklogContextProps, needReload, timerEntry };
    this.setState({ timerEntry });
  };

  worklogContextProps = {
    getElapsedTimeInSecs: () => {
      const { timerEntry } = this.state;
      if (!timerEntry) { return null; }
      const { key, started, lapse, description } = timerEntry;
      const curTime = new Date().getTime();
      if (started >= curTime) {
        this.$message.error('System time has changed since timer has started. Please stop and restart the timer.', 'Time mismatch');
        return { key, lapse: 0, description, isRunning: false, hasError: true };
      }
      const totalMS = (started > 0 ? (curTime - started) : 0) + (lapse || 0);

      return { key, lapse: Math.round(totalMS / 1000), description, isRunning: started > 0 };
    },
    setUpdates: this.setTimer,
    startTimer: async (key, userId) => {
      if (!userId) {
        userId = this.$session.userId;
      }

      try {
        let result = await this.$wltimer.startTimer(userId, key);
        if (result?.isActive) {
          Dialog.yesNo(<>Already timer is running for "{result?.entry?.key}".
            <br /><br />
            Would you like to stop it and start new timer?</>, 'Timer running').then(async () => {
              result = await this.$wltimer.startTimer(userId, key, null, true);
              this.setTimer(result, true);
            });
        } else {
          this.setTimer(result);
        }
      }
      catch (err) {
        this.$message.error(err.message);
      }
    },
    resumeTimer: async () => this.setTimer(await this.$wltimer.resumeTimer()),
    pauseTimer: async () => this.setTimer(await this.$wltimer.pauseTimer()),
    stopTimer: async () => this.setTimer(!(await this.$wltimer.stopTimer()), true)
  };

  render() {
    const { userId, menus } = this.state;

    return (
      <WorklogContextProvider value={this.worklogContextProps} >
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
              <AppSidebarMinimizer><BuildDate /></AppSidebarMinimizer>
            </AppSidebar>
            <main className="main">
              <DndProvider backend={HTML5Backend}>
                <Container fluid>
                  <Suspense fallback={this.loading()}>
                    <Switch>
                      {routes.map((route, idx) => (route.component ? (
                        <Route
                          key={idx}
                          path={`/${userId}${route.path}`}
                          exact={route.exact}
                          name={route.name}
                          render={props => (
                            <route.component {...props} />
                          )} />
                      ) : (null)))}
                    </Switch>
                  </Suspense>
                </Container>
              </DndProvider>
            </main>
          </div>
          <ContextMenu />
          <CustomDialog />
        </div>
      </WorklogContextProvider>
    );
  }
}

export default DefaultLayout;
