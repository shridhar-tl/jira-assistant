import React, { PureComponent } from 'react';
import Dialog from "../../dialogs";
// sidebar nav config
import navigation, { getDashboardMenu } from '../../_nav';
import { inject } from '../../services/injector-service';
import { ContextMenu } from '../../externals/jsd-report';
import { setStartOfWeek } from '../../common/utils';
import { WorklogContextProvider } from '../../common/context';
import { isWebBuild, redirectToRoute } from '../../constants/build-info';
import AppContent from './AppContent';
import { withRouter } from '../../pollyfills';
import NavSideBar from './NavSideBar';
import "./DefaultLayout.scss";

const DefaultHeader = React.lazy(() => import('./DefaultHeader'));

class DefaultLayout extends PureComponent {
  constructor() {
    super();
    inject(this, "DashboardService", "SessionService", "SettingsService", "CacheService", "WorklogTimerService", "MessageService", "AppBrowserService");
    const { userId } = this.$session;
    this.state = { menus: this.getMenus(userId), userId };

    if (document.location.href.indexOf('?quick=true') > -1) {
      this.$session.isQuickView = true;
    }
  }

  componentDidMount() {
    const { userId } = this.state;
    setStartOfWeek(this.$session.CurrentUser.startOfWeek);

    // This is a workaround to keep the background sw alive in chromium
    this.$jaBrowserExtn.connectAndKeepAlive(this.loadTracker);
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

    if (this.$session.isQuickView) {
      body.add('quick-view');
    }

    const skinName = (await this.$settings.get('skin', true)) || 'skin-blue';
    body.add(skinName);
  }

  componentWillUnmount() {
    this.$dashboard.onChange(() => { /* Nothing to be done here */ });
    window.removeEventListener('focus', this.loadTracker);
  }

  getMenus(userId) {
    const items = navigation.map(p => {
      const { items, ...section } = p;
      section.items = items.map(p => {
        const route = { ...p };
        if (!route.external) {
          route.url = `/${userId}${route.url}`;
        }
        return route;
      });

      return section;
    });

    const dashboards = this.$dashboard.getDashboards();

    if (dashboards?.length) {
      items[0].items.splice(0, 1, ...dashboards.map((p, i) => getDashboardMenu(p, i, userId)));
    }

    return items;
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>;

  signOut = (e) => {
    e.preventDefault();
    this.$cache.clear();
    this.$settings.set('CurrentUserId');
    //this.$settings.set('CurrentJiraUrl');
    if (isWebBuild) {
      redirectToRoute();
    } else {
      this.props.navigate('/integrate');
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
    const { menus } = this.state;

    return (
      <WorklogContextProvider value={this.worklogContextProps}>
        <div className="app">
          <DefaultHeader onLogout={this.signOut} />
          <div className="app-body">
            <NavSideBar onLogout={this.signOut} menus={menus} navigate={this.props.navigate} location={this.props.location} />
            <main className="main">
              <AppContent loader={this.loading} />
            </main>
          </div>
          <ContextMenu />
        </div>
      </WorklogContextProvider>
    );
  }
}

export default withRouter(DefaultLayout);
